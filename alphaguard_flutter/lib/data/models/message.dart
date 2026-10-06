/// Parent ↔ child chat message (from /chat/:pairingId/messages and the
/// `chat:message` socket event). `status` advances sent → delivered → read.
class Message {
  const Message({
    required this.id,
    required this.from,
    required this.text,
    required this.at,
    this.status = 'sent',
  });

  final String id;
  final String from; // 'parent' | 'child'
  final String text;
  final int at; // epoch ms
  final String status;

  Message copyWith({String? status}) => Message(id: id, from: from, text: text, at: at, status: status ?? this.status);

  factory Message.fromJson(Map<String, dynamic> j) => Message(
        id: j['id'].toString(),
        from: (j['from'] ?? 'parent') as String,
        text: (j['text'] ?? '') as String,
        at: (j['at'] is num) ? (j['at'] as num).toInt() : 0,
        status: (j['status'] ?? 'sent') as String,
      );
}
