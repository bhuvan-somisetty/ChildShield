import '../api/api_client.dart';
import '../models/message.dart';

/// Chat history (REST). Live send/typing/read flow over Socket.IO in the
/// controller, mirroring the web client.
class ChatRepository {
  ChatRepository(this._api);
  final ApiClient _api;

  Future<List<Message>> messages(String pairingId) async {
    final r = await _api.get('/chat/$pairingId/messages') as Map<String, dynamic>;
    return (r['messages'] as List).map((e) => Message.fromJson(e as Map<String, dynamic>)).toList();
  }
}
