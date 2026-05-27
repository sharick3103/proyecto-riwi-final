// ============================================================
// board.js — Kanban board view
// Renders the dashboard and handles all task management logic
// Drag & Drop uses only native HTML events (no functions)
// ============================================================

import { getTasks, getUsers, updateTask, deleteTask } from '../api.js';
import { getSession, clearSession, isAdmin, getInitials } from '../auth.js';
import { navigate } from '../router.js';
import { createTaskCardHTML } from '../components/taskCard.js';
import { openCreateModal, openEditModal } from '../components/taskModal.js';
import { showToast } from '../components/toast.js';

/** Column config: status key → display label */
const COLUMNS = [
  { key: 'todo', label: 'To Do', badgeClass: 'bg-surface-container-high text-on-surface-variant' },
  { key: 'in progress', label: 'In Progress', badgeClass: 'bg-primary-container text-on-primary' },
  { key: 'in review', label: 'In Review', badgeClass: 'bg-surface-container-high text-on-surface-variant' },
  { key: 'done', label: 'Done', badgeClass: 'bg-surface-container-high text-on-surface-variant' },
];

/**
 * Maps a task status to the column key it belongs to.
 * 'pending' is treated as 'todo'
 */
function resolveColumnKey(status) {
  if (status === 'pending') return 'todo';
  return status;
}

/** App state */
let allTasks = [];
let allUsers = [];

// Track which task is being dragged
let draggedTaskId = null;

/**
 * Render the board view into the app mount point
 */
export async function renderBoard(container) {
  const session = getSession();
  container.innerHTML = getBoardHTML(session);
  attachBoardListeners();
  await loadBoardData();
}

/** Load tasks + users from API then render cards */
async function loadBoardData() {
  try {
    setColumnsLoading(true);
    [allTasks, allUsers] = await Promise.all([getTasks(), getUsers()]);
    renderColumns(allTasks, allUsers);
  } catch (err) {
    showToast('Cannot reach json-server. Make sure it is running on port 3000.', 'error');
    console.error('Board load error:', err);
  } finally {
    setColumnsLoading(false);
  }
}

