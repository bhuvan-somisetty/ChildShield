import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/responsive/responsive.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/ai_message.dart';
import '../../../data/repositories/assistant_repository.dart';
import '../../../services/ai/assistant_engine.dart';
import '../../../services/ai/child_assistant_engine.dart';
import '../../../services/ai/parent_assistant_engine.dart';
import '../../../state/assistant_controller.dart';
import 'assistant_persona.dart';
import 'widgets/assistant_history_panel.dart';
import 'widgets/assistant_message_bubble.dart';

/// AI Assistant tab. Parent and child share this screen via named constructors
/// that pick the engine + persona. Tablets get a master/detail layout (history
/// sidebar + chat); phones get a single column with a history sheet.
class AssistantScreen extends StatelessWidget {
  const AssistantScreen._({required this.engine, required this.persona, required this.context});

  /// Parent co-pilot.
  factory AssistantScreen.parent({String? parentName, String? childName, int pendingApprovals = 0, int goalsRemaining = 0, String? nextGoalTitle}) {
    return AssistantScreen._(
      engine: const ParentAssistantEngine(),
      persona: AssistantPersona.parent,
      context: AssistantContext(userName: parentName, childName: childName, pendingApprovals: pendingApprovals, goalsRemaining: goalsRemaining, nextGoalTitle: nextGoalTitle),
    );
  }

  /// Child study buddy.
  factory AssistantScreen.child({String? childName, String? grade, String? school, int goalsRemaining = 0, String? nextGoalTitle}) {
    return AssistantScreen._(
      engine: const ChildAssistantEngine(),
      persona: AssistantPersona.child,
      context: AssistantContext(childName: childName, grade: grade, school: school, goalsRemaining: goalsRemaining, nextGoalTitle: nextGoalTitle),
    );
  }

  final AssistantEngine engine;
  final AssistantPersona persona;
  final AssistantContext context;

  @override
  Widget build(BuildContext ctx) {
    return ChangeNotifierProvider<AssistantController>(
      create: (c) => AssistantController(
        engine: engine,
        repo: c.read<AssistantRepository>(),
        persona: persona.key,
        context: context,
      )..init(),
      child: _AssistantView(persona: persona),
    );
  }
}

class _AssistantView extends StatefulWidget {
  const _AssistantView({required this.persona});
  final AssistantPersona persona;
  @override
  State<_AssistantView> createState() => _AssistantViewState();
}

class _AssistantViewState extends State<_AssistantView> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  String? _lastConvoId;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent + 120, duration: const Duration(milliseconds: 220), curve: Curves.easeOut);
    });
  }

  void _send(AssistantController c, [String? preset]) {
    final text = preset ?? _input.text;
    if (text.trim().isEmpty || c.streaming) return;
    c.send(text);
    _input.clear();
    _scrollToEnd();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    final persona = widget.persona;

    // Auto-scroll as the active thread changes or grows.
    if (c.active?.id != _lastConvoId || c.streaming) {
      _lastConvoId = c.active?.id;
      _scrollToEnd();
    }

    final chat = _ChatColumn(persona: persona, input: _input, scroll: _scroll, onSend: _send);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: context.isTablet
            // Master/detail: history sidebar + chat (iPad / tablet / foldable open).
            ? Row(children: [
                SizedBox(
                  width: 300,
                  child: Container(
                    decoration: const BoxDecoration(border: Border(right: BorderSide(color: AppColors.border))),
                    child: AssistantHistoryPanel(persona: persona),
                  ),
                ),
                Expanded(child: chat),
              ])
            : chat,
      ),
    );
  }
}

