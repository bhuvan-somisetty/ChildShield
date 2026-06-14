// Platform administrators are designated by email via the AG_ADMIN_EMAILS env
// var (comma-separated). Admin status is therefore server-controlled and cannot
// be asserted by a client. Used by the support routes (requireAdmin) and the
// Socket.IO layer (joining the shared `admin` room).
const ADMINS = String(process.env.AG_ADMIN_EMAILS || '')
  .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

export const isAdminEmail = (email) => !!email && ADMINS.includes(String(email).toLowerCase());
export const adminRoom = () => 'admin';
