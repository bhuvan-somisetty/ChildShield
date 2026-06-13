import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/agClient';

// Route guard. Blocks the parent/child app shells until the device holds a real
// backend-issued token, so the UI can no longer be reached by navigating
// directly (every server endpoint still enforces auth + role independently).
//
//   role="parent" → requires the parent JWT (set by Login/Signup) → /login
//   role="child"  → requires the child device token (set when a pairing code is
//                   claimed) → /child-setup
const hasChildToken = () => {
  try { return !!JSON.parse(localStorage.getItem('ag_child_token') || 'null'); } catch { return false; }
};

const RequireAuth = ({ role, children }) => {
  if (role === 'child') {
    if (getToken() || hasChildToken()) return children;
    return <Navigate to="/child-setup" replace />;
  }
  // parent
  if (getToken()) return children;
  return <Navigate to="/login" replace />;
};

export default RequireAuth;
