/// A single turn in an AI-assistant conversation (parent VoiceAI / child DISHA).
///
/// Distinct from [Message] (parent↔child realtime chat): this is the human ↔
/// assistant transcript. `role` is 'user' | 'assistant'. While the assistant is
/// streaming a reply, [streaming] is true and [text] grows token-by-token.
class AiMessage {
  const AiMessage({
    required this.id,
    required this.role,
    required this.text,
    required this.at,
    this.streaming = false,
    this.action,
  });

  final String id;
  final String role; // 'user' | 'assistant'
  final String text;
  final int at; // epoch ms
  final bool streaming;

  /// Optional follow-up the UI can offer/execute (e.g. open Family Radar). Lets
  /// the assistant be agentic without coupling the engine to navigation.
  final AiAction? action;

  bool get isUser => role == 'user';
  bool get isAssistant => role == 'assistant';

  AiMessage copyWith({String? text, bool? streaming, AiAction? action}) => AiMessage(
        id: id,
        role: role,
        text: text ?? this.text,
        at: at,
        streaming: streaming ?? this.streaming,
        action: action ?? this.action,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'text': text,
        'at': at,
        if (action != null) 'action': action!.toJson(),
      };

  factory AiMessage.fromJson(Map<String, dynamic> j) => AiMessage(
        id: j['id'].toString(),
        role: (j['role'] ?? 'assistant') as String,
        text: (j['text'] ?? '') as String,
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
        action: j['action'] is Map ? AiAction.fromJson(Map<String, dynamic>.from(j['action'] as Map)) : null,
      );
}

/// A suggested action attached to an assistant reply. `navigate` carries an
/// in-app route; `call` carries a phone number. Mirrors the web ConversationEngine
/// `{type:'navigate', to}` / `{type:'call', phone}` contract.
class AiAction {
  const AiAction({required this.type, this.to, this.phone, this.label});

  final String type; // 'navigate' | 'call'
  final String? to;
  final String? phone;
  final String? label; // human-friendly button text

  Map<String, dynamic> toJson() => {
        'type': type,
        if (to != null) 'to': to,
        if (phone != null) 'phone': phone,
        if (label != null) 'label': label,
      };

  factory AiAction.fromJson(Map<String, dynamic> j) => AiAction(
        type: (j['type'] ?? 'navigate') as String,
        to: j['to'] as String?,
        phone: j['phone'] as String?,
        label: j['label'] as String?,
      );
}
