import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../widgets/app_card.dart';

class ChildSafetyPolicyScreen extends StatelessWidget {
  const ChildSafetyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Child Safety Policy', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            const Text('ALPHAGUARD CHILD SAFETY POLICY',
                style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 6),
            const Text('Last updated: June 19, 2026',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 16),
            _section('1. Our Commitment', 'AlphaGuard is designed from the ground up with children\'s safety as the primary goal. We comply fully with COPPA (Children\'s Online Privacy Protection Act) and GDPR-K requirements. We do not market to children, and all monitoring features are transparent — children always know that the app is active.'),
            _section('2. Parental Control Architecture', 'All monitoring features are initiated and controlled exclusively by verified parents. Parents must complete identity verification during account setup. Children\'s data is never accessible to third parties, advertisers, or other family accounts.'),
            _section('3. Transparent Monitoring', 'AlphaGuard does not operate in stealth mode. Children are shown a persistent indicator when location sharing or app monitoring is active. Parents are encouraged to discuss AlphaGuard openly with their children as a family safety tool.'),
            _section('4. Data Minimisation', 'We collect only the data necessary for family safety features: location telemetry, app usage summaries, and task completion status. Conversation content is never scanned or stored. Media files are never accessed.'),
            _section('5. Security PIN & Protections', 'Parent accounts are protected by a Security PIN for sensitive actions (child removal, device unlinking, uninstall prevention). This ensures that even if a child accesses the parent\'s device, they cannot disable the safety features.'),
            _section('6. Child Data Rights', 'Parents may request full deletion of all child-related data at any time via Account Settings → Delete Account. Deletion is processed immediately (soft-deleted) and permanently purged within 30 days.'),
            _section('7. SOS & Emergency Features', 'AlphaGuard provides a one-tap SOS button for children. In an emergency, the child can alert parents instantly. This feature is always available to the child regardless of other restrictions.'),
            _section('8. No Advertising to Children', 'AlphaGuard contains zero advertising. Child profiles and activity data are never shared with advertising networks, data brokers, or analytics providers.'),
            _section('9. Reporting Concerns', 'If you believe AlphaGuard is being used in a way that harms a child, or if you have questions about our child safety practices, contact us immediately at safety@alphaguard.ai.'),
            const SizedBox(height: 8),
            const AppCard(
              child: Text(
                'AlphaGuard is certified COPPA-compliant. Children\'s data is never sold, shared, or used for purposes other than family safety.',
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