class _ChatColumn extends StatelessWidget {
  const _ChatColumn({required this.persona, required this.input, required this.scroll, required this.onSend});
  final AssistantPersona persona;
  final TextEditingController input;
  final ScrollController scroll;
  final void Function(AssistantController, [String?]) onSend;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    return Column(children: [
      _Header(persona: persona),
      Expanded(
        child: c.loading
            ? Center(child: CircularProgressIndicator(color: persona.accent))
            : Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 720),
                  child: _MessageList(persona: persona, scroll: scroll),
                ),
              ),
      ),
      _QuickPrompts(persona: persona, onTap: (t) => onSend(c, t)),
      _Composer(persona: persona, input: input, onSend: () => onSend(c)),
    ]);
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.persona});
  final AssistantPersona persona;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 10, 8),
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(gradient: LinearGradient(colors: persona.avatarGradient, begin: Alignment.topLeft, end: Alignment.bottomRight), shape: BoxShape.circle),
          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 21),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(persona.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5)),
            Text(c.streaming ? 'typing…' : persona.tagline, style: TextStyle(color: c.streaming ? persona.accent : AppColors.textMuted, fontWeight: FontWeight.w700, fontSize: 11.5)),
          ]),
        ),
        IconButton(
          tooltip: 'New conversation',
          onPressed: c.streaming ? null : context.read<AssistantController>().newConversation,
          icon: const Icon(Icons.add_comment_outlined, color: AppColors.textSecondary, size: 21),
        ),
        // Phone-only: history lives in a sheet (tablet shows the sidebar).
        if (context.isPhone)
          IconButton(
            tooltip: 'History',
            onPressed: () => _openHistorySheet(context, persona),
            icon: const Icon(Icons.history, color: AppColors.textSecondary, size: 22),
          ),
      ]),
    );
  }

  void _openHistorySheet(BuildContext context, AssistantPersona persona) {
    final controller = context.read<AssistantController>();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.bgElevated,
      isScrollControlled: true,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => ChangeNotifierProvider<AssistantController>.value(
        value: controller,
        child: FractionallySizedBox(
          heightFactor: 0.82,
          child: AssistantHistoryPanel(persona: persona, onOpened: () => Navigator.of(context).maybePop()),
        ),
      ),
    );
  }
}

class _MessageList extends StatelessWidget {
  const _MessageList({required this.persona, required this.scroll});
  final AssistantPersona persona;
  final ScrollController scroll;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    final msgs = c.messages;

    if (msgs.isEmpty) {
      return _Greeting(persona: persona);
    }
    return ListView.builder(
      controller: scroll,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      itemCount: msgs.length,
      itemBuilder: (_, i) => AssistantMessageBubble(
        message: msgs[i],
        persona: persona,
        onAction: (a) => _onAction(context, a),
      ),
    );
  }

  void _onAction(BuildContext context, AiAction action) {
    // Deep navigation targets aren't all routed in the Flutter shell yet; surface
    // the intent so the button is never a dead end. Real routing drops in here.
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(action.label ?? 'Opening…'), behavior: SnackBarBehavior.floating, backgroundColor: AppColors.surface),
    );
  }
}

class _Greeting extends StatelessWidget {
  const _Greeting({required this.persona});
  final AssistantPersona persona;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(gradient: LinearGradient(colors: persona.avatarGradient, begin: Alignment.topLeft, end: Alignment.bottomRight), shape: BoxShape.circle),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 36),
          ),
          const SizedBox(height: 18),
          Text(
            context.read<AssistantController>().persona == 'child'
                ? "Hi! I'm DISHA — your study buddy. Ask me anything ✨"
                : "Hi, I'm DISHA — your family safety co-pilot.",
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w800, fontSize: 16, height: 1.4),
          ),
          const SizedBox(height: 8),
          const Text('Pick a prompt below or just start typing.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ]),
      ),
    );
  }
}

class _QuickPrompts extends StatelessWidget {
  const _QuickPrompts({required this.persona, required this.onTap});
  final AssistantPersona persona;
  final void Function(String) onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    if (c.streaming) return const SizedBox.shrink();
    final prompts = c.quickPrompts;
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        itemCount: prompts.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final p = prompts[i];
          return ActionChip(
            label: Text(p.label, style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w700, fontSize: 12.5)),
            backgroundColor: AppColors.bgElevated,
            side: const BorderSide(color: AppColors.border),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            onPressed: () => onTap(p.text),
          );
        },
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.persona, required this.input, required this.onSend});
  final AssistantPersona persona;
  final TextEditingController input;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final c = context.watch<AssistantController>();
    return Padding(
      padding: EdgeInsets.fromLTRB(12, 4, 12, 8 + MediaQuery.viewInsetsOf(context).bottom * 0),
      child: Row(children: [
        Expanded(
          child: TextField(
            controller: input,
            minLines: 1,
            maxLines: 4,
            textInputAction: TextInputAction.send,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14.5),
            decoration: InputDecoration(
              hintText: c.persona == 'child' ? 'Ask DISHA anything…' : 'Ask about safety, tasks…',
              filled: true,
              fillColor: AppColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
            ),
            onSubmitted: (_) => onSend(),
          ),
        ),
        const SizedBox(width: 8),
        c.streaming
            ? IconButton.filled(
                onPressed: c.stop,
                icon: const Icon(Icons.stop_rounded),
                style: IconButton.styleFrom(backgroundColor: AppColors.danger, minimumSize: const Size(48, 48)),
              )
            : IconButton.filled(
                onPressed: onSend,
                icon: const Icon(Icons.arrow_upward_rounded),
                style: IconButton.styleFrom(backgroundColor: persona.accent, minimumSize: const Size(48, 48)),
              ),
      ]),
    );
  }
}
