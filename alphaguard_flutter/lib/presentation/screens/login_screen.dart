import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'support/privacy_policy_screen.dart';
import 'support/terms_conditions_screen.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../data/api/api_client.dart';
import '../../state/auth_controller.dart';
import '../widgets/app_logo.dart';
import '../widgets/app_text_field.dart';
import '../widgets/primary_button.dart';

// Official 4-colour Google logo inline SVG (same as V2's GoogleIcon component).
const _kGoogleSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
''';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _coldStart = false;

  @override
  void initState() {
    super.initState();
    ApiClient.onColdStart.stream.listen((warming) {
      if (mounted) setState(() => _coldStart = warming);
    });
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final safe = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: ResponsiveShell(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: safe.top + 8),
              // ── Back to role selection (matches V2) ──────────────────────
              GestureDetector(
                onTap: () => context.go('/role'),
                child: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                  ),
                  child: const Icon(Icons.chevron_left, color: Color(0xFFCBD5E1), size: 22),
                ),
              ),
              // ── Brand + heading ──────────────────────────────────────────
              Center(
                child: Column(
                  children: [
                    SizedBox(height: context.clampScale(24, 36)),
                    const AppLogo(),
                    SizedBox(height: context.clampScale(20, 32)),
                    const Text(
                      'Welcome back',
                      style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.textPrimary, letterSpacing: -0.3),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Log in to your parent dashboard',
                      style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    const SizedBox(height: 28),
                  ],
                ),
              ),
              // ── Form ─────────────────────────────────────────────────────
              AppTextField(
                controller: _email,
                label: 'Email Address',
                hint: 'parent@family.com',
                icon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _password,
                label: 'Password',
                hint: '••••••••',
                icon: Icons.lock_outline,
                obscure: true,
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.go('/forgot'),
                  child: const Text(
                    'Forgot Password?',
                    style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700, fontSize: 12.5),
                  ),
                ),
              ),
              if (_coldStart) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.10),
                    border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.30)),
                  ),
                  child: const Row(children: [
                    SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFF59E0B))),
                    SizedBox(width: 10),
                    Expanded(child: Text('Server warming up — this takes 30–60 s on first use…',
                        style: TextStyle(color: Color(0xFFFCD34D), fontSize: 12.5, fontWeight: FontWeight.w600))),
                  ]),
                ),
                const SizedBox(height: 8),
              ],
              if (auth.error != null) ...[
                const SizedBox(height: 8),
                Text(auth.error!, style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 8),
              ],
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Continue',
                icon: Icons.arrow_forward,
                loading: auth.busy,
                onPressed: () => auth.login(_email.text, _password.text),
              ),
              // ── Divider ──────────────────────────────────────────────────
              const SizedBox(height: 22),
              const Row(children: [
                Expanded(child: Divider(color: AppColors.border)),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'or continue with',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5),
                  ),
                ),
                Expanded(child: Divider(color: AppColors.border)),
              ]),
              const SizedBox(height: 18),
              // ── Google sign-in (proper 4-colour logo) ────────────────────
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: auth.busy ? null : () => auth.googleSignIn(),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.border),
                    backgroundColor: Colors.white.withValues(alpha: 0.04),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SvgPicture.string(_kGoogleSvg, width: 18, height: 18),
                      const SizedBox(width: 12),
                      const Text(
                        'Sign in with Google',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
              // ── Create account ────────────────────────────────────────────
              const SizedBox(height: 24),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/signup'),
                  child: const Text.rich(TextSpan(
                    text: "Don't have an account?  ",
                    style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13),
                    children: [
                      TextSpan(text: 'Create Account', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w800)),
                    ],
                  )),
                ),
              ),
              const Divider(color: AppColors.border, height: 28),
              Center(
                child: TextButton.icon(
                  onPressed: () => context.go('/pair'),
                  icon: const Icon(Icons.phonelink_ring, size: 18, color: AppColors.textSecondary),
                  label: const Text('Set up a child device', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w700)),
                ),
              ),
              // ── Legal footer ──────────────────────────────────────────────
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen())),
                    child: const Text('Privacy Policy', style: TextStyle(color: AppColors.textMuted, fontSize: 12, decoration: TextDecoration.underline)),
                  ),
                  const Text('  •  ', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TermsConditionsScreen())),
                    child: const Text('Terms of Service', style: TextStyle(color: AppColors.textMuted, fontSize: 12, decoration: TextDecoration.underline)),
                  ),
                ],
              ),
              SizedBox(height: safe.bottom + 24),
            ],
          ),
        ),
      ),
    );
  }
}
