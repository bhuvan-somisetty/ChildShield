import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../widgets/app_card.dart';

class UserManualScreen extends StatelessWidget {
  const UserManualScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('User Manual', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            const Text(
              'ALPHAGUARD USER GUIDE',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16),
            ),
            const SizedBox(height: 6),
            const Text(
              'Learn how to configure and manage AlphaGuard parental security features.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13),
            ),
            const SizedBox(height: 16),
            _guideCard(
              '1. Device Pairing & Setup',
              'To register a child device, navigate to the Device Registry in parent settings and tap "Add Child". Use the 6-digit code displayed on the parent screen to log in to the child application on your child\'s device. Approve background location and usage permissions when prompted.',
              Icons.phonelink_setup,
            ),
            _guideCard(
              '2. Configuring Safe Zones (Geofencing)',
              'Navigate to Safe Zones under the Safety hub. Tap "Create Zone", choose a point on the map, set the radius boundaries (e.g. 200m), and give it a label (e.g. School). Safe zone entries and exits trigger push alerts.',
              Icons.add_location_alt_outlined,
            ),
            _guideCard(
              '3. Real-Time Emergency SOS',
              'If your child taps the "Panic SOS" trigger in the child app, a high-severity alert is dispatched over WebSockets. Your parent app will sound an alarm immediately and display the child\'s current GPS coordinate location.',
              Icons.sos,
            ),
            _guideCard(
              '4. Analyzing AI Safety Reports',
              'AI Safety Reports compile screen usage stats, safe zone consistency, battery health, and low-battery events. The dashboard calculates overall safety scores and flags risk metrics (Excessive nighttime screen time, device tampering, or repeated GPS disablements).',
              Icons.analytics_outlined,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _guideCard(String title, String body, IconData icon) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.cyan, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
            ],
          ),
          const Divider(color: AppColors.border, height: 20),
          Text(
            body,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.45),
          ),
        ],
      ),
    );
  }
}
