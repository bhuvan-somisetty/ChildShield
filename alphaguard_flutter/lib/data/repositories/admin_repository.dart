import '../api/api_client.dart';
import '../models/feature_request.dart';
import '../models/support_ticket.dart';

/// Platform-admin endpoints (admin-gated server-side). Used by the admin
/// dashboard; non-admin tokens receive 403.
class AdminRepository {
  AdminRepository(this._api);
  final ApiClient _api;

  Future<({Map<String, dynamic> stats, List<SupportTicket> tickets})> tickets() async {
    final r = await _api.get('/admin/support/tickets') as Map<String, dynamic>;
    return (
      stats: (r['stats'] ?? const {}) as Map<String, dynamic>,
      tickets: (r['tickets'] as List).map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Future<TicketThread> ticket(String id) async {
    final r = await _api.get('/admin/support/tickets/$id') as Map<String, dynamic>;
    return TicketThread.fromJson(r);
  }

  Future<SupportTicket> updateTicket(String id, Map<String, dynamic> patch) async {
    final r = await _api.patch('/admin/support/tickets/$id', body: patch) as Map<String, dynamic>;
    return SupportTicket.fromJson(r['ticket'] as Map<String, dynamic>);
  }

  Future<TicketThread> reply(String id, String body, {bool internal = false}) async {
    final r = await _api.post('/admin/support/tickets/$id/comments', body: {'body': body, 'internal': internal}) as Map<String, dynamic>;
    return TicketThread.fromJson(r);
  }

  Future<List<FeatureRequest>> features() async {
    final r = await _api.get('/admin/feature-requests') as Map<String, dynamic>;
    return (r['features'] as List).map((e) => FeatureRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<FeatureRequest> updateFeature(String id, Map<String, dynamic> patch) async {
    final r = await _api.patch('/admin/feature-requests/$id', body: patch) as Map<String, dynamic>;
    return FeatureRequest.fromJson(r['feature'] as Map<String, dynamic>);
  }

  Future<void> createAnnouncement({required String title, String? description, String priority = 'normal'}) =>
      _api.post('/admin/announcements', body: {'title': title, if (description != null) 'description': description, 'priority': priority, 'status': 'published'});

  Future<void> createChangelog({required String version, List<String>? added, List<String>? fixed, List<String>? improved}) =>
      _api.post('/admin/changelog', body: {'version': version, 'added': added ?? [], 'fixed': fixed ?? [], 'improved': improved ?? []});

  Future<Map<String, dynamic>> health() async {
    final r = await _api.get('/admin/health') as Map<String, dynamic>;
    return r;
  }
}
