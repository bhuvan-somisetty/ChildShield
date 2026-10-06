import 'package:flutter/foundation.dart';

import '../data/api/api_exception.dart';
import '../data/models/notification_item.dart';
import '../data/repositories/notification_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Manages the notification inbox, badge count, preferences, and realtime
/// socket events for the parent app.
class NotificationController extends ChangeNotifier {
  NotificationController({
    required NotificationRepository repo,
    required SocketService socket,
  })  : _repo = repo,
        _socket = socket;

  final NotificationRepository _repo;
  final SocketService _socket;
  final List<void Function()> _disposers = [];

  List<NotificationItem> _items = [];
  List<NotificationItem> get items => _items;

  NotificationPreferences _prefs = const NotificationPreferences();
  NotificationPreferences get prefs => _prefs;

  int get unreadCount => _items.where((n) => !n.read).length;

  bool loading = false;
  String? error;

  /// Call once after authentication to bootstrap inbox and socket listeners.
  Future<void> init() async {
    _listenSocket();
    await Future.wait([load(), loadPreferences()]);
  }

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      _items = await _repo.list(limit: 100);
    } on ApiException catch (e) {
      error = e.message;
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loadPreferences() async {
    try {
      _prefs = await _repo.getPreferences();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> savePreferences(NotificationPreferences updated) async {
    _prefs = updated;
    notifyListeners();
    try {
      _prefs = await _repo.savePreferences(updated);
      notifyListeners();
    } catch (e) {
      error = e.toString();
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    // Optimistic update.
    _items = _items.map((n) => n.id == id ? n.copyWith(read: true) : n).toList();
    notifyListeners();
    try {
      await _repo.markRead(id);
    } catch (e) {
      if (kDebugMode) debugPrint('[notifications] markRead failed: $e');
    }
  }

  Future<void> markAllRead() async {
    _items = _items.map((n) => n.copyWith(read: true)).toList();
    notifyListeners();
    try {
      await _repo.markAllRead();
    } catch (e) {
      if (kDebugMode) debugPrint('[notifications] markAllRead failed: $e');
    }
  }

  Future<void> reportDelivered(String notificationId, {String? token}) async {
    try {
      await _repo.reportDelivered(notificationId, token: token);
    } catch (_) {}
  }

  Future<void> reportOpened(String notificationId, {String? token}) async {
    await markRead(notificationId);
    try {
      await _repo.reportOpened(notificationId, token: token);
    } catch (_) {}
  }

  void _listenSocket() {
    // Incoming new notification.
    _disposers.add(_socket.on(SocketEvents.notificationNew, (data) {
      if (data == null) return;
      final item = NotificationItem.fromJson(data as Map<String, dynamic>);
      // Prepend and deduplicate.
      _items = [item, ..._items.where((n) => n.id != item.id)];
      notifyListeners();
    }));

    // A notification was marked read (possibly on another device/co-parent).
    _disposers.add(_socket.on(SocketEvents.notificationRead, (data) {
      if (data == null) return;
      final id = (data as Map<String, dynamic>)['id'] as String?;
      if (id == null) return;
      _items = _items.map((n) => n.id == id ? n.copyWith(read: true) : n).toList();
      notifyListeners();
    }));

    // All notifications marked read from another session.
    _disposers.add(_socket.on(SocketEvents.notificationReadAll, (_) {
      _items = _items.map((n) => n.copyWith(read: true)).toList();
      notifyListeners();
    }));
  }

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    super.dispose();
  }
}
