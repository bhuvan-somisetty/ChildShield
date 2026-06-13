// Google OAuth — authorization-code (popup) flow. The frontend opens the Google
// account-selection popup and receives a one-time `code`; this module exchanges
// that code for tokens using GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET, then
// cryptographically verifies the returned id_token before we trust any identity.
// No identity is ever accepted from the client directly.
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

export const googleEnabled = () => !!(CLIENT_ID && CLIENT_SECRET);
export const googleClientId = () => CLIENT_ID;

// 'postmessage' is the redirect_uri Google expects for popup code clients
// (google.accounts.oauth2.initCodeClient with ux_mode:'popup').
const newClient = () => new OAuth2Client(CLIENT_ID, CLIENT_SECRET, 'postmessage');

// Exchange the auth code → tokens, then verify the id_token signature + audience.
// Returns the verified Google profile, or throws on any failure.
export async function verifyGoogleCode(code) {
  if (!googleEnabled()) throw new Error('Google sign-in is not configured');
  if (!code) throw new Error('Missing authorization code');
  const client = newClient();
  const { tokens } = await client.getToken(code); // authenticated with the client secret
  if (!tokens || !tokens.id_token) throw new Error('Google did not return an identity token');
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: CLIENT_ID });
  const p = ticket.getPayload();
  if (!p || !p.sub || !p.email) throw new Error('Invalid Google identity');
  if (p.email_verified === false) throw new Error('Google email is not verified');
  return { sub: p.sub, email: String(p.email).toLowerCase(), name: p.name || 'Parent', picture: p.picture || null };
}
