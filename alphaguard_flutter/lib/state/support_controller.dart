import 'package:flutter/foundation.dart';

import '../data/models/announcement.dart';
import '../data/models/changelog_entry.dart';
import '../data/models/feature_request.dart';
import '../data/models/support_ticket.dart';
import '../data/repositories/support_repository.dart';
import '../services/socket/socket_events.dart';
import '../services/socket/socket_service.dart';

/// User-facing Help & Support state — tickets, feature requests, announcements,
/// changelog. Tickets/features stay live over the support socket events.
class SupportController extends ChangeNotifier {
  SupportController({required SupportRepository repo, required SocketService socket})
      : _repo = repo,
        _socket = socket;

  final SupportRepository _repo;
  final SocketService _socket;
  final List<void Function()> _disposers = [];

  List<SupportTicket> tickets = [];
  List<FeatureRequest> features = [];
  List<Announcement> announcements = [];
  List<ChangelogEntry> changelog = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    try {
      final res = await Future.wait([
        _repo.tickets(),
        _repo.features(),
        _repo.announcements(),
        _repo.changelog(),
      ]);
      tickets = res[0] as List<SupportTicket>;
      features = res[1] as List<FeatureRequest>;
      announcements = res[2] as List<Announcement>;
      changelog = res[3] as List<ChangelogEntry>;
    } catch (_) {
      error = 'Could not load support.';
    } finally {
      loading = false;
      notifyListeners();
    }
    _subscribe();
  }

  void _subscribe() {
    if (_disposers.isNotEmpty) return;
    _disposers.add(_socket.on(SocketEvents.supportTicketUpdate, (data) {
      final t = SupportTicket.fromJson(Map<String, dynamic>.from(data as Map));
      final i = tickets.indexWhere((x) => x.id == t.id);
      if (i != -1) {
        tickets = [...tickets]..[i] = t;
        notifyListeners();
      }
    }));
    _disposers.add(_socket.on(SocketEvents.featureUpdate, (data) {
      final f = FeatureRequest.fromJson(Map<String, dynamic>.from(data as Map));
      final i = features.indexWhere((x) => x.id == f.id);
      if (i != -1) {
        features = [...features]..[i] = f;
        notifyListeners();
      }
    }));
    _disposers.add(_socket.on(SocketEvents.announcementNew, (data) {
      announcements = [Announcement.fromJson(Map<String, dynamic>.from(data as Map)), ...announcements];
      notifyListeners();
    }));
    _disposers.add(_socket.on(SocketEvents.changelogNew, (data) {
      changelog = [ChangelogEntry.fromJson(Map<String, dynamic>.from(data as Map)), ...changelog];
      notifyListeners();
    }));
  }

  Future<void> reportIssue({required String title, required String issueType, String? description}) async {
    final t = await _repo.createTicket(title: title, issueType: issueType, description: description);
    tickets = [t, ...tickets];
    notifyListeners();
  }

  Future<void> requestFeature({required String title, String? description}) async {
    final f = await _repo.createFeature(title: title, description: description);
    features = [f, ...features];
    notifyListeners();
  }

  Future<void> rate(int stars, {String? feedback}) => _repo.rate(stars, feedback: feedback);

  SupportRepository get repo => _repo;

  @override
  void dispose() {
    for (final d in _disposers) {
      d();
    }
    _disposers.clear();
    super.dispose();
  }
}
