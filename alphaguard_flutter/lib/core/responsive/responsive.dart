import 'package:flutter/widgets.dart';
import 'breakpoints.dart';

/// Context helpers for adaptive layout. Everything reads from MediaQuery so the
/// UI reflows correctly on phones, tablets, iPads and foldables (including
/// fold/unfold and rotation) with no fixed dimensions.
extension ResponsiveContext on BuildContext {
  Size get screenSize => MediaQuery.sizeOf(this);
  double get screenWidth => MediaQuery.sizeOf(this).width;
  double get screenHeight => MediaQuery.sizeOf(this).height;
  DeviceClass get deviceClass => Breakpoints.classify(screenWidth);

  bool get isPhone => screenWidth < Breakpoints.tablet;
  bool get isTablet => screenWidth >= Breakpoints.tablet;

  /// Fluid value that scales between a min (phone) and max (tablet) by width —
  /// the Dart equivalent of CSS clamp(), used for type/spacing.
  double clampScale(double min, double max, {double from = 320, double to = 1024}) {
    final t = ((screenWidth - from) / (to - from)).clamp(0.0, 1.0);
    return min + (max - min) * t;
  }

  /// Pick a value per device class — for layout switches (e.g. 1-col vs 2-col).
  T pick<T>({required T phone, T? largePhone, T? tablet, T? desktop}) {
    switch (deviceClass) {
      case DeviceClass.compactPhone:
      case DeviceClass.phone:
        return phone;
      case DeviceClass.largePhone:
        return largePhone ?? phone;
      case DeviceClass.tablet:
        return tablet ?? largePhone ?? phone;
      case DeviceClass.largeTablet:
      case DeviceClass.desktop:
        return desktop ?? tablet ?? largePhone ?? phone;
    }
  }
}

/// Centers content in a max-width column with safe-area padding — the root
/// layout primitive (mirrors the web `Screen` shell). Use everywhere instead of
/// raw Scaffold bodies so every screen is responsive by construction.
class ResponsiveShell extends StatelessWidget {
  const ResponsiveShell({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final width = context.screenWidth;
    final maxWidth = Breakpoints.contentMaxWidth(width);
    return SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: Padding(
            padding: padding ?? const EdgeInsets.symmetric(horizontal: 20),
            child: child,
          ),
        ),
      ),
    );
  }
}
