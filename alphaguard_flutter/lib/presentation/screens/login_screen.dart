import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'support/privacy_policy_screen.dart';
import 'support/terms_conditions_screen.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../state/auth_controller.dart';
import '../widgets/app_logo.dart';
import '../widgets/app_text_field.dart';
import '../widgets/primary_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: ResponsiveShell(
        child: SingleChildScrollView(
          child: Column(
            children: [
              SizedBox(height: context.clampScale(40, 72)),
              const AppLogo(),
              SizedBox(height: context.clampScale(28, 44)),
              const Text('Welcome back', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
              const SizedBox(height: 6),
              const Text('Log in to your parent dashboard', style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
              const SizedBox(height: 28),
              AppTextField(controller: _email, label: 'Email Address', hint: 'parent@family.com', icon: Icons.mail_outline, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              AppTextField(controller: _password, label: 'Password', hint: '••••••••', icon: Icons.lock_outline, obscure: true),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: () => context.go('/forgot'), child: const Text('Forgot password?', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 12.5))),
              ),
              if (auth.error != null) ...[
                const SizedBox(height: 12),
                Text(auth.error!, style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600, fontSize: 13)),
              ],
              const SizedBox(height: 24),
              PrimaryButton(
                label: 'Continue',
                icon: Icons.arrow_forward,
                loading: auth.busy,
                onPressed: () => auth.login(_email.text, _password.text),
              ),
              const SizedBox(height: 18),
              const Row(children: [
                Expanded(child: Divider(color: AppColors.border)),
                Padding(padding: EdgeInsets.symmetric(horizontal: 12), child: Text('OR', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800))),
                Expanded(child: Divider(color: AppColors.border)),
              ]),
              const SizedBox(height: 18),
              OutlinedButton.icon(
                onPressed: auth.busy ? null : () => auth.googleSignIn(),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(54),
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                icon: const Icon(Icons.g_mobiledata, color: Colors.white, size: 28),
                label: const Text('Sign in with Google', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => context.go('/signup'),
                child: const Text.rich(TextSpan(
                  text: "Don't have an account?  ",
                  style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                  children: [TextSpan(text: 'Create Account', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w800))],
                )),
              ),
              const Divider(color: AppColors.border, height: 28),
              // Child devices don't sign in — they pair with a parent's code.
              TextButton.icon(
                onPressed: () => context.go('/pair'),
                icon: const Icon(Icons.phonelink_ring, size: 18, color: AppColors.textSecondary),
                label: const Text('Set up a child device', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w700)),
              ),
              const SizedBox(height: 20),
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
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
