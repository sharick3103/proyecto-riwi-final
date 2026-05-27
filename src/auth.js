// ============================================================
// auth.js — Session management and role helpers
// Uses localStorage to persist the authenticated user
// ============================================================

const SESSION_KEY = 'riwiflow_session';

/**
 * Save user session to localStorage
 * @param {Object} user - { id, name, email, role }
 */
export function saveSession(user) {
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get the current session
 * @returns {Object|null} session object or null if not logged in
 */
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear the session (logout)
 */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if the current user is an admin
 * @returns {boolean}
 */
export function isAdmin() {
  const session = getSession();
  return session?.role === 'admin';
}

/**
 * Check if the current user is a coder
 * @returns {boolean}
 */
export function isCoder() {
  const session = getSession();
  return session?.role === 'coder';
}

/**
 * Check if the user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Get the initials from a user's name (for avatar fallback)
 * @param {string} name
 * @returns {string} e.g. "AR" from "Alex Rivera"
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
