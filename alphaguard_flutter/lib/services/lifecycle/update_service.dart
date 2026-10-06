import '../../core/config/env.dart';
import '../../data/api/api_client.dart';
import '../../data/models/version_info.dart';

/// Consumes the existing backend version API (GET /app/version?version=) to
/// decide optional vs mandatory updates. No backend change — read-only.
class UpdateService {
  UpdateService(this._api);
  final ApiClient _api;

  Future<VersionInfo?> check() async {
    try {
      final r = await _api.get('/app/version', query: {'version': Env.appVersion}) as Map<String, dynamic>;
      return VersionInfo.fromJson(r);
    } catch (_) {
      // Offline / cold start → never gate the app on a failed version check.
      return null;
    }
  }
}
