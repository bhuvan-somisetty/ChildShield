import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/models/message.dart';
import '../data/repositories/chat_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Realtime family chat for one pairing. History via REST; live send / typing /
/// read receipts over Socket.IO (the parent is "me"). Mirrors the web contract:
/// the server echoes `chat:message` to the room (incl. sender), so we never
/// optimistically duplicate.
class ChatController extends ChangeNotifier {
  ChatController({required ChatRepository repo, required SocketService socket, required this.pairingId, this.me = 'parent'})
      : _repo = repo,
        _socket = socket;

  final ChatRepository _repo;
  final SocketService _socket;
  final String pairingId;
  final String me; // 'parent' | 'child' — which side "I" am
  String get _me => me;

  final List<void Function()> _disposers = [];
  Timer? _typingTimer;

  List<Message> messages = [];
  bool loading = true;
  String? error;
  bool peerTyping = false;

  Future<void> load() async {
    try {
      messages = await _repo.messages(pairingId);
    } catch (e) {
      error = 'Could not load messages.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
    _markRead();
  }

  bool _forThis(dynamic data) => data is Map && (data['pairingId'] == null || data['pairingId'] == pairingId);

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.chatMessage, (data) {
      if (!_forThis(data)) return;
      final m = Message.fromJson(Map<String, dynamic>.from(data as Map));
      if (messages.any((x) => x.id == m.id)) return;
      messages = [...messages, m];
      notifyListeners();
      if (m.from != _me) _markRead();
    }));
    _disposers.add(_socket.on(SocketEvents.chatStatus, (data) {
      if (data is! Map) return;
      final id = data['id']?.toString();
      final status = data['status']?.toString();
      if (id == null || status == null) return;
      final i = messages.indexWhere((x) => x.id == id);
      if (i == -1) return;
      messages = [...messages]..[i] = messages[i].copyWith(status: status);
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.chatTyping, (data) {
      if (!_forThis(data) || data is! Map) return;
      if (data['from'] == _me) return;
      peerTyping = data['isTyping'] == true;
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.chatRead, (data) {
      if (!_forThis(data) || data is! Map) return;
      if (data['reader'] == _me) return; // the other side read OUR messages
      messages = messages.map((m) => m.from == _me && m.status != 'read' ? m.copyWith(status: 'read') : m).toList();
      notifyListeners();
    }));
  }

  void send(String text) {
    final t = text.trim();
    if (t.isEmpty) return;
    _socket.emit(SocketEvents.chatSend, {'pairingId': pairingId, 'text': t});
    _setTyping(false);
  }

  void onInputChanged() {
    _setTyping(true);
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(milliseconds: 1500), () => _setTyping(false));
  }

  void _setTyping(bool isTyping) => _socket.emit(SocketEvents.chatTyping, {'pairingId': pairingId, 'isTyping': isTyping});

  void _markRead() {
    final ids = messages.where((m) => m.from != _me).map((m) => m.id).toList();
    if (ids.isNotEmpty) _socket.emit(SocketEvents.chatRead, {'pairingId': pairingId, 'ids': ids});
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
