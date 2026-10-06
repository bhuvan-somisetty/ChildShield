import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../widgets/app_card.dart';

class TermsConditionsScreen extends StatelessWidget {
  const TermsConditionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Terms & Conditions', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            const Text(
              'ALPHAGUARD TERMS OF SERVICE',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18),
            ),
            const SizedBox(height: 6),
            const Text(
              'Last updated: June 19, 2026',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            _section(
              '1. Acceptance of Terms',
              'By registering and using AlphaGuard, you represent that you are a parent or legal guardian of the child whose device is linked, and that you accept these Terms in full.',
            ),
            _section(
              '2. Parental Monitoring License',
              'We grant you a personal, non-transferable license to install the Android Agent exclusively on mobile devices owned or legally possessed by children under your direct custody. Use on other devices or third-party monitoring without explicit consent is strictly prohibited.',
            ),
            _section(
              '3. Proper Use & Compliance',
              'You agree not to bypass security locks, reverse-engineer MethodChannels, or interfere with foreground location streaming. You must comply with local, state, and federal laws regarding electronic monitoring in your jurisdiction.',
            ),
            _section(
              '4. Liability & Disclaimers',
              'AlphaGuard is provided "as is" and "as available". While we strive for maximum uptime and realtime alert syncing, we do not guarantee uninterrupted connectivity or immediate notifications in situations of network outage, device shutdown, or battery failure.',
            ),
            const SizedBox(height: 20),
            const AppCard(
              child: Text(
                'AlphaGuard reserves the right to terminate accounts that violate monitoring scopes or engage in unauthorized device tracking.',
                style: TextStyle(color: AppColors.warning, fontSize: 13, fontWeight: FontWeight.bold, height: 1.4),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 14.5)),
          const SizedBox(height: 6),
          Text(body, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.45)),
        ],
      ),
    );
  }
}
