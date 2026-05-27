// ============================================================
// toast.js — Lightweight toast notification system
// ============================================================

const TOAST_DURATION = 3000;

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-[#1a6e45] text-white',
    error: 'bg-error text-on-error',
    info: 'bg-inverse-surface text-inverse-on-surface',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-body-sm font-body-sm ${colors[type]}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1">${icons[type]}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, TOAST_DURATION);
}
