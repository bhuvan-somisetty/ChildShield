import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';

class LegalConsentScreen extends StatefulWidget {
  const LegalConsentScreen({super.key});

  @override
  State<LegalConsentScreen> createState() => _LegalConsentScreenState();
}

class _LegalConsentScreenState extends State<LegalConsentScreen> {
  bool _loading = true;
  bool _coppaConsent = false;
  bool _aiConsent = false;

  @override
  void initState() {
    super.initState();
    _loadStatus();
  }

  Future<void> _loadStatus() async {
    final repo = context.read<AuthRepository>();
    try {
      final res = await repo.consentStatus();
      final accepted = res['acceptedDocs'] as List<dynamic>? ?? [];
      setState(() {
        _coppaConsent = accepted.contains('coppa');
        _aiConsent = accepted.contains('ai_modelling');
      });
    } catch (_) {} finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    final repo = context.read<AuthRepository>();
    try {
      final docs = <String>[];
      if (_coppaConsent) docs.add('coppa');
      if (_aiConsent) docs.add('ai_modelling');
      await repo.saveConsent(docs);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Consents updated successfully!'), behavior: SnackBarBehavior.floating),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update consents. Please try again.'), behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Legal & AI Consent', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  const Text(
                    'ONBOARDING CONSENT AGREEMENT',
                    style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'To enable child safety monitoring, please review and accept the required legal consents under COPPA regulations and AI diagnostic policies.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 13, height: 1.45),
                  ),
                  const SizedBox(height: 20),
                  AppCard(
                    padding: const EdgeInsets.all(12),
                    child: SwitchListTile(
                      title: const Text('COPPA Telemetry Consent', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
                      subtitle: const Padding(
                        padding: EdgeInsets.only(top: 4.0),
                        child: Text(
                          'I consent to the collection and transmission of location and usage telemetry from my child\'s device for parental monitoring.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                        ),
                      ),
                      value: _coppaConsent,
                      activeColor: AppColors.cyan,
                      onChanged: (val) => setState(() => _coppaConsent = val),
                    ),
                  ),
                  const SizedBox(height: 12),
                  AppCard(
                    padding: const EdgeInsets.all(12),
                    child: SwitchListTile(
                      title: const Text('AI Analytics Consent', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14)),
                      subtitle: const Padding(
                        padding: EdgeInsets.only(top: 4.0),
                        child: Text(
                          'I consent to the processing of device analytics for AI Safety Reports.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                        ),
                      ),
                      value: _aiConsent,
                      activeColor: AppColors.cyan,
                      onChanged: (val) => setState(() => _aiConsent = val),
                    ),
                  ),
                  const SizedBox(height: 32),
                  PrimaryButton(
                    label: 'Save Consents',
                    onPressed: _save,
                  ),
                ],
              ),
      ),
    );
  }
}
