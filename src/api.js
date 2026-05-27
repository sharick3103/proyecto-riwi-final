// ============================================================
// api.js — HTTP client for json-server REST API
// Base URL: http://localhost:3000
// ============================================================

const BASE_URL = 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const response = await fetch(url, config);
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

// ── Users ──────────────────────────────────────────────────

/**
 * Find a user by email and password (login)
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object|null>} user object or null
 */
export async function findUser(email, password) {
  const users = await request(`/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
  return users.length > 0 ? users[0] : null;
}

/**
 * Get all users
 * @returns {Promise<Array>}
 */
export async function getUsers() {
  return request('/users');
}

// ── Tasks ──────────────────────────────────────────────────

/**
 * Get all tasks
 * @returns {Promise<Array>}
 */
export async function getTasks() {
  return request('/tasks');
}

/**
 * Create a new task (admin only)
 * @param {Object} taskData - { title, description, status, userId }
 * @returns {Promise<Object>} created task
 */
export async function createTask(taskData) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

/**
 * Update an existing task (PATCH — partial update)
 * @param {number} id - task id
 * @param {Object} updates - fields to update
 * @returns {Promise<Object>} updated task
 */
export async function updateTask(id, updates) {
  return request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a task
 * @param {number} id
 * @returns {Promise<{}>}
 */
export async function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}
