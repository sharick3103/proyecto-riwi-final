// ============================================================
// taskModal.js — Create / Edit task modal
// Respects role-based permissions (admin vs coder)
// ============================================================

import { isAdmin, getSession } from '../auth.js';
import { createTask, updateTask, getUsers } from '../api.js';
import { showToast } from './toast.js';

const STATUSES = ['pending', 'in progress', 'in review', 'done'];

/**
 * Open the task modal for creating a new task (admin only)
 * @param {Function} onSuccess - callback after successful save
 */
export async function openCreateModal(onSuccess) {
  if (!isAdmin()) {
    showToast('Only admins can create tasks.', 'error');
    return;
  }
  const users = await getUsers();
  renderModal({ mode: 'create', task: null, users, onSuccess });
}

/**
 * Open the task modal for editing an existing task
 * @param {Object} task - the task to edit
 * @param {Function} onSuccess - callback after successful save
 */
export async function openEditModal(task, onSuccess) {
  const session = getSession();
  const admin = isAdmin();
  const isOwner = session && task.userId === session.id;

  if (!admin && !isOwner) {
    showToast('You can only edit tasks assigned to you.', 'error');
    return;
  }

  const users = await getUsers();
  renderModal({ mode: 'edit', task, users, onSuccess });
}

/**
 * Render and mount the modal into the DOM
 */
function renderModal({ mode, task, users, onSuccess }) {
  // Remove existing modal if any
  closeModal();

  const admin = isAdmin();
  const isCreate = mode === 'create';
  const title = isCreate ? 'New Task' : 'Edit Task';

  // Build user select options
  const userOptions = users
    .map(u => `<option value="${u.id}" ${task && task.userId === u.id ? 'selected' : ''}>${u.name} (${u.role})</option>`)
    .join('');

  // Build status options — 'pending' tasks show as selected when editing
  const statusOptions = STATUSES
    .map(s => {
      const isSelected = task
        ? (task.status === s || (task.status === 'todo' && s === 'pending'))
        : (s === 'pending' && isCreate);
      return `<option value="${s}" ${isSelected ? 'selected' : ''}>${formatStatus(s)}</option>`;
    })
    .join('');

  const overlay = document.createElement('div');
  overlay.id = 'task-modal-overlay';
  overlay.className = 'modal-overlay fixed inset-0 z-50 bg-inverse-surface/40 flex items-center justify-center px-gutter';

  overlay.innerHTML = `
    <div class="modal-panel bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl w-full max-w-[480px] p-xl space-y-lg">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="font-headline-md text-headline-md text-on-surface">${title}</h2>
        <button id="modal-close-btn" class="material-symbols-outlined text-outline hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container-low">
          close
        </button>
      </div>

      <!-- Form -->
      <form id="task-form" class="space-y-lg">
        <!-- Title -->
        <div class="space-y-sm">
          <label class="font-label-md text-label-md text-on-surface" for="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            placeholder="Task title..."
            value="${task ? escapeHtml(task.title) : ''}"
            ${!admin ? 'readonly' : ''}
            class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline ${!admin ? 'bg-surface-container-low cursor-not-allowed opacity-70' : ''}"
            required />
          ${!admin ? '<p class="font-body-sm text-body-sm text-outline">Only admins can edit the title.</p>' : ''}
        </div>

        <!-- Description -->
        <div class="space-y-sm">
          <label class="font-label-md text-label-md text-on-surface" for="task-description">Description</label>
          <textarea
            id="task-description"
            placeholder="Task description..."
            rows="3"
            class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all placeholder:text-outline resize-none"
            >${task ? escapeHtml(task.description) : ''}</textarea>
        </div>

        <!-- Status -->
        <div class="space-y-sm">
          <label class="font-label-md text-label-md text-on-surface" for="task-status">Status</label>
          <select
            id="task-status"
            class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all">
            ${statusOptions}
          </select>
        </div>

        <!-- Assigned User (admin only) -->
        ${admin ? `
        <div class="space-y-sm">
          <label class="font-label-md text-label-md text-on-surface" for="task-user">Assigned to</label>
          <select
            id="task-user"
            class="w-full px-md py-md bg-white border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface input-focus-ring transition-all">
            ${userOptions}
          </select>
        </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex gap-md pt-sm">
          <button
            type="button"
            id="modal-cancel-btn"
            class="flex-1 py-md border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            id="modal-save-btn"
            class="flex-1 bg-primary hover:opacity-90 text-on-primary py-md rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm transition-all active:scale-[0.98]">
            <span id="modal-save-text">${isCreate ? 'Create Task' : 'Save Changes'}</span>
            <span id="modal-save-spinner" class="hidden w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

  // Close on Escape key
  document.addEventListener('keydown', handleEscKey);

  // Form submit
  document.getElementById('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit({ mode, task, onSuccess });
  });
}

/** Handle form submission */
async function handleFormSubmit({ mode, task, onSuccess }) {
  const admin = isAdmin();
  const session = getSession();

  const title = document.getElementById('task-title')?.value?.trim();
  const description = document.getElementById('task-description')?.value?.trim() || '';
  const status = document.getElementById('task-status')?.value;
  const userId = admin
    ? parseInt(document.getElementById('task-user')?.value)
    : task?.userId ?? session?.id;

  const saveBtn = document.getElementById('modal-save-btn');
  const saveText = document.getElementById('modal-save-text');
  const saveSpinner = document.getElementById('modal-save-spinner');

  // Loading state
  saveBtn.disabled = true;
  saveText.textContent = 'Saving...';
  saveSpinner.classList.remove('hidden');

  try {
    if (mode === 'create') {
      await createTask({ title, description, status: 'pending', userId });
      showToast('Task created successfully!', 'success');
    } else {
      const updates = { description, status };
      if (admin) {
        updates.title = title;
        updates.userId = userId;
      }
      await updateTask(task.id, updates);
      showToast('Task updated successfully!', 'success');
    }

    closeModal();
    if (onSuccess) onSuccess();
  } catch (err) {
    showToast('Failed to save task. Please try again.', 'error');
    console.error('Save task error:', err);
    saveBtn.disabled = false;
    saveText.textContent = mode === 'create' ? 'Create Task' : 'Save Changes';
    saveSpinner.classList.add('hidden');
  }
}

/** Close and remove the modal from DOM */
export function closeModal() {
  const overlay = document.getElementById('task-modal-overlay');
  if (overlay) overlay.remove();
  document.removeEventListener('keydown', handleEscKey);
}

/** Handle Escape key to close modal */
function handleEscKey(e) {
  if (e.key === 'Escape') closeModal();
}

/** Format status for display */
function formatStatus(status) {
  const map = {
    'pending': 'Pending',
    'todo': 'To Do',
    'in progress': 'In Progress',
    'in review': 'In Review',
    'done': 'Done',
  };
  return map[status] || status;
}

/** Escape HTML to prevent XSS */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
