// Platform administrators are designated by email via the AG_ADMIN_EMAILS env
// var (comma-separated). Admin status is therefore server-controlled and cannot
// be asserted by a client. Used by the support routes (requireAdmin) and the
// Socket.IO layer (joining the shared `admin` room).
// Read the allowlist lazily (per call) rather than caching at module load, so the
// value reflects the environment whenever it's evaluated. Cheap, and avoids
// import-order surprises (e.g. tests that set AG_ADMIN_EMAILS before a request).
const adminList = () => String(process.env.AG_ADMIN_EMAILS || '')
  .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

export const isAdminEmail = (email) => !!email && adminList().includes(String(email).toLowerCase());
export const adminRoom = () => 'admin';
