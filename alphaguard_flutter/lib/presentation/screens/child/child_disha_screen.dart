import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

// Matches frontend-v2/src/screens/child/app/Disha.jsx
// Violet AI study buddy chat interface for child users.

class ChildDishaScreen extends StatefulWidget {
  const ChildDishaScreen({super.key});

  @override
  State<ChildDishaScreen> createState() => _ChildDishaScreenState();
}

class _ChildDishaScreenState extends State<ChildDishaScreen> with TickerProviderStateMixin {
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final List<_ChatMsg> _messages = [
    _ChatMsg(text: "Hi! I'm DISHA, your study buddy 🌟 Ask me anything about your homework, subjects, or study tips!", fromDisha: true),
  ];
  bool _isTyping = false;
  late final AnimationController _dot1 = AnimationController(vsync: this, duration: const Duration(milliseconds: 600))..repeat(reverse: true);
  late final AnimationController _dot2 = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
  late final AnimationController _dot3 = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));

  static const _quickPrompts = [
    '📚 Help with homework',
    '🧮 Solve a math problem',
    '📝 Essay tips',
    '🔬 Science question',
    '🗓 Study schedule',
    '💡 Memory tricks',
  ];

  @override
  void initState() {
    super.initState();
    // Stagger dot animations: 0ms / 200ms / 400ms offset
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _dot2.repeat(reverse: true);
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _dot3.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _dot1.dispose();
    _dot2.dispose();
    _dot3.dispose();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _send(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;
    setState(() {
      _messages.add(_ChatMsg(text: trimmed, fromDisha: false));
      _isTyping = true;
      _inputCtrl.clear();
    });
    _scrollToBottom();
    // Simulate DISHA response after 1.5s
    Future.delayed(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      setState(() {
        _isTyping = false;
        _messages.add(_ChatMsg(text: "That's a great question! I'm processing it now. In a full implementation I'd connect to an AI backend to give you a detailed answer. Keep asking! 🌟", fromDisha: true));
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final safe = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.bg,
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          SizedBox(height: safe.top),
          _buildHeader(context),
          Expanded(child: _buildMessageList()),
          _buildQuickPrompts(),
          _buildInputBar(safe),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .05),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withValues(alpha: .1)),
              ),
              child: const Icon(Icons.chevron_left_rounded, color: Color(0xFFCBD5E1), size: 20),
            ),
          ),
          const SizedBox(width: 12),
          // Violet gradient avatar circle
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFA855F7), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('DISHA', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                Text('Your study buddy', style: TextStyle(color: Color(0xFFC084FC), fontSize: 11.5, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('Voice mode coming soon'),
              behavior: SnackBarBehavior.floating,
            )),
            child: Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFA855F7), Color(0xFF6366F1)]),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.mic_rounded, color: Colors.white, size: 14),
                  SizedBox(width: 5),
                  Text('Speak', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    return ListView.builder(
      controller: _scrollCtrl,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      itemCount: _messages.length + (_isTyping ? 1 : 0),
      itemBuilder: (context, i) {
        if (_isTyping && i == _messages.length) return _buildTypingIndicator();
        final msg = _messages[i];
        return _buildBubble(msg);
      },
    );
  }

  Widget _buildBubble(_ChatMsg msg) {
    final isChild = !msg.fromDisha;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isChild ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isChild) ...[
            Container(
              width: 28, height: 28,
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFFA855F7), Color(0xFF6366F1)]),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 12),
            ),
            const SizedBox(width: 8),
          ],
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                gradient: isChild
                    ? const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF0D9488)])
                    : null,
                color: isChild ? null : Colors.white.withValues(alpha: .05),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: Radius.circular(isChild ? 4 : 18),
                  bottomLeft: Radius.circular(isChild ? 18 : 4),
                  bottomRight: const Radius.circular(18),
                ),
              ),
              child: Text(msg.text, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500, height: 1.45)),
            ),
          ),
          if (isChild) const SizedBox(width: 0),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 28, height: 28,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFFA855F7), Color(0xFF6366F1)]),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 12),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .05),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(_dot1),
                const SizedBox(width: 4),
                _buildDot(_dot2),
                const SizedBox(width: 4),
                _buildDot(_dot3),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(AnimationController ctrl) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.3, end: 1.0).animate(CurvedAnimation(parent: ctrl, curve: Curves.easeInOut)),
      child: Container(
        width: 6, height: 6,
        decoration: const BoxDecoration(color: Color(0xFFA855F7), shape: BoxShape.circle),
      ),
    );
  }

  Widget _buildQuickPrompts() {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _quickPrompts.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final p = _quickPrompts[i];
          return GestureDetector(
            onTap: () => _send(p),
            child: Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: AppColors.bgElevated,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withValues(alpha: .1)),
              ),
              child: Center(child: Text(p, style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12.5, fontWeight: FontWeight.w600))),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputBar(EdgeInsets safe) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 10, 20, safe.bottom + 10),
      decoration: BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: .06))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF11131D),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.white.withValues(alpha: .1)),
              ),
              child: TextField(
                controller: _inputCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                decoration: InputDecoration(
                  hintText: 'Ask DISHA anything…',
                  hintStyle: TextStyle(color: Colors.white.withValues(alpha: .3), fontSize: 14),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onSubmitted: _send,
                textInputAction: TextInputAction.send,
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () => _send(_inputCtrl.text),
            child: Container(
              width: 44, height: 44,
              decoration: const BoxDecoration(
                gradient: LinearGradient(colors: [Color(0xFFA855F7), Color(0xFF6366F1)]),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatMsg {
  const _ChatMsg({required this.text, required this.fromDisha});
  final String text;
  final bool fromDisha;
}
