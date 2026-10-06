import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../data/models/ai_conversation.dart';
import '../../../../state/assistant_controller.dart';
import '../assistant_persona.dart';

/// Conversation history with live search. Rendered as a fixed sidebar on tablets
/// and inside a bottom sheet on phones. Tapping a thread opens it; swipe/long-press
/// deletes. "New" starts a fresh thread.
class AssistantHistoryPanel extends StatelessWidget {
  const AssistantHistoryPanel({super.key, required this.persona, this.onOpened});

  final AssistantPersona persona;
  /// Called after a thread is opened/created so a phone sheet can dismiss itself.
  final VoidCallback? onOpened;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    final convos = c.conversations;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 12, 8),
          child: Row(children: [
            const Expanded(child: Text('History', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17))),
            TextButton.icon(
              onPressed: () {
                c.newConversation();
                onOpened?.call();
              },
              icon: Icon(Icons.add, size: 18, color: persona.accent),
              label: Text('New', style: TextStyle(color: persona.accent, fontWeight: FontWeight.w800)),
            ),
            if (convos.isNotEmpty)
              IconButton(
                tooltip: 'Clear all',
                onPressed: () => _confirmClear(context, c),
                icon: const Icon(Icons.delete_sweep_outlined, color: AppColors.textMuted, size: 20),
              ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: TextField(
            onChanged: c.setSearch,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Search conversations…',
              prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 19),
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(vertical: 11),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Expanded(
          child: convos.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      c.search.isNotEmpty ? 'No matches' : 'No conversations yet',
                      style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.w600),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  itemCount: convos.length,
                  itemBuilder: (_, i) => _Tile(
                    convo: convos[i],
                    persona: persona,
                    active: c.active?.id == convos[i].id,
                    onTap: () {
                      c.open(convos[i]);
                      onOpened?.call();
                    },
                    onDelete: () => c.deleteConversation(convos[i]),
                  ),
                ),
        ),
      ],
    );
  }

  void _confirmClear(BuildContext context, AssistantController c) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgElevated,
        title: const Text('Clear all conversations?', style: TextStyle(color: AppColors.textPrimary, fontSize: 17)),
        content: const Text('This permanently deletes your assistant history on this device.', style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(
            onPressed: () {
              c.clearAll();
              Navigator.pop(ctx);
            },
            child: const Text('Clear', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.convo, required this.persona, required this.active, required this.onTap, required this.onDelete});
  final AiConversation convo;
  final AssistantPersona persona;
  final bool active;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey(convo.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.delete_outline, color: AppColors.danger),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 3),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            decoration: BoxDecoration(
              color: active ? persona.accent.withValues(alpha: 0.10) : Colors.transparent,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: active ? persona.accent.withValues(alpha: 0.30) : AppColors.border),
            ),
            child: Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: persona.accent, shape: BoxShape.circle)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(convo.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700, fontSize: 13.5)),
                  const SizedBox(height: 2),
                  Text(convo.preview, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
