// ============================================================
// taskCard.js — Renders a single Kanban task card
// Simple, basic design with drag cursor indicator
// ============================================================

import { isAdmin, getSession } from '../auth.js';

const STATUS_BADGE = {
  'pending':     'bg-purple-100 text-purple-700',
  'todo':        'bg-purple-100 text-purple-700',
  'in progress': 'bg-blue-100 text-blue-700',
  'in review':   'bg-yellow-100 text-yellow-700',
  'done':        'bg-green-100 text-green-700',
};

/**
 * Generate the HTML for a task card
 * @param {Object} task
 * @param {Object} assignedUser
 * @returns {string} HTML string
 */
export function createTaskCardHTML(task, assignedUser) {
  const session = getSession();
  const admin = isAdmin();
  const isOwner = session && task.userId === session.id;
  const canEdit = admin || isOwner;
  const isDone = task.status === 'done';
  const isInProgress = task.status === 'in progress';

  const userInitials = assignedUser
    ? assignedUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const statusLabel = task.status === 'pending' ? 'Pending' : capitalizeFirst(task.status);

  const leftBorder = isInProgress ? 'border-l-4 border-l-blue-500' : '';
  const cardOpacity = isDone ? 'opacity-70' : '';
  const titleStyle = isDone ? 'line-through text-gray-400' : 'text-gray-800';

  const editButton = canEdit
    ? `<button
        class="edit-task-btn text-gray-400 hover:text-purple-600"
        data-task-id="${task.id}"
        title="Edit task">
        <span class="material-symbols-outlined" style="font-size:18px">edit</span>
      </button>`
    : '';

  const deleteButton = admin
    ? `<button
        class="delete-task-btn text-gray-400 hover:text-red-500"
        data-task-id="${task.id}"
        title="Delete task">
        <span class="material-symbols-outlined" style="font-size:18px">delete</span>
      </button>`
    : '';

  return `
    <div
      class="task-card ${leftBorder} ${cardOpacity} bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab"
      data-task-id="${task.id}"
      style="user-select:none;"
    >
      <!-- Status badge -->
      <div class="mb-2">
        <span class="${STATUS_BADGE[task.status] || STATUS_BADGE['pending']} text-xs font-semibold px-2 py-0.5 rounded-full">
          ${statusLabel}
        </span>
      </div>

      <!-- Title -->
      <p class="text-sm font-semibold mb-1 ${titleStyle}">
        ${escapeHtml(task.title)}
      </p>

      <!-- Description -->
      <p class="text-xs text-gray-500 line-clamp-2 mb-3">
        ${escapeHtml(task.description)}
      </p>

      <!-- Footer: user + actions -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
          <div class="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold border border-purple-200">
            ${userInitials}
          </div>
          <span class="text-xs text-gray-400 truncate max-w-[80px]">
            ${assignedUser ? escapeHtml(assignedUser.name) : 'Unassigned'}
          </span>
        </div>
        <div class="flex items-center gap-1">
          ${editButton}
          ${deleteButton}
        </div>
      </div>
    </div>
  `;
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
