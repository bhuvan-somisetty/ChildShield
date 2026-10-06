import 'dart:math';

import '../../data/models/ai_message.dart';
import 'assistant_engine.dart';

/// Child-facing DISHA — a warm, encouraging study buddy. Every reply is
/// age-appropriate, positive, and never collects personal info. Ported from the
/// web `child/dishaChild.js`; a child-safe backend LLM replaces [reply] later.
class ChildAssistantEngine implements AssistantEngine {
  const ChildAssistantEngine();

  static const _careers = [
    'a scientist 🔬',
    'an engineer 🛠️',
    'a doctor 🩺',
    'an astronaut 🚀',
    'an artist 🎨',
    'a game designer 🎮',
    'a teacher 📚',
  ];

  @override
  String greeting(AssistantContext ctx) {
    final name = ctx.childName ?? 'friend';
    return "Hi $name! I'm DISHA, your study buddy. I can help with homework, "
        "cheer you on, or chat about your dreams. What's up? ✨";
  }

  @override
  List<QuickPrompt> quickPrompts(AssistantContext ctx) => const [
        QuickPrompt('Help me study', 'Can you help me study?'),
        QuickPrompt('Motivate me', 'I need some motivation'),
        QuickPrompt('Career ideas', 'What career could I have?'),
        QuickPrompt('Tell a joke', 'Tell me a joke'),
      ];

  @override
  Stream<AssistantReply> reply(String prompt, AssistantContext ctx, {List<AiMessage> history = const []}) {
    return simulateStream(_respond(prompt, ctx), think: const Duration(milliseconds: 750));
  }

  AssistantReply _respond(String raw, AssistantContext ctx) {
    final q = raw.toLowerCase();
    bool has(List<String> w) => w.any(q.contains);
    final name = ctx.childName ?? 'friend';
    final grade = ctx.grade ?? 'your grade';
    final school = ctx.school ?? 'school';
    final remaining = ctx.goalsRemaining;
    final nextGoal = ctx.nextGoalTitle;

    if (has(['study', 'homework', 'help', 'math', 'science', 'english', 'learn'])) {
      return AssistantReply("Sure, $name! For $grade, try this: break the work into small 15-minute chunks, "
          "do the hardest subject first, then take a short break. "
          "${nextGoal != null ? "You still have “$nextGoal” on your goals — want to start there?" : 'Which subject should we begin with?'}");
    }
    if (has(['motivat', 'tired', 'bored', 'sad', 'give up', 'hard', 'cant', "can't"])) {
      return AssistantReply("You've got this, $name! 🌟 Every expert was once a beginner. "
          "Finish just one small thing right now and you'll feel proud. I believe in you!");
    }
    if (has(['career', 'job', 'become', 'future', 'grow up', 'dream'])) {
      final c = _careers[Random().nextInt(_careers.length)];
      return AssistantReply("That's exciting to think about! With curiosity like yours, you could be $c. "
          "Keep doing well at $school and explore what you love — your future is wide open!");
    }
    if (has(['joke', 'funny', 'laugh'])) {
      return const AssistantReply('Why did the math book look sad? Because it had too many problems! 😄 Want another one?');
    }
    if (has(['goal', 'todo', 'task'])) {
      return AssistantReply(remaining > 0
          ? "You have $remaining goal${remaining == 1 ? '' : 's'} left today${nextGoal != null ? ". Next up: “$nextGoal”" : ''}. Let's knock it out! 💪"
          : "Amazing — all your goals are done, $name! 🎉 Time for a well-earned break.",);
    }
    if (has(['hi', 'hello', 'hey', 'thanks', 'thank you'])) {
      return AssistantReply("Hey $name! Always happy to help. Ask me anything about school or just chat. 😊");
    }
    return AssistantReply("I'm here for you, $name! I can help you study, cheer you on, "
        "or talk about cool careers. What would you like to do?");
  }
}
