import '../api/api_client.dart';
import '../models/announcement.dart';
import '../models/changelog_entry.dart';
import '../models/feature_request.dart';
import '../models/support_ticket.dart';

/// User-facing Help & Support: tickets, feature requests, announcements,
/// changelog, ratings.
class SupportRepository {
  SupportRepository(this._api);
  final ApiClient _api;

  // Tickets
  Future<List<SupportTicket>> tickets() async {
    final r = await _api.get('/support/tickets') as Map<String, dynamic>;
    return (r['tickets'] as List).map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SupportTicket> createTicket({required String title, required String issueType, String? description, String priority = 'medium'}) async {
    final r = await _api.post('/support/tickets', body: {
      'title': title,
      'issueType': issueType,
      if (description != null) 'description': description,
      'priority': priority,
    }) as Map<String, dynamic>;
    return SupportTicket.fromJson(r['ticket'] as Map<String, dynamic>);
  }

  Future<TicketThread> thread(String id) async {
    final r = await _api.get('/support/tickets/$id') as Map<String, dynamic>;
    return TicketThread.fromJson(r);
  }

  Future<TicketThread> comment(String id, String body) async {
    final r = await _api.post('/support/tickets/$id/comments', body: {'body': body}) as Map<String, dynamic>;
    return TicketThread.fromJson(r);
  }

  Future<void> close(String id) => _api.post('/support/tickets/$id/close');

  // Feature requests
  Future<List<FeatureRequest>> features() async {
    final r = await _api.get('/feature-requests') as Map<String, dynamic>;
    return (r['features'] as List).map((e) => FeatureRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<FeatureRequest> createFeature({required String title, String? description}) async {
    final r = await _api.post('/feature-requests', body: {'title': title, if (description != null) 'description': description}) as Map<String, dynamic>;
    return FeatureRequest.fromJson(r['feature'] as Map<String, dynamic>);
  }

  // Announcements + changelog (read)
  Future<List<Announcement>> announcements() async {
    final r = await _api.get('/announcements') as Map<String, dynamic>;
    return (r['announcements'] as List).map((e) => Announcement.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ChangelogEntry>> changelog() async {
    final r = await _api.get('/changelog') as Map<String, dynamic>;
    return (r['changelog'] as List).map((e) => ChangelogEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  // Ratings
  Future<void> rate(int stars, {String? feedback}) => _api.post('/ratings', body: {'stars': stars, if (feedback != null) 'feedback': feedback});
}
