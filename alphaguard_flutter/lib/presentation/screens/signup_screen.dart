import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/responsive/responsive.dart';
import '../../core/theme/app_colors.dart';
import '../../data/api/api_client.dart';
import '../../state/auth_controller.dart';
import '../widgets/app_logo.dart';
import '../widgets/app_text_field.dart';
import '../widgets/primary_button.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _pin = TextEditingController();
  final _pinConfirm = TextEditingController();

  // 0=credentials  1=enter PIN  2=confirm PIN  3=security explanation
  int _step = 0;
  String? _pinError;
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
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _pin.dispose();
    _pinConfirm.dispose();
    super.dispose();
  }

  bool get _credentialsValid =>
      _name.text.trim().isNotEmpty &&
      _email.text.contains('@') &&
      _password.text.length >= 8;

  bool get _pinValid => RegExp(r'^\d{6}$').hasMatch(_pin.text);
  bool get _pinConfirmMatch =>
      _pinConfirm.text == _pin.text && _pinConfirm.text.length == 6;

  void _nextStep() {
    if (_step == 0 && _credentialsValid) {
      setState(() => _step = 1);
    } else if (_step == 1 && _pinValid) {
      setState(() => _step = 2);
    } else if (_step == 2) {
      if (!_pinConfirmMatch) {
        setState(() => _pinError = 'PINs do not match. Please try again.');
        return;
      }
      setState(() { _pinError = null; _step = 3; });
    }
  }

  void _prevStep() {
    if (_step > 0) {
      setState(() { _step--; _pinError = null; });
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: ResponsiveShell(
          child: Column(
            children: [
              // Header: back + step dots
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 4),
                child: Row(children: [
                  GestureDetector(
                    onTap: _prevStep,
                    child: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.white.withValues(alpha: 0.06),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
                      ),
                      child: const Icon(Icons.chevron_left, color: AppColors.textMuted, size: 22),
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: List.generate(4, (i) => AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      margin: const EdgeInsets.only(left: 5),
                      height: 6,
                      width: i == _step ? 22 : 6,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(99),
                        color: i <= _step
                            ? AppColors.cyan
                            : Colors.white.withValues(alpha: 0.15),
                      ),
                    )),
                  ),
                ]),
              ),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 280),
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: SlideTransition(
                      position: Tween<Offset>(
                          begin: const Offset(0.06, 0), end: Offset.zero)
                          .animate(anim),
                      child: child,
                    ),
                  ),
                  child: KeyedSubtree(
                    key: ValueKey(_step),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.only(top: 8, bottom: 32),
                      child: _buildStep(auth),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep(AuthController auth) {
    switch (_step) {
      case 0:
        return _buildCredentials();
      case 1:
        return _buildPinEntry();
      case 2:
        return _buildPinConfirm();
      case 3:
        return _buildSecurityExplanation(auth);
      default:
        return const SizedBox.shrink();
    }
  }

  // ── Step 0: name + email + password ─────────────────────────────────────────

  Widget _buildCredentials() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SizedBox(height: 8),
      const AppLogo(showName: false),
      const SizedBox(height: 20),
      const Text('Create your account',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
      const SizedBox(height: 6),
      const Text("Set up your parent account to get started.",
          style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4)),
      const SizedBox(height: 24),
      AppTextField(controller: _name, label: 'Full Name', hint: 'Jane Doe',
          icon: Icons.person_outline, onChanged: (_) => setState(() {})),
      const SizedBox(height: 14),
      AppTextField(controller: _email, label: 'Email', hint: 'parent@family.com',
          icon: Icons.mail_outline, keyboardType: TextInputType.emailAddress,
          onChanged: (_) => setState(() {})),
      const SizedBox(height: 14),
      AppTextField(controller: _password, label: 'Password (8+ characters)', hint: '••••••••',
          icon: Icons.lock_outline, obscure: true, onChanged: (_) => setState(() {})),
      const SizedBox(height: 24),
      ElevatedButton.icon(
        onPressed: _credentialsValid ? _nextStep : null,
        icon: const Icon(Icons.chevron_right, size: 18),
        label: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.cyan,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.cyan.withValues(alpha: 0.3),
          padding: const EdgeInsets.symmetric(vertical: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
      ),
      const SizedBox(height: 16),
      TextButton(
        onPressed: () => context.go('/login'),
        child: const Text('Already have an account? Sign in',
            style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700)),
      ),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        GestureDetector(
          onTap: () => context.go('/support/privacy'),
          child: const Text('Privacy Policy',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12, decoration: TextDecoration.underline)),
        ),
        const Text('  •  ', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        GestureDetector(
          onTap: () => context.go('/support/terms'),
          child: const Text('Terms of Service',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12, decoration: TextDecoration.underline)),
        ),
      ]),
    ],
  );

  // ── Step 1: enter PIN ────────────────────────────────────────────────────────

  Widget _buildPinEntry() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SizedBox(height: 16),
      Center(
        child: Container(
          width: 72, height: 72,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            color: AppColors.blue.withValues(alpha: 0.15),
            border: Border.all(color: AppColors.blue.withValues(alpha: 0.35)),
            boxShadow: [BoxShadow(color: AppColors.blue.withValues(alpha: 0.25), blurRadius: 24)],
          ),
          child: const Icon(Icons.pin_outlined, color: AppColors.blue, size: 34),
        ),
      ),
      const SizedBox(height: 20),
      const Text('Create Security PIN',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      const Text('Choose a 6-digit PIN. You\'ll confirm it on the next screen.',
          style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4)),
      const SizedBox(height: 28),
      TextField(
        controller: _pin,
        autofocus: true,
        onChanged: (_) => setState(() {}),
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 6,
        obscureText: true,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 36,
            fontWeight: FontWeight.w900, letterSpacing: 16),
        decoration: const InputDecoration(counterText: '', hintText: '------'),
      ),
      const SizedBox(height: 24),
      ElevatedButton.icon(
        onPressed: _pinValid ? _nextStep : null,
        icon: const Icon(Icons.chevron_right, size: 18),
        label: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.blue,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.blue.withValues(alpha: 0.3),
          padding: const EdgeInsets.symmetric(vertical: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
      ),
    ],
  );

  // ── Step 2: confirm PIN ──────────────────────────────────────────────────────

  Widget _buildPinConfirm() => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SizedBox(height: 16),
      Center(
        child: Container(
          width: 72, height: 72,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            color: const Color(0xFF10B981).withValues(alpha: 0.15),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.35)),
            boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.25), blurRadius: 24)],
          ),
          child: const Icon(Icons.verified_outlined, color: Color(0xFF10B981), size: 34),
        ),
      ),
      const SizedBox(height: 20),
      const Text('Confirm Security PIN',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      const Text('Re-enter your 6-digit PIN to confirm you have it memorised.',
          style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4)),
      const SizedBox(height: 28),
      TextField(
        controller: _pinConfirm,
        autofocus: true,
        onChanged: (_) => setState(() {}),
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 6,
        obscureText: true,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 36,
            fontWeight: FontWeight.w900, letterSpacing: 16),
        decoration: const InputDecoration(counterText: '', hintText: '------'),
      ),
      if (_pinError != null) ...[
        const SizedBox(height: 10),
        Text(_pinError!, style: const TextStyle(color: AppColors.danger,
            fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
      ],
      const SizedBox(height: 24),
      ElevatedButton.icon(
        onPressed: _pinConfirmMatch ? _nextStep : null,
        icon: const Icon(Icons.check, size: 18),
        label: const Text('Confirm PIN', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF10B981),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF10B981).withValues(alpha: 0.3),
          padding: const EdgeInsets.symmetric(vertical: 16),
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
      ),
    ],
  );

  // ── Step 3: security explanation + create account ────────────────────────────

  Widget _buildSecurityExplanation(AuthController auth) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      const SizedBox(height: 16),
      Center(
        child: Container(
          width: 72, height: 72,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            color: AppColors.cyan.withValues(alpha: 0.15),
            border: Border.all(color: AppColors.cyan.withValues(alpha: 0.35)),
            boxShadow: [BoxShadow(color: AppColors.cyan.withValues(alpha: 0.25), blurRadius: 24)],
          ),
          child: const Icon(Icons.security_outlined, color: AppColors.cyan, size: 34),
        ),
      ),
      const SizedBox(height: 20),
      const Text('Your PIN Protects You',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      const Text(
        'Your Security PIN adds an extra layer of protection to sensitive parental actions.',
        style: TextStyle(fontSize: 13, color: AppColors.textMuted, height: 1.4),
      ),
      const SizedBox(height: 18),
      for (final item in _kPinProtections) ...[
        Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          decoration: BoxDecoration(
            color: const Color(0xFF0B0C14),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withValues(alpha: 0.07)),
          ),
          child: Row(children: [
            Icon(item.$1, color: AppColors.cyan, size: 17),
            const SizedBox(width: 12),
            Text(item.$2, style: const TextStyle(fontSize: 13.5,
                fontWeight: FontWeight.w600, color: Colors.white)),
          ]),
        ),
      ],
      const SizedBox(height: 14),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: AppColors.cyan.withValues(alpha: 0.06),
          border: Border.all(color: AppColors.cyan.withValues(alpha: 0.20)),
        ),
        child: const Text(
          'Keep your PIN safe. If forgotten, verify your identity via email to reset it.',
          style: TextStyle(color: AppColors.textMuted, fontSize: 12.5, height: 1.5),
          textAlign: TextAlign.center,
        ),
      ),
      if (_coldStart) ...[
        const SizedBox(height: 12),
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
      ],
      if (auth.error != null) ...[
        const SizedBox(height: 12),
        Text(auth.error!, style: const TextStyle(color: AppColors.danger,
            fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
      ],
      const SizedBox(height: 24),
      PrimaryButton(
        label: 'Create Account',
        icon: Icons.arrow_forward,
        loading: auth.busy,
        onPressed: () => auth.register(
          _email.text, _password.text, _name.text.trim(), pin: _pin.text,
        ),
      ),
    ],
  );
}

const _kPinProtections = [
  (Icons.phone_android_outlined,         'App uninstall prevention'),
  (Icons.child_care_outlined,             'Child removal from account'),
  (Icons.link_off_outlined,               'Device unlinking'),
  (Icons.security_outlined,               'Sensitive safety settings changes'),
  (Icons.admin_panel_settings_outlined,   'Critical parental actions'),
];
