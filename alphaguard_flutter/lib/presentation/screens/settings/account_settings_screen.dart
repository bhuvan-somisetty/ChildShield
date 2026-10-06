import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/api/api_client.dart';
import '../../../state/auth_controller.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';
import '../support/privacy_policy_screen.dart';
import '../support/terms_conditions_screen.dart';
import '../support/legal_consent_screen.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  bool _deleting = false;

  Future<void> _confirmParentLogout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign out?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
        content: const Text(
          'You will be returned to the role selection screen. Your family data and child connections are preserved.',
          style: TextStyle(color: AppColors.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.warning,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await context.read<AuthController>().logout();
    }
  }

  void _showDeleteConfirmDialog() {
    final pinC = TextEditingController();
    showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: AppColors.bgElevated,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text('Delete Account', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w900)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'This will permanently deactivate your family safety profile, remove child links, and queue your telemetry logs for erasure after a 30-day compliance SLA window.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13.5, height: 1.4),
              ),
              const SizedBox(height: 14),
              const Text(
                'ENTER SECURITY PIN TO CONFIRM',
                style: TextStyle(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: pinC,
                keyboardType: TextInputType.number,
                obscureText: true,
                maxLength: 6,
                style: const TextStyle(color: AppColors.textPrimary, letterSpacing: 16, fontSize: 18),
                decoration: const InputDecoration(
                  hintText: '******',
                  hintStyle: TextStyle(letterSpacing: 16),
                  counterText: '',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _deleting
                  ? null
                  : () async {
                      final pin = pinC.text.trim();
                      if (pin.length != 6) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('PIN must be 6 digits.'), behavior: SnackBarBehavior.floating),
                        );
                        return;
                      }

                      setModalState(() => _deleting = true);
                      final api = context.read<ApiClient>();
                      final auth = context.read<AuthController>();

                      try {
                        await api.delete('/me', body: {'pin': pin});
                        if (context.mounted) {
                          Navigator.of(ctx).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Account queued for deletion. Wiping session...'), behavior: SnackBarBehavior.floating),
                          );
                          await auth.logout();
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), behavior: SnackBarBehavior.floating),
                          );
                        }
                      } finally {
                        setModalState(() => _deleting = false);
                      }
                    },
              child: _deleting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Delete Permanently'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final p = auth.parent;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Account Settings', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            const Text('PROFILE INFO', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 8),
            AppCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Full Name', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  const SizedBox(height: 3),
                  Text(p?.name ?? 'Parent Name', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16)),
                  const Divider(color: AppColors.border, height: 24),
                  const Text('Email Address', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  const SizedBox(height: 3),
                  Text(p?.email ?? 'parent@email.com', style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('SESSION ACTIONS', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 8),
            AppCard(
              onTap: _confirmParentLogout,
              child: const Row(
                children: [
                  Icon(Icons.logout, color: AppColors.warning),
                  SizedBox(width: 12),
                  Expanded(child: Text('Sign Out of Session', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
                  Icon(Icons.chevron_right, color: AppColors.textMuted),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('LEGAL & CONSENT', style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 8),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.privacy_tip, color: AppColors.violet),
                    title: const Text('Privacy Policy', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                    trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen())),
                  ),
                  const Divider(color: AppColors.border, height: 1),
                  ListTile(
                    leading: const Icon(Icons.gavel, color: AppColors.warning),
                    title: const Text('Terms & Conditions', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                    trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TermsConditionsScreen())),
                  ),
                  const Divider(color: AppColors.border, height: 1),
                  ListTile(
                    leading: const Icon(Icons.fact_check, color: AppColors.cyan),
                    title: const Text('Legal & AI Consent', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                    trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LegalConsentScreen())),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('DANGER ZONE', style: TextStyle(color: AppColors.danger, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
            const SizedBox(height: 8),
            AppCard(
              onTap: _showDeleteConfirmDialog,
              child: const Row(
                children: [
                  Icon(Icons.delete_forever, color: AppColors.danger),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Delete Account', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w900)),
                        Text('Permanently remove your account and queue data erasure.', style: TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
