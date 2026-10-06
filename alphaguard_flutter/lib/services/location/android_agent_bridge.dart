import 'package:flutter/services.dart';

class AndroidAgentBridge {
  static const MethodChannel _channel = MethodChannel('ai.alphaguard/agent');

  static Future<bool> requestOverlayPermission() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('requestOverlayPermission');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> startTracking() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('startTracking');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> stopTracking() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('stopTracking');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<AndroidAgentStatus> getTrackingStatus() async {
    try {
      final Map<dynamic, dynamic>? res = await _channel.invokeMethod<Map<dynamic, dynamic>>('getTrackingStatus');
      if (res == null) return AndroidAgentStatus.unknown();
      return AndroidAgentStatus.fromMap(Map<String, dynamic>.from(res));
    } catch (_) {
      return AndroidAgentStatus.unknown();
    }
  }

  static Future<bool> requestUsageAccess() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('requestUsageAccess');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestBatteryOptimizationExemption() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('requestBatteryOptimizationExemption');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestLocationPermission() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('requestLocationPermission');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestBackgroundLocationPermission() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('requestBackgroundLocationPermission');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestNotificationPermission() async {
    try {
      final bool? success = await _channel.invokeMethod<bool>('requestNotificationPermission');
      return success ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> ringDevice() async {
    try { await _channel.invokeMethod<void>('ringDevice'); } catch (_) {}
  }

  static Future<void> toggleFlashlight({bool on = true}) async {
    try { await _channel.invokeMethod<void>('toggleFlashlight', {'on': on}); } catch (_) {}
  }
}

class AndroidAgentStatus {
  AndroidAgentStatus({
    required this.isTracking,
    required this.locationPermission,
    required this.backgroundLocationPermission,
    required this.usageAccessPermission,
    required this.overlayPermission,
    required this.notificationPermission,
    required this.isBatteryExempt,
    required this.deviceManufacturer,
  });

  final bool isTracking;
  final String locationPermission; // "granted" | "denied"
  final String backgroundLocationPermission; // "granted" | "denied"
  final String usageAccessPermission; // "granted" | "denied"
  final String overlayPermission; // "granted" | "denied"
  final bool notificationPermission;
  final bool isBatteryExempt;
  final String deviceManufacturer;

  factory AndroidAgentStatus.fromMap(Map<String, dynamic> m) {
    return AndroidAgentStatus(
      isTracking: m['isTracking'] == true,
      locationPermission: m['locationPermission']?.toString() ?? 'denied',
      backgroundLocationPermission: m['backgroundLocationPermission']?.toString() ?? 'denied',
      usageAccessPermission: m['usageAccessPermission']?.toString() ?? 'denied',
      overlayPermission: m['overlayPermission']?.toString() ?? 'denied',
      notificationPermission: m['notificationPermission'] == true,
      isBatteryExempt: m['isBatteryExempt'] == true,
      deviceManufacturer: m['deviceManufacturer']?.toString() ?? 'unknown',
    );
  }

  factory AndroidAgentStatus.unknown() {
    return AndroidAgentStatus(
      isTracking: false,
      locationPermission: 'denied',
      backgroundLocationPermission: 'denied',
      usageAccessPermission: 'denied',
      overlayPermission: 'denied',
      notificationPermission: false,
      isBatteryExempt: false,
      deviceManufacturer: 'unknown',
    );
  }
}
