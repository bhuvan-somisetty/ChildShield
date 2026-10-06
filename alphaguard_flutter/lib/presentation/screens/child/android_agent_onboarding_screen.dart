import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../services/location/android_agent_bridge.dart';
import '../../widgets/primary_button.dart';

class AndroidAgentOnboardingScreen extends StatefulWidget {
  const AndroidAgentOnboardingScreen({super.key});

  @override
  State<AndroidAgentOnboardingScreen> createState() => _AndroidAgentOnboardingScreenState();
}

class _AndroidAgentOnboardingScreenState extends State<AndroidAgentOnboardingScreen> with WidgetsBindingObserver {
  int _currentIndex = 0;
  AndroidAgentStatus _status = AndroidAgentStatus.unknown();
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    _checkStatus();
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkStatusAndAutoAdvance();
    }
  }

  Future<void> _checkStatus() async {
    setState(() => _loading = true);
    final status = await AndroidAgentBridge.getTrackingStatus();
    if (!mounted) return;
    setState(() {
      _status = status;
      _loading = false;
    });
  }

  Future<void> _checkStatusAndAutoAdvance() async {
    await _checkStatus();
    if (!mounted) return;
    _maybeAutoAdvance();
  }

  void _maybeAutoAdvance() {
    // Indices map to slide positions defined in build():
    // 1=Location, 2=Background, 3=Notifications, 4=UsageAccess, 5=Overlay, 6=Battery
    switch (_currentIndex) {
      case 1: if (_status.locationPermission == 'granted') setState(() => _currentIndex++);
      case 2: if (_status.backgroundLocationPermission == 'granted') setState(() => _currentIndex++);
      case 3: if (_status.notificationPermission) setState(() => _currentIndex++);
      case 4: if (_status.usageAccessPermission == 'granted') setState(() => _currentIndex++);
      case 5: if (_status.overlayPermission == 'granted') setState(() => _currentIndex++);
      case 6: if (_status.isBatteryExempt) setState(() => _currentIndex++);
    }
  }

  Future<void> _finish() async {
    await AndroidAgentBridge.startTracking();
    if (mounted) {
      // Completed, redirect to dashboard by refreshing auth controller
      Navigator.of(context).pop();
    }
  }

  String _getOemName(String manufacturer) {
    final m = manufacturer.toLowerCase();
    if (m.contains('samsung')) return 'Samsung';
    if (m.contains('xiaomi') || m.contains('redmi') || m.contains('poco')) return 'Xiaomi';
    if (m.contains('oppo')) return 'Oppo';
    if (m.contains('vivo') || m.contains('iqoo')) return 'Vivo';
    if (m.contains('realme')) return 'Realme';
    return 'Android Device';
  }

  List<String> _getOemInstructions(String manufacturer) {
    final m = manufacturer.toLowerCase();
    if (m.contains('samsung')) {
      return [
        '1. Tap the button below to open Settings.',
        '2. Select "Unrestricted" to ensure tracking is never killed by the OS.',
        '3. Ensure "Remove permissions if app is unused" is disabled.',
        '• Fallback: Go to Settings -> Apps -> AlphaGuard -> Battery -> set to Unrestricted.'
      ];
    }
    if (m.contains('xiaomi') || m.contains('redmi') || m.contains('poco')) {
      return [
        '1. Tap the button below to open App Info settings.',
        '2. Turn ON "Autostart".',
        '3. Select "Battery saver" → Set to "No restrictions".',
        '• Fallback: Go to Settings -> Apps -> Manage Apps -> AlphaGuard -> enable Autostart.'
      ];
    }
    if (m.contains('oppo') || m.contains('realme')) {
      return [
        '1. Tap the button below to open App Info.',
        '2. Select "Battery usage".',
        '3. Enable "Allow background activity" & "Allow auto-launch".',
        '• Fallback: Go to Settings -> Apps -> App Management -> AlphaGuard -> Battery -> Allow Background.'
      ];
    }
    if (m.contains('vivo') || m.contains('iqoo')) {
      return [
        '1. Tap the button below to open Settings.',
        '2. Tap "Background power consumption management".',
        '3. Choose AlphaGuard and set to "High background power consumption".',
        '• Fallback: Go to Settings -> Battery -> Background Management -> set AlphaGuard to High Power.'
      ];
    }
    return [
      '1. Tap the button below to open settings.',
      '2. Exemption AlphaGuard from battery optimization constraints.',
      '3. Select "Don\'t optimize" or "Unrestricted" battery setting.',
      '• Fallback: Go to Settings -> Apps -> AlphaGuard -> Battery -> set to Unrestricted.'
    ];
  }

  @override
  Widget build(BuildContext context) {
    final oem = _getOemName(_status.deviceManufacturer);
    final oemSteps = _getOemInstructions(_status.deviceManufacturer);

    final slides = [
      // 0. Intro
      _SlideData(
        icon: Icons.shield_outlined,
        color: AppColors.cyan,
        title: 'Active Protection Setup',
        body: 'Welcome to AlphaGuard Active Protection! We will guide you through setting up background permissions to keep your tracking safe, continuous, and tamper-resistant.',
        actionLabel: 'Get Started',
        onAction: () => setState(() => _currentIndex++),
      ),
      // 1. Location
      _SlideData(
        icon: Icons.my_location_rounded,
        color: AppColors.blue,
        title: 'Step 1: Location Access',
        body: 'AlphaGuard needs location permissions so your parent can locate you on the map and see if you are safe.',
        isGranted: _status.locationPermission == 'granted',
        actionLabel: _status.locationPermission == 'granted' ? 'Next Step' : 'Grant Location',
        onAction: () async {
          if (_status.locationPermission == 'granted') {
            setState(() => _currentIndex++);
          } else {
            await AndroidAgentBridge.requestLocationPermission();
            await _checkStatus();
            if (_status.locationPermission == 'granted') setState(() => _currentIndex++);
          }
        },
      ),
      // 2. Background Location
      _SlideData(
        icon: Icons.location_searching_rounded,
        color: AppColors.indigo,
        title: 'Step 2: Background Tracking',
        body: 'Select "Allow all the time" so AlphaGuard can track location when the screen is off or the app is closed.',
        isGranted: _status.backgroundLocationPermission == 'granted',
        actionLabel: _status.backgroundLocationPermission == 'granted' ? 'Next Step' : 'Allow All the Time',
        skipLabel: _status.backgroundLocationPermission != 'granted' ? 'Skip — I\'ll do this later' : null,
        onAction: () async {
          if (_status.backgroundLocationPermission == 'granted') {
            setState(() => _currentIndex++);
          } else {
            await AndroidAgentBridge.requestBackgroundLocationPermission();
            await _checkStatus();
            if (_status.backgroundLocationPermission == 'granted') setState(() => _currentIndex++);
          }
        },
        onSkip: () => setState(() => _currentIndex++),
      ),
      // 3. Notifications
      _SlideData(
        icon: Icons.notifications_active_outlined,
        color: AppColors.cyan,
        title: 'Step 3: Notifications',
        body: 'Enable notifications to allow the "Active Protection" persistent status bar to keep background tracking alive.',
        isGranted: _status.notificationPermission,
        actionLabel: _status.notificationPermission ? 'Next Step' : 'Grant Notifications',
        onAction: () async {
          if (_status.notificationPermission) {
            setState(() => _currentIndex++);
          } else {
            await AndroidAgentBridge.requestNotificationPermission();
            await _checkStatus();
            if (_status.notificationPermission) setState(() => _currentIndex++);
          }
        },
      ),
      // 4. Usage Stats
      _SlideData(
        icon: Icons.insights_rounded,
        color: AppColors.violet,
        title: 'Step 4: Usage Access',
        body: 'Allow Usage Access so your parent can review screen time, app usage reports, and activity milestones.\n\nTap your name in the list and enable the toggle.\n\n⚠️ If the toggle is greyed out:\n1. Go to Settings → Apps → AlphaGuard\n2. Tap the ⋮ menu (3 dots)\n3. Tap "Allow restricted settings"\n4. Come back here and tap the button again.',
        isGranted: _status.usageAccessPermission == 'granted',
        actionLabel: _status.usageAccessPermission == 'granted' ? 'Next Step' : 'Open Usage Access',
        skipLabel: _status.usageAccessPermission != 'granted' ? 'Skip — I\'ll do this later' : null,
        onAction: () async {
          if (_status.usageAccessPermission == 'granted') {
            setState(() => _currentIndex++);
          } else {
            await AndroidAgentBridge.requestUsageAccess();
            // User navigates away — auto-advance handled by didChangeAppLifecycleState
          }
        },
        onSkip: () => setState(() => _currentIndex++),
      ),
      // 5. Overlay
      _SlideData(
        icon: Icons.picture_in_picture_alt_rounded,
        color: AppColors.blue,
        title: 'Step 5: Draw Over Apps',
        body: 'Allow AlphaGuard to display safety alerts and protection indicators over other apps.\n\nFind AlphaGuard in the list and enable the toggle.\n\n⚠️ If the toggle is greyed out:\n1. Go to Settings → Apps → AlphaGuard\n2. Tap the ⋮ menu (3 dots)\n3. Tap "Allow restricted settings"\n4. Come back here and tap the button again.',
        isGranted: _status.overlayPermission == 'granted',
        actionLabel: _status.overlayPermission == 'granted' ? 'Next Step' : 'Allow Overlay',
        skipLabel: _status.overlayPermission != 'granted' ? 'Skip — I\'ll do this later' : null,
        onAction: () async {
          if (_status.overlayPermission == 'granted') {
            setState(() => _currentIndex++);
          } else {
            await AndroidAgentBridge.requestOverlayPermission();
            // User navigates away — auto-advance handled by didChangeAppLifecycleState
          }
        },
        onSkip: () => setState(() => _currentIndex++),
      ),
      // 6. OEM Battery Optimization
      _SlideData(
        icon: Icons.battery_saver_rounded,
        color: AppColors.warning,
        title: 'Step 6: $oem Settings',
        body: 'Aggressive battery management can kill background services. Follow these instructions exactly:\n\n${oemSteps.join('\n')}',
        isGranted: _status.isBatteryExempt,
        actionLabel: _status.isBatteryExempt ? 'Next Step' : 'Disable Optimization',
        skipLabel: _status.isBatteryExempt != true ? 'Skip — I\'ll do this later' : null,
        onAction: () async {
          if (_status.isBatteryExempt) {
            setState(() => _currentIndex++);
          } else {
            await AndroidAgentBridge.requestBatteryOptimizationExemption();
            // User navigates away — auto-advance handled by didChangeAppLifecycleState
          }
        },
        onSkip: () => setState(() => _currentIndex++),
      ),
      // 6. Complete
      _SlideData(
        icon: Icons.check_circle_outline_rounded,
        color: AppColors.success,
        title: 'Active Protection Enabled',
        body: 'Setup complete! AlphaGuard is now running in the background to keep you safe and sync your statistics securely.',
        actionLabel: 'Enter Dashboard',
        onAction: _finish,
      ),
    ];

    final currentSlide = slides[_currentIndex];

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
                  child: IntrinsicHeight(
                    child: Column(
                      children: [
                        // Header progress dots
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(slides.length, (i) {
                            final active = i == _currentIndex;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: active ? 16 : 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: active ? AppColors.cyan : AppColors.border,
                                borderRadius: BorderRadius.circular(4),
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 24),
                        // Core illustration container
                        _loading
                            ? const Center(child: Padding(padding: EdgeInsets.symmetric(vertical: 40), child: CircularProgressIndicator(color: AppColors.cyan)))
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 140,
                                    height: 140,
                                    decoration: BoxDecoration(
                                      color: currentSlide.color.withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: currentSlide.color.withValues(alpha: 0.3)),
                                    ),
                                    child: Icon(currentSlide.icon, color: currentSlide.color, size: 60),
                                  ),
                                  const SizedBox(height: 32),
                                  Text(
                                    currentSlide.title,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 16),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                    child: Text(
                                      currentSlide.body,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  if (currentSlide.isGranted != null)
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          currentSlide.isGranted! ? Icons.check_circle : Icons.warning_amber_rounded,
                                          color: currentSlide.isGranted! ? AppColors.success : AppColors.warning,
                                          size: 18,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          currentSlide.isGranted! ? 'Permission Granted' : 'Action Required',
                                          style: TextStyle(
                                            color: currentSlide.isGranted! ? AppColors.success : AppColors.warning,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                        const Spacer(),
                        const SizedBox(height: 24),
                        // Action controls
                        _loading
                            ? const SizedBox(height: 48)
                            : PrimaryButton(
                                label: currentSlide.actionLabel,
                                onPressed: currentSlide.onAction,
                              ),
                        const SizedBox(height: 12),
                        if (currentSlide.skipLabel != null && currentSlide.onSkip != null)
                          TextButton(
                            onPressed: currentSlide.onSkip,
                            child: Text(currentSlide.skipLabel!, style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                          ),
                        if (_currentIndex > 0 && _currentIndex < slides.length - 1)
                          TextButton(
                            onPressed: () => setState(() => _currentIndex--),
                            child: const Text('Back', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                          ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }
        ),
      ),
    );
  }
}

class _SlideData {
  _SlideData({
    required this.icon,
    required this.color,
    required this.title,
    required this.body,
    required this.actionLabel,
    required this.onAction,
    this.isGranted,
    this.skipLabel,
    this.onSkip,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String body;
  final String actionLabel;
  final VoidCallback onAction;
  final bool? isGranted;
  final String? skipLabel;
  final VoidCallback? onSkip;
}
