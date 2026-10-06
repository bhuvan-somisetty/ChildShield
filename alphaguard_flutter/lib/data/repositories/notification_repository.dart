import '../api/api_client.dart';
import '../models/notification_item.dart';

/// Notifications API: fetch inbox, badge count, mark read, preferences, and
/// delivery status reporting. Connects to the backend notification endpoints.
class NotificationRepository {
  NotificationRepository(this._api);
  final ApiClient _api;

  // ── Inbox ──────────────────────────────────────────────────────────────
  Future<List<NotificationItem>> list({
    String? type,
    bool? unread,
    int limit = 50,
    int offset = 0,
  }) async {
    final query = <String, String>{
      'limit': '$limit',
      'offset': '$offset',
      if (type != null) 'type': type,
      if (unread != null) 'unread': '$unread',
    };
    final r = await _api.get('/notifications', query: query) as Map<String, dynamic>;
    return (r['notifications'] as List)
        .map((e) => NotificationItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Badge count ────────────────────────────────────────────────────────
  Future<int> unreadCount() async {
    final r = await _api.get('/notifications/unread-count') as Map<String, dynamic>;
    return (r['count'] as num).toInt();
  }

  // ── Mark read ──────────────────────────────────────────────────────────
  Future<void> markRead(String id) => _api.post('/notifications/$id/read');

  Future<void> markAllRead() => _api.post('/notifications/read-all');

  // ── Preferences ────────────────────────────────────────────────────────
  Future<NotificationPreferences> getPreferences() async {
    final r = await _api.get('/notifications/preferences') as Map<String, dynamic>;
    return NotificationPreferences.fromJson(r['preferences'] as Map<String, dynamic>);
  }

  Future<NotificationPreferences> savePreferences(NotificationPreferences prefs) async {
    final r = await _api.post('/notifications/preferences', body: prefs.toJson()) as Map<String, dynamic>;
    return NotificationPreferences.fromJson(r['preferences'] as Map<String, dynamic>);
  }

  // ── Delivery reporting ─────────────────────────────────────────────────
  /// Report that a push notification was received in foreground/background.
  Future<void> reportDelivered(String notificationId, {String? token}) =>
      _api.post('/notifications/$notificationId/delivery', body: {
        'status': 'delivered',
        if (token != null) 'token': token,
      });

  /// Report that the user tapped a push notification.
  Future<void> reportOpened(String notificationId, {String? token}) =>
      _api.post('/notifications/$notificationId/delivery', body: {
        'status': 'opened',
        if (token != null) 'token': token,
      });
}
