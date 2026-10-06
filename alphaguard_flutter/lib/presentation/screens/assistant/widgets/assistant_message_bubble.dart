import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../data/models/ai_message.dart';
import '../assistant_persona.dart';
import 'typing_dots.dart';

/// A single chat bubble. User turns sit right (accent-tinted); assistant turns
/// sit left (neutral glass). While streaming with no text yet, shows the typing
/// pulse; otherwise renders the growing text and an optional action chip.
class AssistantMessageBubble extends StatelessWidget {
  const AssistantMessageBubble({super.key, required this.message, required this.persona, this.onAction});

  final AiMessage message;
  final AssistantPersona persona;
  final void Function(AiAction action)? onAction;

  @override
  Widget build(BuildContext context) {
    final mine = message.isUser;
    final accent = persona.accent;
    final empty = message.streaming && message.text.isEmpty;

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
        decoration: BoxDecoration(
          color: mine ? accent.withValues(alpha: 0.16) : Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(mine ? 18 : 6),
            bottomRight: Radius.circular(mine ? 6 : 18),
          ),
          border: Border.all(color: mine ? accent.withValues(alpha: 0.28) : AppColors.border),
        ),
        child: empty
            ? Padding(padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2), child: TypingDots(color: accent))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(text: message.text, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14.5, height: 1.35)),
                      // Blinking caret while tokens are still arriving.
                      if (message.streaming)
                        WidgetSpan(
                          alignment: PlaceholderAlignment.middle,
                          child: Container(width: 7, height: 15, margin: const EdgeInsets.only(left: 2), color: accent.withValues(alpha: 0.8)),
                        ),
                    ]),
                  ),
                  if (message.action != null && !message.streaming && onAction != null) ...[
                    const SizedBox(height: 8),
                    _ActionChip(action: message.action!, accent: accent, onTap: () => onAction!(message.action!)),
                  ],
                ],
              ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({required this.action, required this.accent, required this.onTap});
  final AiAction action;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: accent.withValues(alpha: 0.35)),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(action.type == 'call' ? Icons.call : Icons.arrow_forward, size: 14, color: accent),
            const SizedBox(width: 6),
            Text(action.label ?? 'Open', style: TextStyle(color: accent, fontWeight: FontWeight.w800, fontSize: 12.5)),
          ]),
        ),
      ),
    );
  }
}
