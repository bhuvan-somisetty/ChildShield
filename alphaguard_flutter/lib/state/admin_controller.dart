import 'package:flutter/foundation.dart';

import '../data/api/api_exception.dart';
import '../data/models/feature_request.dart';
import '../data/models/support_ticket.dart';
import '../data/repositories/admin_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// Platform-admin dashboard state — tickets + feature requests, live over the
/// admin socket room. Non-admin sessions get an access error from the server.
class AdminController extends ChangeNotifier {
  AdminController({required AdminRepository repo, required SocketService socket})
      : _repo = repo,
        _socket = socket;

  final AdminRepository _repo;
  final SocketService _socket;
  final List<void Function()> _disposers = [];

  Map<String, dynamic> stats = const {};
  List<SupportTicket> tickets = [];
  List<FeatureRequest> features = [];
  bool loading = true;
  String? error;
  bool forbidden = false;

  AdminRepository get repo => _repo;

  Future<void> load() async {
    try {
      final t = await _repo.tickets();
      stats = t.stats;
      tickets = t.tickets;
      features = await _repo.features();
    } on ApiException catch (e) {
      if (e.isForbidden) forbidden = true;
      error = e.message;
    } catch (_) {
      error = 'Could not load admin data.';
    } finally {
      loading = false;
      notifyListeners();
    }
    if (!forbidden) _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    void refreshTicket(dynamic data) {
      final t = SupportTicket.fromJson(Map<String, dynamic>.from(data as Map));
      final i = tickets.indexWhere((x) => x.id == t.id);
      tickets = i == -1 ? [t, ...tickets] : ([...tickets]..[i] = t);
      notifyListeners();
    }

    _disposers.add(_socket.on(SocketEvents.supportTicketNew, refreshTicket));
    _disposers.add(_socket.on(SocketEvents.supportTicketUpdate, refreshTicket));
    _disposers.add(_socket.on(SocketEvents.featureNew, (data) {
      final f = FeatureRequest.fromJson(Map<String, dynamic>.from(data as Map));
      if (features.any((x) => x.id == f.id)) return;
      features = [f, ...features];
      notifyListeners();
    }));
  }

  Future<void> updateTicket(String id, Map<String, dynamic> patch) async {
    final t = await _repo.updateTicket(id, patch);
    final i = tickets.indexWhere((x) => x.id == id);
    if (i != -1) {
      tickets = [...tickets]..[i] = t;
      notifyListeners();
    }
  }

  Future<void> updateFeature(String id, Map<String, dynamic> patch) async {
    final f = await _repo.updateFeature(id, patch);
    final i = features.indexWhere((x) => x.id == id);
    if (i != -1) {
      features = [...features]..[i] = f;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
