import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'presentation/screens/approvals_center_screen.dart';
import 'presentation/screens/app_management_screen.dart';
import 'presentation/screens/child/child_activation_screen.dart';
import 'presentation/screens/child/child_connected_screen.dart';
import 'presentation/screens/child/child_contacts_screen.dart';
import 'presentation/screens/child/child_disha_screen.dart';
import 'presentation/screens/child/child_pairing_screen.dart';
import 'presentation/screens/child/child_shell.dart';
import 'presentation/screens/child_setup_screen.dart';
import 'presentation/screens/connect_child_screen.dart';
import 'presentation/screens/controls_hub_screen.dart';
import 'presentation/screens/parent_setup_screen.dart';
import 'presentation/screens/forgot_password_screen.dart';
import 'presentation/screens/main_shell.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/onboarding_screen.dart';
import 'presentation/screens/role_selection_screen.dart';
import 'presentation/screens/safety/sos_screen.dart';
import 'presentation/screens/settings/account_settings_screen.dart';
import 'presentation/screens/settings/device_registry_screen.dart';
import 'presentation/screens/settings/notification_inbox_screen.dart';
import 'presentation/screens/settings/notification_preferences_screen.dart';
import 'presentation/screens/support/child_safety_policy_screen.dart';
import 'presentation/screens/support/legal_consent_screen.dart';
import 'presentation/screens/support/privacy_policy_screen.dart';
import 'presentation/screens/support/terms_conditions_screen.dart';
import 'presentation/screens/support/user_manual_screen.dart';
import 'presentation/screens/signup_screen.dart';
import 'presentation/screens/splash_screen.dart';
import 'presentation/screens/update_gate.dart';
import 'presentation/screens/welcome_screen.dart';
import 'state/auth_controller.dart';

/// Global navigator key — allows push notification tap handlers to navigate
/// without needing a BuildContext.
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

/// Resolves a push notification deep-link path and navigates to it.
void handleDeepLink(String path) {
  final nav = rootNavigatorKey.currentState;
  if (nav == null) return;
  nav.pushNamed(path);
}

/// Launch flow:
///   unknown           → /splash (bootstrap in progress)
///   not onboarded     → /welcome → /onboarding → /role → /login or /pair
///   onboarded, no auth→ /login  (returning parent)
///   authenticated     → /home   (UpdateGate + role-aware shell)
GoRouter buildRouter(AuthController auth) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: auth,
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/role', builder: (_, __) => const RoleSelectionScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (_, __) => const SignupScreen()),
      GoRoute(path: '/pair', builder: (_, __) => const ChildPairingScreen()),
      GoRoute(path: '/forgot', builder: (_, __) => const ForgotPasswordScreen()),
      // ── Phase 4 setup flows ──────────────────────────────────────────────
      GoRoute(path: '/setup', builder: (_, __) => const ParentSetupScreen()),
      GoRoute(path: '/connect', builder: (_, __) => const ConnectChildScreen()),
      GoRoute(path: '/child-setup', builder: (_, __) => const ChildSetupScreen()),
      GoRoute(path: '/child-connected', builder: (_, __) => const ChildConnectedScreen()),
      GoRoute(path: '/child-activate', builder: (_, __) => const ChildActivationScreen()),
      // Role-aware home — the matching shell based on auth role.
      GoRoute(path: '/home', builder: (_, __) => const UpdateGate(child: _RoleHome())),

      // ── Deep-link routes (push notification taps) ──────────────────────
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationInboxScreen()),
      GoRoute(path: '/sos', builder: (_, __) => const SosScreen()),
      GoRoute(path: '/devices', builder: (_, __) => const DeviceRegistryScreen()),
      GoRoute(path: '/notification-settings', builder: (_, __) => const NotificationPreferencesScreen()),
      GoRoute(path: '/settings/account', builder: (_, __) => const AccountSettingsScreen()),
      GoRoute(path: '/support/privacy', builder: (_, __) => const PrivacyPolicyScreen()),
      GoRoute(path: '/support/terms', builder: (_, __) => const TermsConditionsScreen()),
      GoRoute(path: '/support/consent', builder: (_, __) => const LegalConsentScreen()),
      GoRoute(path: '/support/manual', builder: (_, __) => const UserManualScreen()),
      GoRoute(path: '/support/child-safety', builder: (_, __) => const ChildSafetyPolicyScreen()),
      GoRoute(path: '/child/contacts', builder: (_, __) => const ChildContactsScreen()),
      GoRoute(path: '/child/disha', builder: (_, __) => const ChildDishaScreen()),
      GoRoute(path: '/controls', builder: (_, __) => const ControlsHubScreen()),
      GoRoute(path: '/app-management', builder: (_, __) => const AppManagementScreen()),
      GoRoute(path: '/approvals', builder: (_, __) => const ApprovalsCenterScreen()),
      // Tab deep-links — redirect to /home with the matching tab query param.
      GoRoute(path: '/tasks', redirect: (_, __) => '/home?tab=tasks'),
      GoRoute(path: '/rewards', redirect: (_, __) => '/home?tab=rewards'),
      GoRoute(path: '/chat', redirect: (_, __) => '/home?tab=chat'),
      GoRoute(path: '/radar', redirect: (_, __) => '/home?tab=location'),
      GoRoute(path: '/profile', redirect: (_, __) => '/home'),
    ],
    redirect: (context, state) {
      final status = auth.status;
      final loc = state.matchedLocation;

      // Bootstrap in progress — stay on splash.
      if (status == AuthStatus.unknown) {
        return loc == '/splash' ? null : '/splash';
      }

      if (status == AuthStatus.unauthenticated) {
        // First-time user → show welcome → onboarding → role selection flow.
        if (!auth.isOnboarded) {
          const flow = {'/welcome', '/onboarding', '/role'};
          if (flow.contains(loc)) return null;
          return '/welcome';
        }
        // Returning user (already onboarded) → auth screens or child setup.
        const authScreens = {'/login', '/signup', '/pair', '/forgot', '/role', '/child-setup'};
        if (authScreens.contains(loc)) return null;
        return '/login';
      }

      // Authenticated — allow home and all deep-link routes.
      const deepLinks = {
        '/home', '/notifications', '/notification-settings', '/sos', '/devices',
        '/tasks', '/rewards', '/chat', '/radar', '/profile',
        '/settings/account', '/support/privacy', '/support/terms',
        '/support/consent', '/support/manual', '/support/child-safety', '/child/contacts',
        '/child/disha', '/controls', '/app-management', '/approvals',
        '/setup', '/connect', '/child-connected', '/child-activate',
      };
      if (deepLinks.contains(loc)) return null;
      return '/home';
    },
  );
}

/// Renders parent or child shell based on the authenticated role.
class _RoleHome extends StatelessWidget {
  const _RoleHome();
  @override
  Widget build(BuildContext context) {
    final isChild = context.watch<AuthController>().isChild;
    return isChild ? const ChildShell() : const MainShell();
  }
}
