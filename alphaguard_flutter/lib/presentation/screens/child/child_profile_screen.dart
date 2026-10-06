import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../state/auth_controller.dart';
import '../../widgets/app_card.dart';

/// Child Profile — name, age, emoji, and connection status.
class ChildProfileScreen extends StatelessWidget {
  const ChildProfileScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final child = context.watch<AuthController>().child;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 560 : double.infinity),
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              children: [
                AppCard(
                  child: Column(children: [
                    Text(child?.emoji ?? '🧒', style: const TextStyle(fontSize: 56)),
                    const SizedBox(height: 8),
                    Text(child?.name ?? 'Me', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 20)),
                    if (child?.age != null) Text('Age ${child!.age}', style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
                  ]),
                ),
                const SizedBox(height: 12),
                AppCard(
                  child: Row(children: [
                    const Icon(Icons.link, color: AppColors.success),
                    const SizedBox(width: 10),
                    const Expanded(child: Text('Connected to your parent', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700))),
                    const Icon(Icons.check_circle, color: AppColors.success, size: 18),
                  ]),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
