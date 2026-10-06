import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/task.dart';
import '../../../data/models/task_category.dart';
import '../../../state/tasks_controller.dart';
import '../../widgets/primary_button.dart';
import 'task_detail_sheets.dart';

/// Bottom-sheet shell — responsive, scroll-safe, keyboard-aware.
Future<T?> showAgSheet<T>(BuildContext context, Widget Function(BuildContext) builder) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: 560, maxHeight: MediaQuery.sizeOf(ctx).height * 0.9),
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.bgElevated,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.fromBorderSide(BorderSide(color: AppColors.border)),
            ),
            padding: EdgeInsets.fromLTRB(20, 14, 20, 20 + MediaQuery.paddingOf(ctx).bottom),
            child: builder(ctx),
          ),
        ),
      ),
    ),
  );
}

Widget _grabber() => Container(width: 40, height: 5, margin: const EdgeInsets.only(bottom: 14), decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(99)));

/// Per-task actions menu.
void showTaskActions(BuildContext context, TasksController c, Task task) {
  showAgSheet(context, (ctx) {
    Widget item(IconData icon, String label, VoidCallback onTap, {Color color = AppColors.textPrimary}) => ListTile(
          leading: Icon(icon, color: color),
          title: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 15)),
          onTap: () {
            Navigator.pop(ctx);
            onTap();
          },
        );
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Center(child: _grabber()),
      Text(task.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16)),
      const SizedBox(height: 8),
      item(Icons.edit_outlined, 'Edit task', () => showTaskEditor(context, c, existing: task)),
      item(Icons.chat_bubble_outline, 'Comments', () => showCommentsSheet(context, task)),
      item(Icons.history, 'History', () => showHistorySheet(context, task)),
      if (task.requireProof || task.proofCount > 0) item(Icons.image_outlined, 'Photo proof', () => showProofSheet(context, c, task)),
      item(Icons.delete_outline, 'Delete', () => c.remove(task.id), color: AppColors.danger),
    ]);
  });
}

/// Create / edit a task. For NEW tasks a "Repeat" option creates a recurring rule.
void showTaskEditor(BuildContext context, TasksController c, {Task? existing}) {
  showAgSheet(context, (ctx) => _TaskEditor(controller: c, existing: existing));
}

class _TaskEditor extends StatefulWidget {
  const _TaskEditor({required this.controller, this.existing});
  final TasksController controller;
  final Task? existing;
  @override
  State<_TaskEditor> createState() => _TaskEditorState();
}

class _TaskEditorState extends State<_TaskEditor> {
  late final _title = TextEditingController(text: widget.existing?.title ?? '');
  late final _note = TextEditingController(text: widget.existing?.note ?? '');
  late String _category = widget.existing?.category.isNotEmpty == true ? widget.existing!.category : 'Homework';
  late bool _requireProof = widget.existing?.requireProof ?? false;
  late bool _requireApproval = widget.existing?.requireApproval ?? false;
  String _repeat = 'none';
  DateTime? _dueAt;
  bool _busy = false;

  bool get _isNew => widget.existing == null;

  @override
  void dispose() {
    _title.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty || _busy) return;
    setState(() => _busy = true);
    try {
      if (_isNew && _repeat != 'none') {
        await widget.controller.createRecurring(title: _title.text.trim(), frequency: _repeat, category: _category);
      } else if (_isNew) {
        await widget.controller.create(
          title: _title.text.trim(),
          category: _category,
          note: _note.text.trim(),
          dueAt: _dueAt?.toIso8601String().substring(0, 10),
          requireProof: _requireProof,
          requireApproval: _requireApproval,
        );
      } else {
        await widget.controller.edit(widget.existing!.id, {
          'title': _title.text.trim(),
          'note': _note.text.trim(),
          'category': _category,
          'requireProof': _requireProof,
          'requireApproval': _requireApproval,
        });
      }
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final catNames = {
      ...TaskCategory.builtinNames,
      ...widget.controller.categories.map((e) => e.name),
    }.toList();
    return SingleChildScrollView(
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Center(child: _grabber()),
        Text(_isNew ? 'New Task' : 'Edit Task', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
        const SizedBox(height: 16),
        TextField(controller: _title, autofocus: _isNew, onChanged: (_) => setState(() {}), style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'What needs to be done?')),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: catNames.contains(_category) ? _category : catNames.first,
          dropdownColor: AppColors.surface,
          decoration: const InputDecoration(labelText: 'Category'),
          items: catNames.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
          onChanged: (v) => setState(() => _category = v ?? _category),
        ),
        const SizedBox(height: 12),
        TextField(controller: _note, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Add a note (optional)')),
        const SizedBox(height: 12),
        if (_isNew)
          DropdownButtonFormField<String>(
            value: _repeat,
            dropdownColor: AppColors.surface,
            decoration: const InputDecoration(labelText: 'Repeat'),
            items: const [
              DropdownMenuItem(value: 'none', child: Text('Does not repeat', style: TextStyle(color: AppColors.textPrimary))),
              DropdownMenuItem(value: 'daily', child: Text('Daily', style: TextStyle(color: AppColors.textPrimary))),
              DropdownMenuItem(value: 'weekdays', child: Text('Weekdays', style: TextStyle(color: AppColors.textPrimary))),
              DropdownMenuItem(value: 'weekly', child: Text('Weekly', style: TextStyle(color: AppColors.textPrimary))),
              DropdownMenuItem(value: 'monthly', child: Text('Monthly', style: TextStyle(color: AppColors.textPrimary))),
            ],
            onChanged: (v) => setState(() => _repeat = v ?? 'none'),
          ),
        if (_isNew && _repeat == 'none') ...[
          const SizedBox(height: 8),
          _DueRow(date: _dueAt, onPick: (d) => setState(() => _dueAt = d)),
        ],
        const SizedBox(height: 8),
        _ToggleRow(label: 'Require photo proof', value: _requireProof, onChanged: (v) => setState(() => _requireProof = v)),
        _ToggleRow(label: 'Require my approval', value: _requireApproval, onChanged: (v) => setState(() => _requireApproval = v)),
        const SizedBox(height: 16),
        PrimaryButton(label: _isNew ? 'Create' : 'Save', loading: _busy, onPressed: _title.text.trim().isEmpty ? null : _save),
      ]),
    );
  }
}

