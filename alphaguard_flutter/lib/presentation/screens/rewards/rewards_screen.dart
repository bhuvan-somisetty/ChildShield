import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/reward.dart';
import '../../../data/repositories/productivity_repository.dart';
import '../../../data/repositories/target_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/rewards_controller.dart';
import '../../widgets/app_card.dart';

/// Rewards / promises — listing, progress (status), delivery state. The parent
/// advances pending → unlocked → delivered. Live realtime.
class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<RewardsController>(
      create: (ctx) => RewardsController(
        repo: ctx.read<ProductivityRepository>(),
        targetRepo: ctx.read<TargetRepository>(),
        socket: ctx.read<SocketService>(),
        childId: childId,
      )..load(),
      child: _RewardsView(childName: childName),
    );
  }
}

class _RewardsView extends StatelessWidget {
  const _RewardsView({this.childName});
  final String? childName;

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
      appBar: AppBar(backgroundColor: AppColors.bg, title: Text('Rewards${childName != null ? ' · $childName' : ''}', style: const TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : c.rewards.isEmpty
                    ? const Center(child: EmptyState(icon: Icons.card_giftcard, title: 'No rewards yet', subtitle: 'Rewards unlock when goals are completed.'))
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        children: c.rewards.map((r) => _RewardCard(c: c, r: r, statusColor: _statusColor)).toList(),
                      ),
          ),
        ),
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  const _RewardCard({required this.c, required this.r, required this.statusColor});
  final RewardsController c;
  final Reward r;
  final Color Function(String) statusColor;

  String? get _nextStatus => switch (r.status) {
        'pending' => 'unlocked',
        'unlocked' => 'delivered',
        _ => null,
      };
  String get _nextLabel => r.status == 'pending' ? 'Mark Unlocked' : 'Mark Delivered';

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.card_giftcard, color: AppColors.warning),
          const SizedBox(width: 10),
          Expanded(child: Text(r.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15))),
          TagChip(label: r.statusLabel, color: statusColor(r.status)),
        ]),
        if (r.promiseText.isNotEmpty)
          Padding(padding: const EdgeInsets.only(top: 6), child: Text('“${r.promiseText}”', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5))),
        if (_nextStatus != null)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: OutlinedButton.icon(
              onPressed: () => c.setStatus(r.id, _nextStatus!),
              icon: const Icon(Icons.arrow_forward, size: 16),
              label: Text(_nextLabel),
              style: OutlinedButton.styleFrom(foregroundColor: statusColor(_nextStatus!), minimumSize: const Size.fromHeight(38)),
            ),
          ),
      ]),
    );
  }
}
