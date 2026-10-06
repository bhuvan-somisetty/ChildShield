import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/models/ai_conversation.dart';
import '../data/models/ai_message.dart';
import '../data/repositories/assistant_repository.dart';
import '../services/ai/assistant_engine.dart';

/// Drives the AI Assistant for one persona ('parent' or 'child'). Owns the
/// conversation list, the active thread, streaming state and search. The UI
/// only reads from here; swapping [engine] swaps the brain with no screen edits.
class AssistantController extends ChangeNotifier {
  AssistantController({
    required AssistantEngine engine,
    required AssistantRepository repo,
    required this.persona,
    AssistantContext context = const AssistantContext(),
  })  : _engine = engine,
        _repo = repo,
        _ctx = context;

  final AssistantEngine _engine;
  final AssistantRepository _repo;
  final String persona;
  AssistantContext _ctx;

  List<AiConversation> _conversations = [];
  AiConversation? _active;
  bool _loading = true;
  bool _streaming = false;
  String _search = '';
  StreamSubscription<AssistantReply>? _sub;

  // ── public read surface ──
  bool get loading => _loading;
  bool get streaming => _streaming;
  String get search => _search;
  AiConversation? get active => _active;
  List<AiMessage> get messages => _active?.messages ?? const [];
  List<QuickPrompt> get quickPrompts => _engine.quickPrompts(_ctx);

  /// History filtered by the current search query (most-recent first).
  List<AiConversation> get conversations =>
      _search.trim().isEmpty ? _conversations : _conversations.where((c) => c.matches(_search)).toList();

  /// Refresh the live context (e.g. once children/approvals load). Cheap; only
  /// notifies so quick-prompts/greeting re-render.
  void updateContext(AssistantContext ctx) {
    _ctx = ctx;
    notifyListeners();
  }

  Future<void> init() async {
    _conversations = await _repo.load(persona);
    _active = _conversations.isNotEmpty ? _conversations.first : _startConversation();
    _loading = false;
    notifyListeners();
  }

  void setSearch(String q) {
    _search = q;
    notifyListeners();
  }

  /// Open an existing thread from history.
  void open(AiConversation c) {
    if (_streaming) return;
    _active = c;
    _search = '';
    notifyListeners();
  }

  /// Begin a fresh thread (kept in memory until the first message is sent, so
  /// we don't litter history with empty conversations).
  void newConversation() {
    if (_streaming) return;
    _active = _startConversation();
    _search = '';
    notifyListeners();
  }

  Future<void> deleteConversation(AiConversation c) async {
    _conversations.removeWhere((x) => x.id == c.id);
    if (_active?.id == c.id) {
      _active = _conversations.isNotEmpty ? _conversations.first : _startConversation();
    }
    await _persist();
    notifyListeners();
  }

  Future<void> clearAll() async {
    _sub?.cancel();
    _streaming = false;
    _conversations = [];
    _active = _startConversation();
    await _repo.clear(persona);
    notifyListeners();
  }

  /// Send a user prompt and stream the assistant's reply into the active thread.
  Future<void> send(String raw) async {
    final text = raw.trim();
    if (text.isEmpty || _streaming) return;

    final convo = _active ??= _startConversation();
    final now = DateTime.now().millisecondsSinceEpoch;

    // Append the user turn; title the thread from the first thing they say.
    convo.messages = [...convo.messages, AiMessage(id: 'u$now', role: 'user', text: text, at: now)];
    if (convo.title == _newTitle) convo.title = _deriveTitle(text);
    convo.updatedAt = now;
    _promote(convo);

    // Streaming assistant placeholder.
    final assistantId = 'a${now + 1}';
    convo.messages = [...convo.messages, AiMessage(id: assistantId, role: 'assistant', text: '', at: now + 1, streaming: true)];
    _streaming = true;
    notifyListeners();

    final completer = Completer<void>();
    _sub = _engine.reply(text, _ctx, history: convo.messages).listen(
      (chunk) {
        final i = convo.messages.indexWhere((m) => m.id == assistantId);
        if (i == -1) return;
        convo.messages = [...convo.messages]
          ..[i] = convo.messages[i].copyWith(text: chunk.text, action: chunk.action);
        notifyListeners();
      },
      onError: (_) => _finishStream(convo, assistantId, completer),
      onDone: () => _finishStream(convo, assistantId, completer),
      cancelOnError: true,
    );
    return completer.future;
  }

  /// Abort an in-flight reply (e.g. user navigates away or taps stop).
  void stop() {
    if (!_streaming || _active == null) return;
    final convo = _active!;
    final i = convo.messages.indexWhere((m) => m.streaming);
    if (i != -1) {
      convo.messages = [...convo.messages]..[i] = convo.messages[i].copyWith(streaming: false);
    }
    _sub?.cancel();
    _streaming = false;
    _persist();
    notifyListeners();
  }

  // ── internals ──
  static const _newTitle = 'New conversation';

  AiConversation _startConversation() {
    final now = DateTime.now().millisecondsSinceEpoch;
    return AiConversation(id: 'c$now', persona: persona, title: _newTitle, messages: [], createdAt: now, updatedAt: now);
  }

  String _deriveTitle(String first) {
    final t = first.trim().replaceAll('\n', ' ');
    return t.length <= 38 ? t : '${t.substring(0, 38)}…';
  }

  /// Ensure [convo] is in the list and at the top (most-recent first).
  void _promote(AiConversation convo) {
    _conversations.removeWhere((x) => x.id == convo.id);
    _conversations.insert(0, convo);
  }

  void _finishStream(AiConversation convo, String assistantId, Completer<void> completer) {
    final i = convo.messages.indexWhere((m) => m.id == assistantId);
    if (i != -1 && convo.messages[i].streaming) {
      convo.messages = [...convo.messages]..[i] = convo.messages[i].copyWith(streaming: false);
    }
    convo.updatedAt = DateTime.now().millisecondsSinceEpoch;
    _streaming = false;
    _persist();
    notifyListeners();
    if (!completer.isCompleted) completer.complete();
  }

  Future<void> _persist() => _repo.saveAll(persona, _conversations);

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
