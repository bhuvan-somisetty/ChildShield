import '../../data/models/ai_message.dart';
import 'assistant_engine.dart';

/// Parent-facing DISHA — a calm safety co-pilot. Intent-matched, English-first,
/// context-aware over the live family snapshot. Ported from the web
/// ConversationEngine (`voice/conversation.js`); a backend LLM replaces [reply]'s
/// body later while keeping this exact interface.
class ParentAssistantEngine implements AssistantEngine {
  const ParentAssistantEngine();

  @override
  String greeting(AssistantContext ctx) {
    final name = ctx.userName ?? 'there';
    return "Hello $name. I'm DISHA, your family safety co-pilot. Ask me about "
        "${ctx.childName ?? 'your child'}'s safety, tasks, approvals, or how they're doing.";
  }

  @override
  List<QuickPrompt> quickPrompts(AssistantContext ctx) {
    final c = ctx.childName ?? 'my child';
    return [
      QuickPrompt('Where are they?', 'Where is $c right now?'),
      const QuickPrompt('Pending approvals', 'Do I have any app requests to approve?'),
      QuickPrompt('How are they doing?', "How is $c doing with their tasks?"),
      const QuickPrompt('Safety tips', 'Give me a screen-time safety tip'),
    ];
  }

  @override
  Stream<AssistantReply> reply(String prompt, AssistantContext ctx, {List<AiMessage> history = const []}) {
    return simulateStream(_respond(prompt, ctx));
  }

  AssistantReply _respond(String raw, AssistantContext ctx) {
    final q = raw.toLowerCase();
    bool has(List<String> w) => w.any(q.contains);
    final child = ctx.childName ?? 'your child';
    final name = ctx.userName ?? 'there';

    if (has(['where', 'location', 'radar', 'find'])) {
      return AssistantReply(
        "You can see $child's live position on Family Radar — it shows their current area and whether they're inside a safe zone.",
        action: const AiAction(type: 'navigate', to: '/radar', label: 'Open Family Radar'),
      );
    }
    if (has(['battery', 'charge', 'power'])) {
      return AssistantReply("$child's battery level updates in real time on the dashboard. If it's running low I'll surface a heads-up there.");
    }
    if (has(['screen time', 'screen', 'usage', 'how much time'])) {
      return const AssistantReply("Screen-time totals and limits live in the Insights tab. A healthy approach: agree on a daily limit together and keep an hour screen-free before bed.");
    }
    if (has(['safe zone', 'arrived', 'left school', 'at school'])) {
      return AssistantReply("Safe Zones let you draw places like home or school. You'll get an alert the moment $child arrives or leaves one.");
    }
    if (has(['security', 'vpn', 'alert', 'warning', 'detection'])) {
      return const AssistantReply("I watch for risky apps, VPNs and unsafe sites. Any detection shows up under Security Alerts so you can review and act on it.");
    }
    if (has(['request', 'install', 'approve', 'approval'])) {
      final n = ctx.pendingApprovals;
      return AssistantReply(n > 0
          ? "You have $n app request${n == 1 ? '' : 's'} waiting. Open Approvals to allow or decline each one."
          : "There are no app requests waiting right now — you're all caught up.",);
    }
    if (has(['task', 'doing', 'progress', 'homework', 'chore'])) {
      return AssistantReply(ctx.goalsRemaining > 0
          ? "$child has ${ctx.goalsRemaining} task${ctx.goalsRemaining == 1 ? '' : 's'} left today${ctx.nextGoalTitle != null ? ", next up is “${ctx.nextGoalTitle}”" : ''}. Encouragement goes a long way — maybe send them a quick cheer in Chat."
          : "$child is on top of their tasks today — everything assigned is done. Worth celebrating with a reward!",);
    }
    if (has(['call', 'phone', 'dial'])) {
      return AssistantReply("You can reach $child from their profile, or just drop a message in Family Chat — they'll see it instantly.");
    }
    if (has(['emergency', 'sos', 'help'])) {
      return AssistantReply("If $child triggers SOS you'll get an immediate alert with their location and battery. You can also review the Emergency center any time.");
    }
    if (has(['chat', 'message', 'text'])) {
      return AssistantReply(
        "Family Chat is the quickest way to reach $child — messages are delivered in real time with read receipts.",
        action: const AiAction(type: 'navigate', to: '/chat', label: 'Open Family Chat'),
      );
    }
    if (has(['hello', 'hi ', 'hey', 'namaste', 'thanks', 'thank you'])) {
      return AssistantReply("I'm right here, $name. Ask me about $child's safety, tasks or approvals any time.");
    }
    return AssistantReply("I can help with $child's location, screen time, safe zones, app approvals, security alerts and how their tasks are going. What would you like to know, $name?");
  }
}
