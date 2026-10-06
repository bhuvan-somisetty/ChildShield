/// Normalised API error. The backend returns non-2xx with `{ "error": "..." }`;
/// we surface that message plus the status so callers can branch (401 → re-auth,
/// 403 → permission, 429 → rate-limited, etc.).
class ApiException implements Exception {
  ApiException(this.statusCode, this.message);

  final int statusCode;
  final String message;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isRateLimited => statusCode == 429;
  bool get isNetwork => statusCode == 0;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
