import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/task.dart';
import '../../../data/models/task_comment.dart';
import '../../../data/models/task_history.dart';
import '../../../data/models/task_proof.dart';
import '../../../data/repositories/task_repository.dart';
import '../../../services/socket/socket_events.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/tasks_controller.dart';
import 'task_sheets.dart';

/// Realtime parent ↔ child task discussion thread.
void showCommentsSheet(BuildContext context, Task task) {
  final repo = context.read<TaskRepository>();
  final socket = context.read<SocketService>();
  showAgSheet(context, (ctx) => _CommentsView(repo: repo, socket: socket, task: task));
}

class _CommentsView extends StatefulWidget {
  const _CommentsView({required this.repo, required this.socket, required this.task});
  final TaskRepository repo;
  final SocketService socket;
  final Task task;
  @override
  State<_CommentsView> createState() => _CommentsViewState();
}

class _CommentsViewState extends State<_CommentsView> {
  final _input = TextEditingController();
  List<TaskComment> _items = [];
  bool _loading = true;
  void Function()? _off;

  @override
  void initState() {
    super.initState();
    widget.repo.comments(widget.task.id).then((c) {
      if (mounted) setState(() { _items = c; _loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => _loading = false);
    });
    _off = widget.socket.on(SocketEvents.taskComment, (data) {
      final c = TaskComment.fromJson(Map<String, dynamic>.from(data as Map));
      if (c.taskId != widget.task.id) return;
      if (_items.any((x) => x.id == c.id)) return;
      setState(() => _items = [..._items, c]);
    });
  }

  @override
  void dispose() {
    _off?.call();
    _input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    _input.clear();
    final updated = await widget.repo.addComment(widget.task.id, text);
    if (mounted) setState(() => _items = updated);
  }

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Center(child: Container(width: 40, height: 5, margin: const EdgeInsets.only(bottom: 14), decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(99)))),
      const Text('Task Discussion', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)),
      const SizedBox(height: 12),
      Flexible(
        child: _loading
            ? const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
            : _items.isEmpty
                ? const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Text('No comments yet.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)))
                : ListView(
                    shrinkWrap: true,
                    children: _items.map((c) => Align(
                          alignment: c.isParent ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(10),
                            constraints: const BoxConstraints(maxWidth: 320),
                            decoration: BoxDecoration(
                              color: (c.isParent ? AppColors.indigo : AppColors.cyan).withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: (c.isParent ? AppColors.indigo : AppColors.cyan).withValues(alpha: 0.18)),
                            ),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(c.isParent ? 'You' : 'Child', style: TextStyle(color: c.isParent ? AppColors.indigo : AppColors.cyan, fontSize: 10, fontWeight: FontWeight.w800)),
                              Text(c.body, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13.5)),
                            ]),
                          ),
                        )).toList(),
                  ),
      ),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: TextField(controller: _input, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(hintText: 'Add a comment…'), onSubmitted: (_) => _send())),
        const SizedBox(width: 8),
        IconButton.filled(onPressed: _send, icon: const Icon(Icons.send), style: IconButton.styleFrom(backgroundColor: AppColors.cyan)),
      ]),
    ]);
  }
}

/// Full task audit history.
void showHistorySheet(BuildContext context, Task task) {
  final repo = context.read<TaskRepository>();
  showAgSheet(context, (ctx) => FutureBuilder<List<TaskHistoryEntry>>(
        future: repo.history(task.id),
        builder: (ctx, snap) {
          return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Center(child: Container(width: 40, height: 5, margin: const EdgeInsets.only(bottom: 14), decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(99)))),
            const Text('Task History', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)),
            const SizedBox(height: 12),
            if (!snap.hasData)
              const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
            else if (snap.data!.isEmpty)
              const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Text('No history yet.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)))
            else
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: snap.data!.map((h) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.03), borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: AppColors.indigo.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(99)),
                            child: Text(h.actorRole, style: const TextStyle(color: AppColors.indigo, fontSize: 10, fontWeight: FontWeight.w800)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(h.describe(), style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
                              Text(DateTime.fromMillisecondsSinceEpoch(h.at).toString().substring(0, 16), style: const TextStyle(color: AppColors.textMuted, fontSize: 11.5)),
                            ]),
                          ),
                        ]),
                      )).toList(),
                ),
              ),
          ]);
        },
      ));
}

/// Photo proof viewer + (child-device) uploader.
void showProofSheet(BuildContext context, TasksController c, Task task) {
  final repo = context.read<TaskRepository>();
  showAgSheet(context, (ctx) => _ProofView(repo: repo, controller: c, task: task));
}

class _ProofView extends StatefulWidget {
  const _ProofView({required this.repo, required this.controller, required this.task});
  final TaskRepository repo;
  final TasksController controller;
  final Task task;
  @override
  State<_ProofView> createState() => _ProofViewState();
}

class _ProofViewState extends State<_ProofView> {
  List<TaskProof>? _items;
  bool _uploading = false;
  String? _msg;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  Future<void> _reload() async {
    try {
      final p = await widget.repo.proofs(widget.task.id);
      if (mounted) setState(() => _items = p);
    } catch (_) {
      if (mounted) setState(() => _items = const []);
    }
  }

  Future<void> _upload(ImageSource source) async {
    setState(() { _uploading = true; _msg = null; });
    try {
      final x = await ImagePicker().pickImage(source: source, maxWidth: 1280, maxHeight: 1280, imageQuality: 82);
      if (x == null) { setState(() => _uploading = false); return; }
      final bytes = await x.readAsBytes();
      final dataUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      await widget.controller.uploadProof(widget.task.id, dataUrl: dataUrl, name: x.name);
      await _reload();
    } catch (_) {
      // A parent token is rejected (proof is a child-device action).
      if (mounted) setState(() => _msg = 'Proof is added from the child\'s device.');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Uint8List? _decode(String dataUrl) {
    final i = dataUrl.indexOf(',');
    if (i < 0) return null;
    try {
      return base64Decode(dataUrl.substring(i + 1));
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Center(child: Container(width: 40, height: 5, margin: const EdgeInsets.only(bottom: 14), decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(99)))),
      const Text('Photo Proof', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 17)),
      const SizedBox(height: 12),
      if (_items == null)
        const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator(color: AppColors.cyan)))
      else if (_items!.isEmpty)
        const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Text('No proof submitted yet.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted)))
      else
        Flexible(
          child: ListView(
            shrinkWrap: true,
            children: _items!.map((p) {
              final bytes = _decode(p.dataUrl);
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  if (bytes != null) Image.memory(bytes, fit: BoxFit.cover, width: double.infinity),
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Text('${p.kind} · ${DateTime.fromMillisecondsSinceEpoch(p.at).toString().substring(0, 16)}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ),
                ]),
              );
            }).toList(),
          ),
        ),
      if (_msg != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(_msg!, style: const TextStyle(color: AppColors.warning, fontSize: 12.5))),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: OutlinedButton.icon(onPressed: _uploading ? null : () => _upload(ImageSource.camera), icon: const Icon(Icons.camera_alt_outlined, size: 18), label: const Text('Camera'))),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton.icon(onPressed: _uploading ? null : () => _upload(ImageSource.gallery), icon: const Icon(Icons.photo_library_outlined, size: 18), label: const Text('Gallery'))),
      ]),
    ]);
  }
}
