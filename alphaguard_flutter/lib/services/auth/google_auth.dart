import 'package:google_sign_in/google_sign_in.dart';

import '../../core/config/env.dart';

/// Obtains a Google authorization `serverAuthCode` to hand to the backend
/// (`POST /auth/google { code }`). The backend exchanges it for tokens and
/// verifies the identity server-side — the client never asserts identity, which
/// matches the existing web flow.
class GoogleAuth {
  GoogleAuth()
      : _google = GoogleSignIn(
          scopes: const ['email', 'profile'],
          serverClientId: Env.googleServerClientId.isEmpty ? null : Env.googleServerClientId,
        );

  final GoogleSignIn _google;

  /// Returns the server auth code, or null if the user cancelled.
  Future<String?> getServerAuthCode() async {
    final account = await _google.signIn();
    if (account == null) return null; // cancelled
    return account.serverAuthCode;
  }

  Future<void> signOut() => _google.signOut();
}
