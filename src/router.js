// ============================================================
// router.js — Hash-based SPA Router
// Listens to hashchange events and renders the correct view
// Routes: #/login  →  loginView
//         #/board  →  boardView
// ============================================================

import { isAuthenticated } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderBoard } from './views/board.js';

const app = document.getElementById('app');

/** Map of route hashes to render functions */
const routes = {
  '#/login': renderLogin,
  '#/board': renderBoard,
};

/**
 * Navigate to a route programmatically
 * @param {string} hash - e.g. '#/login' or '#/board'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Resolve the current route and render the correct view
 */
function resolveRoute() {
  const hash = window.location.hash || '#/login';
  const authenticated = isAuthenticated();

  // Redirect unauthenticated users to login
  if (hash !== '#/login' && !authenticated) {
    navigate('#/login');
    return;
  }

  // Redirect authenticated users away from login
  if (hash === '#/login' && authenticated) {
    navigate('#/board');
    return;
  }

  const renderFn = routes[hash];
  if (renderFn) {
    renderFn(app);
  } else {
    // Fallback: redirect to appropriate default
    navigate(authenticated ? '#/board' : '#/login');
  }
}

/**
 * Initialize the router — call once on app startup
 */
export function initRouter() {
  window.addEventListener('hashchange', resolveRoute);
  resolveRoute(); // resolve on first load
}
