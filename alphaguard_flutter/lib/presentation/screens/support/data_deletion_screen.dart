import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class DataDeletionScreen extends StatelessWidget {
  const DataDeletionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, color: Color(0xFFCBD5E1), size: 28),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Data Deletion', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          children: [
            // Warning
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF43F5E).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF43F5E).withValues(alpha: 0.22)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.warning_amber_rounded, color: Color(0xFFF43F5E), size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Account deletion is permanent. All data is soft-deleted immediately and purged after 30 days. This cannot be undone.',
                      style: TextStyle(color: Color(0xFFFCA5A5), fontSize: 13, height: 1.5),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text(
              'WHAT WILL BE REMOVED',
              style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.4),
            ),
            const SizedBox(height: 10),
            const _Row(icon: Icons.person_outline, label: 'Parent account and profile'),
            const _Row(icon: Icons.child_care_outlined, label: 'All linked child profiles'),
            const _Row(icon: Icons.location_on_outlined, label: 'Location history and safe zones'),
            const _Row(icon: Icons.checklist_outlined, label: 'Tasks, goals, and rewards'),
            const _Row(icon: Icons.chat_bubble_outline, label: 'Family chat history'),
            const _Row(icon: Icons.bar_chart_outlined, label: 'AI reports and analytics'),
            const SizedBox(height: 28),

            // Download data
            _ActionTile(
              icon: Icons.download_outlined,
              label: 'Download Child Data',
              sub: 'Export activity data to your email before deletion.',
              accent: const Color(0xFF06B6D4),
              onTap: () => _confirm(
                context,
                title: 'Request Data Export?',
                body: 'A data export will be sent to your registered email within 24 hours.',
                confirmLabel: 'Request Export',
                confirmColor: const Color(0xFF06B6D4),
                onConfirm: () => Navigator.of(context).pop(),
              ),
            ),
            const SizedBox(height: 10),

            // Delete account
            _ActionTile(
              icon: Icons.delete_forever_outlined,
              label: 'Delete Account & Data',
              sub: 'Permanently remove your account and all associated data.',
              accent: const Color(0xFFF43F5E),
              onTap: () => _confirm(
                context,
                title: 'Delete Account?',
                body: 'Your account will be deactivated immediately and all data permanently purged after 30 days. This cannot be reversed.',
                confirmLabel: 'Delete Forever',
                confirmColor: const Color(0xFFF43F5E),
                onConfirm: () {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Deletion request submitted.'),
                      backgroundColor: Color(0xFF1E293B),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 10),

            // Cancel
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF94A3B8),
                  side: const BorderSide(color: Color(0xFF1E293B)),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _confirm(
    BuildContext context, {
    required String title,
    required String body,
    required String confirmLabel,
    required Color confirmColor,
    required VoidCallback onConfirm,
  }) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF0F1120),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(title, style: TextStyle(color: confirmColor, fontWeight: FontWeight.w900)),
        content: Text(body, style: const TextStyle(color: AppColors.textSecondary, height: 1.5, fontSize: 13.5)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: onConfirm,
            style: ElevatedButton.styleFrom(
              backgroundColor: confirmColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(confirmLabel, style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF475569), size: 16),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.sub,
    required this.accent,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final String sub;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: accent.withValues(alpha: 0.07),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: accent.withValues(alpha: 0.22)),
        ),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: accent, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: TextStyle(color: accent, fontWeight: FontWeight.w800, fontSize: 13.5)),
                  const SizedBox(height: 2),
                  Text(sub, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: accent.withValues(alpha: 0.45), size: 18),
          ],
        ),
      ),
    );
  }
}
