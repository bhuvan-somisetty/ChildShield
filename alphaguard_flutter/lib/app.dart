import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app_router.dart';
import 'core/theme/app_theme.dart';
import 'state/auth_controller.dart';

/// Root widget. Builds the router from AuthController and applies the AlphaGuard
/// dark theme. The router is rebuilt only when the auth controller identity
/// changes (once), so navigation reacts to sign-in/out automatically.
class AlphaGuardApp extends StatefulWidget {
  const AlphaGuardApp({super.key});
  @override
  State<AlphaGuardApp> createState() => _AlphaGuardAppState();
}

class _AlphaGuardAppState extends State<AlphaGuardApp> {
  late final _router = buildRouter(context.read<AuthController>());

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AlphaGuard AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: _router,
      // Clamp text scaling so very large system fonts never break layouts on
      // small phones, while still respecting user accessibility settings.
      builder: (context, child) {
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(textScaler: mq.textScaler.clamp(minScaleFactor: 0.9, maxScaleFactor: 1.3)),
          child: child!,
        );
      },
    );
  }
}
