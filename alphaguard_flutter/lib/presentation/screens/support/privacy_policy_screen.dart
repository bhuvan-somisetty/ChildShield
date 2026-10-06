import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../widgets/app_card.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            const Text(
              'ALPHAGUARD PRIVACY POLICY',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18),
            ),
            const SizedBox(height: 6),
            const Text(
              'Last updated: June 19, 2026',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 16),
            _section(
              '1. Commitment to Child Safety & Privacy',
              'AlphaGuard is dedicated to shielding children while keeping parents informed. We strictly adhere to COPPA (Children\'s Online Privacy Protection Act) guidelines. All data collection is strictly confined to parental monitoring and safety diagnostics.',
            ),
            _section(
              '2. Data Collection & Transmission',
              'We collect and transmit background location telemetry, app usage logs, battery status, and device health parameters. This data is transmitted securely via SSL encryption to our production PostgreSQL database and Lokijs cache layer.',
            ),
            _section(
              '3. Storage & Security',
              'Telemetry logs are encrypted in transit and at rest. Security PIN gates prevent unauthorized sessions from accessing parental screens. Passwords and PIN codes are hashed using industry-standard bcrypt algorithm server-side.',
            ),
            _section(
              '4. Self-Service Erasure & Retention',
              'Under GDPR and CCPA rules, parents retain complete control over their data. You can delete your account at any time via Account Settings. Deletion requests are processed immediately (soft-deleted) and permanently purged after a 30-day SLA window.',
            ),
            const SizedBox(height: 20),
            const AppCard(
              child: Text(
                'AlphaGuard does not sell, trade, or share child telemetry with third-party advertisers or aggregators under any circumstances.',
                style: TextStyle(color: AppColors.cyan, fontSize: 13, fontWeight: FontWeight.bold, height: 1.4),
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
