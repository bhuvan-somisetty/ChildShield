import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/ai_conversation.dart';

/// On-device persistence for assistant conversations. Stored per-persona under
/// one SharedPreferences key (mirrors the web `ag_voice_history` localStorage
/// approach), so a child's DISHA threads and a parent's stay separate and
/// survive restarts. A backend sync layer can later replace these reads/writes
/// behind the same method surface.
class AssistantRepository {
  AssistantRepository();

  static const _prefix = 'ag_ai_convos_v1_'; // + persona

  String _key(String persona) => '$_prefix$persona';

  Future<List<AiConversation>> load(String persona) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key(persona));
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List;
      final convos = list
          .map((e) => AiConversation.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      // Most-recent first.
      convos.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
      return convos;
    } catch (_) {
      return [];
    }
  }

  Future<void> saveAll(String persona, List<AiConversation> convos) async {
    final prefs = await SharedPreferences.getInstance();
    // Cap history so storage can't grow unbounded on long-lived installs.
    final capped = convos.take(50).toList();
    await prefs.setString(_key(persona), jsonEncode(capped.map((c) => c.toJson()).toList()));
  }

  Future<void> clear(String persona) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key(persona));
  }
}
