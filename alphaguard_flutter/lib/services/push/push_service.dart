import 'dart:io' show Platform;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../app_router.dart';
import '../../data/repositories/notification_repository.dart';
import '../../data/repositories/safety_repository.dart';

/// Background isolate handler — must be a top-level function. Firebase shows the
/// system notification automatically in background/terminated states; this runs
/// for data processing only.
@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  // No-op: the notification payload is displayed by the OS. Hook analytics here.
}

/// Push notifications (FCM → APNs on iOS). Registers the device token with the
/// backend so SOS/chat/alerts reach a backgrounded or closed app, and displays
/// foreground messages as local notifications.
///
/// Activates only when the app has Firebase platform config
/// (google-services.json / GoogleService-Info.plist). Without it, `init` fails
/// soft and the app continues on in-app/realtime notifications.
class PushService {
  PushService(this._safetyRepo, this._notificationRepo);
  final SafetyRepository _safetyRepo;
  final NotificationRepository _notificationRepo;

  final _local = FlutterLocalNotificationsPlugin();
  bool _ready = false;

  Future<void> init() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);

      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);

      // Local notifications channel for foreground display.
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings();
      await _local.initialize(
        const InitializationSettings(android: android, iOS: ios),
        onDidReceiveNotificationResponse: _onLocalTap,
      );

      // Foreground messages → show local notification + report delivered.
      FirebaseMessaging.onMessage.listen(_showForeground);

      // Background/terminated: app opened via notification tap.
      FirebaseMessaging.onMessageOpenedApp.listen(_onNotificationTap);

      // Check if app was launched from a terminated state via notification.
      final initial = await messaging.getInitialMessage();
      if (initial != null) _onNotificationTap(initial);

      // Token registration (+ refresh).
      messaging.onTokenRefresh.listen(_register);
      _ready = true;
    } catch (e) {
      if (kDebugMode) debugPrint('[push] disabled (no Firebase config?): $e');
      _ready = false;
    }
  }

  /// Called after authentication to register this device's token with the user.
  Future<void> registerForUser() async {
    if (!_ready) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _register(token);
    } catch (e) {
      if (kDebugMode) debugPrint('[push] token register failed: $e');
    }
  }

  Future<void> _register(String token) async {
    final platform = Platform.isIOS ? 'ios' : 'android';
    try {
      await _safetyRepo.registerPush(token, platform);
    } catch (_) {/* will retry on next launch / refresh */}
  }

  Future<void> _showForeground(RemoteMessage m) async {
    final n = m.notification;
    if (n == null) return;

    // Report delivered status to backend.
    final notificationId = m.data['notificationId'] as String?;
    if (notificationId != null) {
      _notificationRepo.reportDelivered(notificationId).catchError((_) {});
    }

    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        'alphaguard_alerts',
        'AlphaGuard Alerts',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );
    await _local.show(
      n.hashCode,
      n.title,
      n.body,
      details,
      payload: _buildPayload(m.data),
    );
  }

  /// Called when user taps a FCM notification (background/terminated).
  void _onNotificationTap(RemoteMessage m) {
    final notificationId = m.data['notificationId'] as String?;
    if (notificationId != null) {
      _notificationRepo.reportOpened(notificationId).catchError((_) {});
    }
    _handleDeepLink(m.data);
  }

  /// Called when user taps a local notification shown in foreground.
  void _onLocalTap(NotificationResponse response) {
    final payload = response.payload;
    if (payload == null) return;
    // payload format: "notificationId:type:path"
    final parts = payload.split(':');
    if (parts.length >= 3) {
      final notifId = parts[0];
      final path = parts.sublist(2).join(':');
      if (notifId.isNotEmpty) {
        _notificationRepo.reportOpened(notifId).catchError((_) {});
      }
      if (path.isNotEmpty) handleDeepLink(path);
    }
  }

  void _handleDeepLink(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    final path = _pathForType(type, data);
    if (path != null) handleDeepLink(path);
  }

  String? _pathForType(String? type, Map<String, dynamic> data) {
    switch (type) {
      case 'sos':
        return '/sos';
      case 'zone':
      case 'location':
        return '/radar';
      case 'chat':
        return '/chat';
      case 'tasks':
      case 'task':
        return '/tasks';
      case 'rewards':
      case 'reward':
        return '/rewards';
      case 'device':
        return '/devices';
      case 'security':
      case 'screentime':
        return '/notifications';
      default:
        return '/notifications';
    }
  }

  /// Encodes FCM data as a local notification payload string.
  String _buildPayload(Map<String, dynamic> data) {
    final notifId = data['notificationId'] ?? '';
    final type = data['type'] ?? '';
    final path = _pathForType(type as String?, data) ?? '/notifications';
    return '$notifId:$type:$path';
  }
}
