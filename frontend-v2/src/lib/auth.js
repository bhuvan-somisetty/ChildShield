// Session teardown. A real logout must clear the persisted token (so the route
// guards re-block the dashboards) AND drop the realtime sockets + cached pairing
// state — otherwise "Sign Out" only changes the URL while the user stays logged
// in. Callers navigate to /welcome afterwards.
import { setToken, disconnectRealtime } from './agClient';
import { closeSession } from './session';

const AUTH_KEYS = ['ag_api_token', 'ag_child_token', 'ag_pairing', 'ag_connected', 'ag_parent_creds'];

export function logout() {
  setToken(''); // clears ag_api_token via agClient
  AUTH_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
  try { disconnectRealtime(); } catch { /* ignore */ }
  try { closeSession('parent'); closeSession('child'); } catch { /* ignore */ }
}
