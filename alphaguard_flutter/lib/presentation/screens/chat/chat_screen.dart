import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/message.dart';
import '../../../data/repositories/chat_repository.dart';
import '../../../services/socket/socket_service.dart';
import '../../../state/chat_controller.dart';
import '../../widgets/app_card.dart';

/// Family Chat — realtime parent ↔ child messaging with typing indicator and
/// read receipts. Needs an active pairing.
class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key, required this.pairingId, this.childName});
  final String? pairingId;
  final String? childName;

  @override
  Widget build(BuildContext context) {
    if (pairingId == null) {
      return const Scaffold(
        backgroundColor: AppColors.bg,
        body: SafeArea(child: Center(child: EmptyState(icon: Icons.chat_bubble_outline, title: 'No conversation yet', subtitle: 'Pair a child device to start chatting.'))),
      );
    }
    return ChangeNotifierProvider<ChatController>(
      create: (ctx) => ChatController(repo: ctx.read<ChatRepository>(), socket: ctx.read<SocketService>(), pairingId: pairingId!)..load(),
      child: _ChatView(childName: childName),
    );
  }
}

class _ChatView extends StatefulWidget {
  const _ChatView({this.childName});
  final String? childName;
  @override
  State<_ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<_ChatView> {
  final _input = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _send(ChatController c) {
    if (_input.text.trim().isEmpty) return;
    c.send(_input.text);
    _input.clear();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent + 80, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<ChatController>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: context.isTablet ? 640 : double.infinity),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(children: [
                    const Icon(Icons.chat_bubble, color: AppColors.cyan),
                    const SizedBox(width: 10),
                    Expanded(child: Text(widget.childName ?? 'Family Chat', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 18))),
                  ]),
                ),
                Expanded(
                  child: c.loading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
                      : c.messages.isEmpty
                          ? const Center(child: EmptyState(icon: Icons.waving_hand, title: 'Say hello', subtitle: 'Messages with your child appear here.'))
                          : ListView.builder(
                              controller: _scroll,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: c.messages.length,
                              itemBuilder: (_, i) => _Bubble(message: c.messages[i]),
                            ),
                ),
                if (c.peerTyping)
                  const Padding(padding: EdgeInsets.only(left: 24, bottom: 4), child: Align(alignment: Alignment.centerLeft, child: Text('typing…', style: TextStyle(color: AppColors.textMuted, fontStyle: FontStyle.italic, fontSize: 12)))),
                Padding(
                  padding: EdgeInsets.fromLTRB(12, 6, 12, 8 + MediaQuery.paddingOf(context).bottom * 0),
                  child: Row(children: [
                    Expanded(
                      child: TextField(
                        controller: _input,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(hintText: 'Message…'),
                        onChanged: (_) => c.onInputChanged(),
                        onSubmitted: (_) => _send(c),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(onPressed: () => _send(c), icon: const Icon(Icons.send), style: IconButton.styleFrom(backgroundColor: AppColors.cyan)),
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

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message});
  final Message message;
  @override
  Widget build(BuildContext context) {
    final mine = message.from == 'parent';
    final color = (mine ? AppColors.indigo : AppColors.cyan);
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.74),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message.text, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14)),
            const SizedBox(height: 3),
            Row(mainAxisSize: MainAxisSize.min, children: [
              Text(_time(message.at), style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
              if (mine) ...[
                const SizedBox(width: 4),
                Icon(
                  message.status == 'sent' ? Icons.check : Icons.done_all,
                  size: 13,
                  color: message.status == 'read' ? AppColors.cyan : AppColors.textMuted,
                ),
              ],
            ]),
          ],
        ),
      ),
    );
  }

  static String _time(int at) {
    if (at == 0) return '';
    final d = DateTime.fromMillisecondsSinceEpoch(at);
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m ${d.hour < 12 ? 'AM' : 'PM'}';
  }
}
