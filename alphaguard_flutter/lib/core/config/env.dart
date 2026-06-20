/// Environment configuration. Override at build/run time with:
///   flutter run   --dart-define=AG_API=https://alphaguard-backend-v2.onrender.com
///   flutter build apk --dart-define=AG_API=https://alphaguard-backend-v2.onrender.com
class Env {
  /// Backend base URL (no trailing slash).
  /// Defaults to the deployed Render service used by alphaguard-v2.vercel.app.
  /// Override with --dart-define=AG_API=<url> for staging or local dev.
  static const String apiBase = String.fromEnvironment(
    'AG_API',
    defaultValue: 'https://alphaguard-backend-v2.onrender.com',
  );

  /// REST prefix, per the API documentation.
  static String get restBase => '$apiBase/api';

  /// Optional Google OAuth server client ID (web client ID from Google Console).
  /// Required for Google Sign-In to exchange the serverAuthCode with the backend.
  /// Set via --dart-define=AG_GOOGLE_CLIENT_ID=<id> or native google-services.json.
  static const String googleServerClientId = String.fromEnvironment(
    'AG_GOOGLE_CLIENT_ID',
    defaultValue: '',
  );

  /// App version reported to the backend update endpoint. Keep in sync with
  /// pubspec `version:`. The backend compares this to its current/minimum.
  static const String appVersion = '2.1.0';
}
