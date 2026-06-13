// Safe Zone API (parent). Posts to the backend so the zone is geofenced against
// the child's real GPS stream. Falls back silently when the backend is offline
// (the existing localStorage zones still drive the UI).
import { ensureSession, serverBase } from './session';

const api = async (method, path, body) => {
  try {
    const s = await ensureSession('parent');
    const r = await fetch(`${serverBase()}/api${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` }, body: body ? JSON.stringify(body) : undefined });
    return r.ok ? r.json() : null;
  } catch { return null; }
};

export const createZoneRemote = (z) => api('POST', '/zones', z);
export const deleteZoneRemote = (id) => api('DELETE', `/zones/${id}`);
export const listZonesRemote = () => api('GET', '/zones');
export const listZoneEventsRemote = () => api('GET', '/zone-events');

// Distance in metres between two [lat,lng] points (shared geofence math).
const toRad = (d) => (d * Math.PI) / 180;
export const distMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000, dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
