import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/safety_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/sos_controller.dart';
import '../../widgets/app_card.dart';

/// Parent SOS center — live emergency events with attached location; resolve.
class SosScreen extends StatelessWidget {
  const SosScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<SosController>(
      create: (ctx) => SosController(repo: ctx.read<SafetyRepository>(), socket: ctx.read<SocketService>())..load(),
      child: const _SosView(),
    );
  }
}

class _SosView extends StatelessWidget {
  const _SosView();
  @override
  Widget build(BuildContext context) {
    final c = context.watch<SosController>();
    final active = c.events.where((e) => e.isActive).length;
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: const Text('Emergency SOS', style: TextStyle(fontWeight: FontWeight.w900))),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : c.events.isEmpty
                    ? const Center(child: EmptyState(icon: Icons.health_and_safety_outlined, title: 'No SOS alerts', subtitle: 'Emergency alerts from your child appear here instantly.'))
                    : ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        children: [
                          if (active > 0)
                            Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.danger.withValues(alpha: 0.4))),
                              child: Row(children: [const Icon(Icons.warning_amber_rounded, color: AppColors.danger), const SizedBox(width: 10), Text('$active active emergency alert${active == 1 ? '' : 's'}', style: const TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800))]),
                            ),
                          ...c.events.map((e) => AppCard(
                                borderColor: e.isActive ? AppColors.danger.withValues(alpha: 0.4) : null,
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Row(children: [
                                    Icon(e.isActive ? Icons.sos : Icons.check_circle, color: e.isActive ? AppColors.danger : AppColors.success),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text(e.isActive ? 'Emergency SOS' : 'Resolved', style: TextStyle(color: e.isActive ? AppColors.danger : AppColors.success, fontWeight: FontWeight.w900, fontSize: 15))),
                                    Text(DateTime.fromMillisecondsSinceEpoch(e.at).toString().substring(0, 16), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                                  ]),
                                  if (e.lat != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text('Location: ${e.lat!.toStringAsFixed(5)}, ${e.lng!.toStringAsFixed(5)}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12.5))),
                                  if (e.isActive)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 10),
                                      child: OutlinedButton.icon(onPressed: () => c.resolve(e.id), icon: const Icon(Icons.check, size: 16), label: const Text('Mark resolved'), style: OutlinedButton.styleFrom(foregroundColor: AppColors.success, minimumSize: const Size.fromHeight(38))),
                                    ),
                                ]),
                              )),
                          const SizedBox(height: 24),
                        ],
                      ),
          ),
        ),
      ),
    );
  }
}