class _DueRow extends StatelessWidget {
  const _DueRow({required this.date, required this.onPick});
  final DateTime? date;
  final ValueChanged<DateTime?> onPick;
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      const Icon(Icons.event, color: AppColors.textMuted, size: 18),
      const SizedBox(width: 8),
      Expanded(child: Text(date == null ? 'No due date' : 'Due ${date!.toIso8601String().substring(0, 10)}', style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w600))),
      TextButton(
        onPressed: () async {
          final now = DateTime.now();
          final picked = await showDatePicker(context: context, initialDate: date ?? now, firstDate: now.subtract(const Duration(days: 1)), lastDate: now.add(const Duration(days: 365)));
          if (picked != null) onPick(picked);
        },
        child: const Text('Pick', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700)),
      ),
      if (date != null) IconButton(onPressed: () => onPick(null), icon: const Icon(Icons.close, size: 16, color: AppColors.textMuted)),
    ]);
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({required this.label, required this.value, required this.onChanged});
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  @override
  Widget build(BuildContext context) => SwitchListTile(
        contentPadding: EdgeInsets.zero,
        dense: true,
        title: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
        value: value,
        activeColor: AppColors.cyan,
        onChanged: onChanged,
      );
}

/// Reject a pending task with a required correction comment.
void showRejectSheet(BuildContext context, TasksController c, Task task) {
  final ctrl = TextEditingController();
  showAgSheet(context, (ctx) {
    var busy = false; // hoisted so StatefulBuilder rebuilds don't reset it
    return StatefulBuilder(builder: (ctx, setState) {
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Center(child: _grabber()),
          const Text('Request Changes', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18)),
          const SizedBox(height: 8),
          const Text('Tell your child what to fix. This is sent to the task chat.', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 12),
          TextField(controller: ctrl, autofocus: true, maxLines: 3, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'e.g. Please clean under the bed too.')),
          const SizedBox(height: 16),
          PrimaryButton(
            label: 'Send & Reject',
            loading: busy,
            onPressed: () async {
              if (ctrl.text.trim().isEmpty) return;
              setState(() => busy = true);
              try {
                await c.reject(task.id, ctrl.text.trim());
                if (ctx.mounted) Navigator.pop(ctx);
              } catch (_) {
                setState(() => busy = false);
              }
            },
          ),
        ]);
    });
  });
}

/// Manage recurring rules.
void showRecurringSheet(BuildContext context, TasksController c) {
  showAgSheet(context, (ctx) => AnimatedBuilder(
        animation: c,
        builder: (ctx, _) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Center(child: _grabber()),
          Row(children: [
            const Expanded(child: Text('Recurring Tasks', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18))),
            TextButton.icon(onPressed: () => showTaskEditor(context, c), icon: const Icon(Icons.add, size: 18, color: AppColors.cyan), label: const Text('New', style: TextStyle(color: AppColors.cyan, fontWeight: FontWeight.w700))),
          ]),
          const SizedBox(height: 8),
          if (c.recurring.isEmpty)
            const Padding(padding: EdgeInsets.symmetric(vertical: 28), child: Text('No recurring tasks yet.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)))
          else
            ...c.recurring.map((r) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.repeat, color: AppColors.cyan),
                  title: Text(r.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
                  subtitle: Text('${r.frequencyLabel} · ${r.category}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  trailing: IconButton(icon: const Icon(Icons.delete_outline, color: AppColors.danger), onPressed: () => c.deleteRecurring(r.id)),
                )),
        ]),
      ));
}