/** Render all four Kanban columns with task cards */
function renderColumns(tasks, users) {
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u; });

  const searchInput = document.getElementById('search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

  COLUMNS.forEach(col => {
    const colId = col.key.replaceAll(' ', '-');
    const container = document.getElementById(`column-${colId}`);
    const counter = document.getElementById(`counter-${colId}`);
    if (!container) return;

    let colTasks = tasks.filter(t => resolveColumnKey(t.status) === col.key);

    if (query) {
      colTasks = colTasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    if (counter) counter.textContent = colTasks.length;

    if (colTasks.length === 0) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-on-surface-variant opacity-60">
          <span class="material-symbols-outlined text-[32px] mb-2">inbox</span>
          <p class="font-body-sm text-body-sm">No tasks here</p>
        </div>
      `;
    } else {
      container.innerHTML = colTasks
        .map(task => createTaskCardHTML(task, userMap[task.userId]))
        .join('');
    }

    // ── DRAG & DROP on each column (drop zone) ──────────────
    container.ondragover = (e) => {
      e.preventDefault();
      container.style.outline = '2px dashed #7331df';
      container.style.outlineOffset = '4px';
    };

    container.ondragleave = () => {
      container.style.outline = '';
      container.style.outlineOffset = '';
    };

    container.ondrop = async (e) => {
      e.preventDefault();
      container.style.outline = '';
      container.style.outlineOffset = '';

      if (draggedTaskId === null) return;

      const newStatus = col.key;
      const task = allTasks.find(t => t.id === draggedTaskId);
      if (!task) return;
      if (resolveColumnKey(task.status) === newStatus) return;

      try {
        await updateTask(draggedTaskId, { status: newStatus });
        showToast('Task moved!', 'success');
        await loadBoardData();
      } catch (err) {
        showToast('Failed to move task.', 'error');
        console.error('Drag drop update error:', err);
      }

      draggedTaskId = null;
    };
  });

  // Re-attach card listeners after re-render
  attachCardListeners();
}

/** Attach listeners to edit/delete buttons and drag events on task cards */
function attachCardListeners() {
  // ── Edit & Delete buttons ──────────────────────────────────
  document.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = parseInt(btn.dataset.taskId);
      const task = allTasks.find(t => t.id === taskId);
      if (task) {
        await openEditModal(task, async () => {
          await loadBoardData();
        });
      }
    });
  });

  document.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const taskId = parseInt(btn.dataset.taskId);
      if (confirm('Are you sure you want to delete this task?')) {
        try {
          await deleteTask(taskId);
          showToast('Task deleted successfully!', 'success');
          await loadBoardData();
        } catch (err) {
          showToast('Failed to delete task. Please try again.', 'error');
          console.error('Delete task error:', err);
        }
      }
    });
  });

  // ── Drag events on each task card ──────────────────────────
  document.querySelectorAll('.task-card').forEach(card => {
    card.draggable = true;

    card.ondragstart = (e) => {
      draggedTaskId = parseInt(card.dataset.taskId);
      card.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    };

    card.ondragend = () => {
      card.style.opacity = '';
      draggedTaskId = null;

      // Clear any leftover column highlights
      COLUMNS.forEach(col => {
        const colId = col.key.replaceAll(' ', '-');
        const container = document.getElementById(`column-${colId}`);
        if (container) {
          container.style.outline = '';
          container.style.outlineOffset = '';
        }
      });
    };
  });
}

/** Attach static board-level event listeners */
function attachBoardListeners() {
  const newTaskBtn = document.getElementById('new-task-btn');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', async () => {
      await openCreateModal(async () => {
        await loadBoardData();
      });
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      showToast('You have been signed out.', 'info');
      navigate('#/login');
    });
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderColumns(allTasks, allUsers);
    });
  }
}

/** Show/hide loading placeholders in columns */
function setColumnsLoading(loading) {
  COLUMNS.forEach(col => {
    const container = document.getElementById(`column-${col.key.replaceAll(' ', '-')}`);
    if (!container) return;
    if (loading) {
      container.innerHTML = `
        <div class="flex flex-col gap-md">
          ${[1, 2].map(() => `
            <div class="bg-surface border border-outline-variant rounded-xl p-md shadow-sm animate-pulse">
              <div class="h-4 bg-surface-container-high rounded-full w-1/2 mb-xs"></div>
              <div class="h-5 bg-surface-container-high rounded-full w-4/5 mb-xs"></div>
              <div class="h-3 bg-surface-container-high rounded-full w-full mb-xs"></div>
              <div class="h-3 bg-surface-container-high rounded-full w-3/4 mt-md"></div>
            </div>
          `).join('')}
        </div>
      `;
    }
  });
}

/** Returns the full board HTML */
function getBoardHTML(session) {
  const admin = isAdmin();
  const initials = getInitials(session?.name || '');

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', active: true },
    { icon: 'assignment', label: 'Projects', active: false },
    { icon: 'group', label: 'Team', active: false },
    { icon: 'bar_chart', label: 'Reports', active: false },
    { icon: 'settings', label: 'Settings', active: false },
  ];

  const navHTML = navItems.map(item => {
    if (item.active) {
      return `
        <a class="flex items-center bg-primary-fixed text-on-primary-fixed-variant rounded-lg mx-2 px-4 py-3 font-body-sm text-body-sm transition-all scale-[0.98]" href="#">
          <span class="material-symbols-outlined mr-3">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `;
    }
    return `
      <a class="flex items-center text-secondary hover:text-primary hover:bg-primary-container/10 px-4 py-3 mx-2 font-body-sm text-body-sm rounded-lg transition-all" href="#">
        <span class="material-symbols-outlined mr-3">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  const columnsHTML = COLUMNS.map(col => {
    const colId = col.key.replaceAll(' ', '-');
    return `
      <div class="kanban-column flex flex-col w-1/4 h-full">
        <div class="flex items-center justify-between mb-md">
          <div class="flex items-center gap-2">
            <h3 class="font-title-sm text-title-sm text-on-surface">${col.label}</h3>
            <span id="counter-${colId}" class="${col.badgeClass} px-2 py-0.5 rounded-full font-label-sm text-label-sm">0</span>
          </div>
          <button class="material-symbols-outlined text-outline">more_horiz</button>
        </div>
        <div id="column-${colId}" class="flex-1 space-y-md p-2 bg-surface-container-low/50 rounded-xl overflow-y-auto custom-scrollbar">
          <!-- Cards rendered by JS -->
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-background text-on-background overflow-hidden h-screen flex">
      <!-- SideNavBar -->
      <aside class="hidden md:flex flex-col pt-md pb-xl gap-xs h-full bg-surface-container-low border-r border-outline-variant w-[280px] shrink-0">
        <div class="px-gutter mb-xl">
          <h1 class="font-headline-md text-headline-md font-bold text-primary">Riwiflow</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Product Team</p>
        </div>
        <nav class="flex-1 space-y-1">
          ${navHTML}
        </nav>
        <div class="px-4 mt-auto">
          ${admin
      ? `<button
              id="new-task-btn"
              class="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
              <span class="material-symbols-outlined">add</span>
              New Project
            </button>`
      : `<button
              disabled
              class="w-full bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
              title="Only admins can create tasks">
              <span class="material-symbols-outlined">lock</span>
              New Project
            </button>`
    }
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 flex flex-col min-w-0">
        <!-- TopAppBar -->
        <header class="flex justify-between items-center h-16 px-gutter w-full bg-surface border-b border-outline-variant z-40">
          <div class="flex items-center gap-4 flex-1">
            <div class="relative max-w-md w-full">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                id="search-input"
                class="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-full font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search tasks..." type="text" />
            </div>
          </div>
          <div class="flex items-center gap-4 ml-4">
            <button class="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors">
              notifications
            </button>
            <button
              id="logout-btn"
              class="flex items-center gap-2 text-on-surface-variant hover:text-error hover:bg-surface-container-low px-3 py-2 rounded-full transition-colors font-label-md text-label-md"
              title="Sign out">
              <span class="material-symbols-outlined text-[20px]">logout</span>
              <span class="hidden sm:inline">Sign out</span>
            </button>
            <div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-[11px] font-bold border border-outline-variant select-none"
              title="${session?.name || ''}">
              ${initials}
            </div>
          </div>
        </header>

        <!-- Kanban columns area -->
        <div class="flex-1 overflow-x-auto p-gutter custom-scrollbar">
          <div class="flex gap-gutter h-full">
            ${columnsHTML}
          </div>
        </div>
      </main>
    </div>
  `;
}
