import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/target.dart';
import '../../../data/repositories/target_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/targets_controller.dart';
import '../../widgets/app_card.dart';
import '../../widgets/primary_button.dart';

/// Targets/goals — create, edit, progress tracking, history. Live realtime.
class TargetsScreen extends StatelessWidget {
  const TargetsScreen({super.key, required this.childId, this.childName});
  final String childId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<TargetsController>(
      create: (ctx) => TargetsController(repo: ctx.read<TargetRepository>(), socket: ctx.read<SocketService>(), childId: childId)..load(),
      child: _TargetsView(childName: childName),
    );
  }
}

class _TargetsView extends StatelessWidget {
  const _TargetsView({this.childName});
  final String? childName;
  @override
  Widget build(BuildContext context) {
    final c = context.watch<TargetsController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(backgroundColor: AppColors.bg, title: Text('Goals${childName != null ? ' · $childName' : ''}', style: const TextStyle(fontWeight: FontWeight.w900))),
      floatingActionButton: FloatingActionButton(backgroundColor: AppColors.cyan, onPressed: () => _editSheet(context, c), child: const Icon(Icons.add, color: Colors.white)),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: c.loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                : c.error != null
                    ? Center(child: Text(c.error!, style: const TextStyle(color: AppColors.danger)))
                    : c.targets.isEmpty
                        ? const Center(child: EmptyState(icon: Icons.flag_outlined, title: 'No goals yet', subtitle: 'Tap + to set the first goal.'))
                        : ListView(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            children: [...c.targets.map((t) => _TargetCard(c: c, t: t)), const SizedBox(height: 90)],
                          ),
          ),
        ),
      ),
    );
  }
}

class _TargetCard extends StatelessWidget {
  const _TargetCard({required this.c, required this.t});
  final TargetsController c;
  final Target t;
  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(t.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 15))),
          TagChip(label: t.statusLabel, color: t.statusColor),
          PopupMenuButton<String>(
            color: AppColors.surface,
            icon: const Icon(Icons.more_horiz, color: AppColors.textMuted, size: 20),
            onSelected: (v) {
              if (v == 'edit') _editSheet(context, c, existing: t);
              if (v == 'history') _historySheet(context, c, t);
              if (v == 'delete') c.remove(t.id);
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'edit', child: Text('Edit', style: TextStyle(color: AppColors.textPrimary))),
              PopupMenuItem(value: 'history', child: Text('History', style: TextStyle(color: AppColors.textPrimary))),
              PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: AppColors.danger))),
            ],
          ),
        ]),
        const SizedBox(height: 6),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(t.category, style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w700)),
          Text('${t.progress}%', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 13)),
        ]),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(value: t.progress / 100, minHeight: 7, backgroundColor: Colors.white10, valueColor: const AlwaysStoppedAnimation(AppColors.cyan)),
        ),
        if (t.status != 'completed')
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: OutlinedButton.icon(
              onPressed: () => c.setProgress(t.id, (t.progress + 10).clamp(0, 100)),
              icon: const Icon(Icons.add, size: 16),
              label: const Text('+10% progress'),
              style: OutlinedButton.styleFrom(foregroundColor: AppColors.success, minimumSize: const Size.fromHeight(38)),
            ),
          ),
      ]),
    );
  }
}

void _editSheet(BuildContext context, TargetsController c, {Target? existing}) {
  final title = TextEditingController(text: existing?.title ?? '');
  final desc = TextEditingController(text: existing?.description ?? '');
  final cat = TextEditingController(text: existing?.category ?? 'general');
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
      child: Container(
        decoration: const BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.vertical(top: Radius.circular(28)), border: Border.fromBorderSide(BorderSide(color: AppColors.border))),
        padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.paddingOf(ctx).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(existing == null ? 'New Goal' : 'Edit Goal', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 14),
          TextField(controller: title, autofocus: existing == null, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Goal title')),
          const SizedBox(height: 12),
          TextField(controller: desc, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Description (optional)')),
          const SizedBox(height: 12),
          TextField(controller: cat, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Category')),
          const SizedBox(height: 16),
          PrimaryButton(
            label: existing == null ? 'Create' : 'Save',
            onPressed: () async {
              if (title.text.trim().isEmpty) return;
              if (existing == null) {
                await c.create(title: title.text.trim(), description: desc.text.trim(), category: cat.text.trim());
              } else {
                await c.edit(existing.id, {'title': title.text.trim(), 'description': desc.text.trim(), 'category': cat.text.trim()});
              }
              if (ctx.mounted) Navigator.pop(ctx);
            },
          ),
        ]),
      ),
    ),
  );
}

void _historySheet(BuildContext context, TargetsController c, Target t) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(ctx).height * 0.7),
      decoration: const BoxDecoration(color: AppColors.bgElevated, borderRadius: BorderRadius.vertical(top: Radius.circular(28)), border: Border.fromBorderSide(BorderSide(color: AppColors.border))),
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.paddingOf(ctx).bottom),
      child: FutureBuilder<List<TargetHistoryEntry>>(
        future: c.history(t.id),
        builder: (ctx, snap) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Goal History', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)),
          const SizedBox(height: 12),
          if (!snap.hasData)
            const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
          else if (snap.data!.isEmpty)
            const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Text('No history yet.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)))
          else
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: snap.data!.map((h) => ListTile(
                      dense: true,
                      leading: const Icon(Icons.circle, size: 8, color: AppColors.cyan),
                      title: Text(h.describe(), style: const TextStyle(color: AppColors.textPrimary, fontSize: 13)),
                      subtitle: Text('${h.actorRole} · ${DateTime.fromMillisecondsSinceEpoch(h.at).toString().substring(0, 16)}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    )).toList(),
              ),
            ),
        ]),
      ),
    ),
  );
}
