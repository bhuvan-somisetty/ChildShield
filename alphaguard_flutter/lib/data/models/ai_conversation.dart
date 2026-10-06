import 'ai_message.dart';

/// A persisted assistant conversation (one chat thread). Conversations are
/// stored per-persona so a child's DISHA history never mixes with a parent's.
/// `title` is auto-derived from the first user message (WhatsApp-style).
class AiConversation {
  AiConversation({
    required this.id,
    required this.persona,
    required this.title,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String persona; // 'parent' | 'child'
  String title;
  List<AiMessage> messages;
  final int createdAt;
  int updatedAt;

  /// Last assistant/user line — shown as the subtitle in the history list.
  String get preview => messages.isEmpty ? 'New conversation' : messages.last.text;

  /// Only the human-visible turns (excludes nothing today, but keeps the door
  /// open for hidden system turns later).
  int get turnCount => messages.length;

  /// Whether [query] appears in the title or any message — powers search.
  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return true;
    if (title.toLowerCase().contains(q)) return true;
    return messages.any((m) => m.text.toLowerCase().contains(q));
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'persona': persona,
        'title': title,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'messages': messages.map((m) => m.toJson()).toList(),
      };

  factory AiConversation.fromJson(Map<String, dynamic> j) => AiConversation(
        id: j['id'].toString(),
        persona: (j['persona'] ?? 'parent') as String,
        title: (j['title'] ?? 'Conversation') as String,
        createdAt: (j['createdAt'] is num) ? (j['createdAt'] as num).toInt() : 0,
        updatedAt: (j['updatedAt'] is num) ? (j['updatedAt'] as num).toInt() : 0,
        messages: (j['messages'] as List? ?? [])
            .map((e) => AiMessage.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
      );
}
