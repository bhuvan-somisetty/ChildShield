import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/productivity_repository.dart';
import '../../../data/repositories/target_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/rewards_controller.dart';
import '../../widgets/app_card.dart';

/// Child Rewards — see promised/unlocked rewards and acknowledge them. Live.
class ChildRewardsScreen extends StatelessWidget {
  const ChildRewardsScreen({super.key, required this.childId});
  final String childId;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<RewardsController>(
      create: (ctx) => RewardsController(repo: ctx.read<ProductivityRepository>(), targetRepo: ctx.read<TargetRepository>(), socket: ctx.read<SocketService>(), childId: childId)..load(),
      child: const _ChildRewardsView(),
    );
  }
}

class _ChildRewardsView extends StatelessWidget {
  const _ChildRewardsView();
  Color _statusColor(String s) => switch (s) {
        'unlocked' => AppColors.success,
        'delivered' => AppColors.cyan,
        _ => AppColors.warning,
      };

  @override
  Widget build(BuildContext context) {
    final c = context.watch<RewardsController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 600 : double.infinity),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const SizedBox(height: 12),
                const Text('My Rewards', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 22)),
                const SizedBox(height: 12),
                Expanded(
                  child: c.loading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                      : c.rewards.isEmpty
                          ? const Center(child: EmptyState(icon: Icons.card_giftcard, title: 'No rewards yet', subtitle: 'Finish your goals to unlock rewards!'))
                          : ListView(children: c.rewards.map((r) {
                              final showAck = (r.status == 'unlocked' || r.status == 'delivered') && !r.childAcknowledged;
                              return AppCard(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Row(children: [
                                    Icon(r.status == 'pending' ? Icons.lock_outline : Icons.card_giftcard, color: _statusColor(r.status)),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text(r.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15))),
                                    TagChip(label: r.statusLabel, color: _statusColor(r.status)),
                                  ]),
                                  if (r.promiseText.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text('“${r.promiseText}”', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5))),
                                  if (showAck)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 10),
                                      child: OutlinedButton.icon(onPressed: () => c.acknowledge(r.id), icon: const Icon(Icons.celebration, size: 16), label: const Text('Got it! 🎉'), style: OutlinedButton.styleFrom(foregroundColor: AppColors.success, minimumSize: const Size.fromHeight(38))),
                                    )
                                  else if (r.childAcknowledged)
                                    const Padding(padding: EdgeInsets.only(top: 8), child: Text('Acknowledged ✓', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700, fontSize: 12))),
                                ]),
                              );
                            }).toList()),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
