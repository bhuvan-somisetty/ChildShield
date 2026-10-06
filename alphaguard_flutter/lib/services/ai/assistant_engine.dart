import 'dart:async';
import 'dart:math';

import '../../data/models/ai_message.dart';

/// Live context the assistant can reason over. Kept deliberately small and
/// nullable so callers pass whatever they have (a backend LLM prompt would be
/// assembled from the same fields).
class AssistantContext {
  const AssistantContext({
    this.userName,
    this.childName,
    this.grade,
    this.school,
    this.pendingApprovals = 0,
    this.goalsRemaining = 0,
    this.nextGoalTitle,
  });

  final String? userName; // parent name (parent persona) — addressee
  final String? childName;
  final String? grade;
  final String? school;
  final int pendingApprovals;
  final int goalsRemaining;
  final String? nextGoalTitle;

  AssistantContext copyWith({
    String? userName,
    String? childName,
    String? grade,
    String? school,
    int? pendingApprovals,
    int? goalsRemaining,
    String? nextGoalTitle,
  }) =>
      AssistantContext(
        userName: userName ?? this.userName,
        childName: childName ?? this.childName,
        grade: grade ?? this.grade,
        school: school ?? this.school,
        pendingApprovals: pendingApprovals ?? this.pendingApprovals,
        goalsRemaining: goalsRemaining ?? this.goalsRemaining,
        nextGoalTitle: nextGoalTitle ?? this.nextGoalTitle,
      );
}

/// A fully-formed assistant turn before it is streamed to the UI.
class AssistantReply {
  const AssistantReply(this.text, {this.action});
  final String text;
  final AiAction? action;
}

/// The seam a real backend LLM slots into. The UI and controller depend only on
/// this interface, so swapping the on-device rule engine for a streaming HTTP
/// completion later is a one-line provider change — no screen edits.
///
/// [reply] streams the answer token-by-token; UIs render the partial text live
/// for a WhatsApp-quality "typing" feel. On-device engines simulate the cadence;
/// a network engine would forward real SSE chunks.
abstract class AssistantEngine {
  /// Greeting shown when a brand-new conversation opens.
  String greeting(AssistantContext ctx);

  /// Quick-prompt chips offered above the composer.
  List<QuickPrompt> quickPrompts(AssistantContext ctx);

  /// Stream the assistant's answer to [prompt]. Emits incremental
  /// [AssistantReply]s whose `text` grows until the final, complete reply.
  Stream<AssistantReply> reply(String prompt, AssistantContext ctx, {List<AiMessage> history = const []});
}

class QuickPrompt {
  const QuickPrompt(this.label, this.text);
  final String label;
  final String text;
}

/// Turns a complete [AssistantReply] into a realistic token stream: an initial
/// "thinking" pause, then word-by-word emission. Shared by the on-device
/// engines so streaming behaviour is identical across personas.
Stream<AssistantReply> simulateStream(
  AssistantReply full, {
  Duration think = const Duration(milliseconds: 650),
  Duration perWord = const Duration(milliseconds: 32),
}) async* {
  await Future<void>.delayed(think);
  final words = full.text.split(' ');
  final buf = StringBuffer();
  final rng = Random();
  for (var i = 0; i < words.length; i++) {
    buf.write(i == 0 ? words[i] : ' ${words[i]}');
    // Emit the action only on the final chunk so buttons appear when done.
    yield AssistantReply(buf.toString(), action: i == words.length - 1 ? full.action : null);
    // Jitter keeps the cadence human; punctuation gets a slightly longer beat.
    final pause = perWord.inMilliseconds + rng.nextInt(24) + (words[i].endsWith('.') || words[i].endsWith('?') ? 90 : 0);
    await Future<void>.delayed(Duration(milliseconds: pause));
  }
}
