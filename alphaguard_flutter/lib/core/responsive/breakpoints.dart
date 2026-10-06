import 'package:flutter/widgets.dart';

/// Adaptive breakpoints. These match the web app's verified widths
/// (320 / 375 / 414 / 768 / 1024 / 1366) and drive every responsive decision —
/// there are NO fixed pixel widths/heights anywhere in the UI.
enum DeviceClass { compactPhone, phone, largePhone, tablet, largeTablet, desktop }

abstract class Breakpoints {
  static const double phone = 360; // ≥360 standard phone
  static const double largePhone = 400; // ≥400 large phone
  static const double tablet = 600; // ≥600 small tablet / foldable unfolded
  static const double largeTablet = 905; // ≥905 large tablet / iPad landscape
  static const double desktop = 1240; // ≥1240 desktop

  static DeviceClass classify(double width) {
    if (width < phone) return DeviceClass.compactPhone; // 320px
    if (width < largePhone) return DeviceClass.phone; // 375px
    if (width < tablet) return DeviceClass.largePhone; // 414px
    if (width < largeTablet) return DeviceClass.tablet; // 768px
    if (width < desktop) return DeviceClass.largeTablet; // 1024px
    return DeviceClass.desktop; // 1366px+
  }

  /// The max content width for the centered phone-style column. On larger
  /// screens content is capped + centered (the app is mobile-first), exactly
  /// like the web client's max-w-[440px] column.
  static double contentMaxWidth(double width) {
    final c = classify(width);
    switch (c) {
      case DeviceClass.compactPhone:
      case DeviceClass.phone:
      case DeviceClass.largePhone:
        return double.infinity; // fill the phone
      case DeviceClass.tablet:
        return 520;
      case DeviceClass.largeTablet:
      case DeviceClass.desktop:
        return 560;
    }
  }
}
