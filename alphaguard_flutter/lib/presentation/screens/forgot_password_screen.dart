import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../data/api/api_exception.dart';
import '../../data/repositories/auth_repository.dart';
import '../widgets/app_logo.dart';
import '../widgets/app_text_field.dart';
import '../widgets/primary_button.dart';

/// Password reset (parent). Two steps: request a reset email, then enter the
/// emailed code + a new password. The secure token + expiry are enforced
/// server-side; this app never sees whether the email exists.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _token = TextEditingController();
  final _password = TextEditingController();
  int _step = 1; // 1 request · 2 reset · 3 done
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _token.dispose();
    _password.dispose();
    super.dispose();
  }

  AuthRepository get _repo => context.read<AuthRepository>();

  Future<void> _request() async {
    if (_email.text.trim().isEmpty) return;
    setState(() { _busy = true; _error = null; });
    try {
      await _repo.forgotPassword(_email.text);
      if (mounted) setState(() { _step = 2; _busy = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'Could not send the reset email. Try again.'; _busy = false; });
    }
  }

  Future<void> _reset() async {
    if (_token.text.trim().isEmpty || _password.text.length < 8) {
      setState(() => _error = 'Enter the code and a password of 8+ characters.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      await _repo.resetPassword(_token.text, _password.text);
      if (mounted) setState(() { _step = 3; _busy = false; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _error = e.message; _busy = false; });
    } catch (_) {
      if (mounted) setState(() { _error = 'Reset failed. Try again.'; _busy = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: Colors.transparent, leading: BackButton(onPressed: () => context.go('/login'))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                SizedBox(height: context.clampScale(16, 40)),
                const AppLogo(showName: false),
                const SizedBox(height: 20),
                if (_step == 1) ..._requestStep() else if (_step == 2) ..._resetStep() else ..._doneStep(),
                if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w600, fontSize: 13))),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _requestStep() => [
        const Text('Reset your password', style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        const Text('Enter your account email — we’ll send a reset code.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
        const SizedBox(height: 24),
        AppTextField(controller: _email, label: 'Email', hint: 'parent@family.com', icon: Icons.mail_outline, keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 20),
        PrimaryButton(label: 'Send reset code', loading: _busy, onPressed: _request),
        TextButton(onPressed: () => setState(() => _step = 2), child: const Text('I already have a code', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700))),
      ];

  List<Widget> _resetStep() => [
        const Text('Enter your code', style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        const Text('Paste the code from your reset email and choose a new password.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
        const SizedBox(height: 24),
        AppTextField(controller: _token, label: 'Reset code', hint: 'from your email', icon: Icons.key_outlined),
        const SizedBox(height: 16),
        AppTextField(controller: _password, label: 'New password (8+ chars)', hint: '••••••••', icon: Icons.lock_outline, obscure: true),
        const SizedBox(height: 20),
        PrimaryButton(label: 'Reset password', loading: _busy, onPressed: _reset),
      ];

  List<Widget> _doneStep() => [
        const Icon(Icons.check_circle, color: AppColors.success, size: 56),
        const SizedBox(height: 16),
        const Text('Password reset', style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        const SizedBox(height: 8),
        const Text('You can now sign in with your new password.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
        const SizedBox(height: 24),
        PrimaryButton(label: 'Back to sign in', onPressed: () => context.go('/login')),
      ];
}
