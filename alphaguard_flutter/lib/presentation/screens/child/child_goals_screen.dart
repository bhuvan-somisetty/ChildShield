import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/target_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/targets_controller.dart';
import '../../widgets/app_card.dart';

/// Child Goals & Targets — view goals set by a parent and nudge progress.
class ChildGoalsScreen extends StatelessWidget {
  const ChildGoalsScreen({super.key, required this.childId});
  final String childId;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<TargetsController>(
      create: (ctx) => TargetsController(repo: ctx.read<TargetRepository>(), socket: ctx.read<SocketService>(), childId: childId)..load(),
      child: const _ChildGoalsView(),
    );
  }
}

class _ChildGoalsView extends StatelessWidget {
  const _ChildGoalsView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<TargetsController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('My Goals', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 600 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : c.targets.isEmpty
                    ? const Center(child: EmptyState(icon: Icons.flag_outlined, title: 'No goals yet', subtitle: 'Your parent will set goals for you.'))
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        children: c.targets.map((t) => AppCard(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(children: [
                                  Expanded(child: Text(t.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15))),
                                  TagChip(label: t.statusLabel, color: t.statusColor),
                                ]),
                                const SizedBox(height: 6),
                                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                  Text(t.category, style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
                                  Text('${t.progress}%', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 13)),
                                ]),
                                const SizedBox(height: 6),
                                ClipRRect(borderRadius: BorderRadius.circular(99), child: LinearProgressIndicator(value: t.progress / 100, minHeight: 7, backgroundColor: Colors.white10, valueColor: const AlwaysStoppedAnimation(AppColors.cyan))),
                                if (t.status != 'completed')
                                  Padding(
                                    padding: const EdgeInsets.only(top: 10),
                                    child: OutlinedButton.icon(onPressed: () => c.setProgress(t.id, (t.progress + 10).clamp(0, 100)), icon: const Icon(Icons.add, size: 16), label: const Text('+10% done'), style: OutlinedButton.styleFrom(foregroundColor: AppColors.success, minimumSize: const Size.fromHeight(38))),
                                  ),
                              ]),
                            )).toList(),
                      ),
          ),
        ),
      ),
    );
  }
}
