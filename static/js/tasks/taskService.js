
import { API_URL, authFetch } from '../utils/api.js';

export const fetchTasksApi = () => authFetch(`${API_URL}/tasks/`, { method: 'GET' });
export const fetchTaskApi = (taskId) => authFetch(`${API_URL}/tasks/${taskId}/`);
export const createTaskApi = (data) => authFetch(`${API_URL}/tasks/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateTaskApi = (taskId, data) => authFetch(`${API_URL}/tasks/${taskId}/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteTaskApi = (taskId) => authFetch(`${API_URL}/tasks/${taskId}/`, { method: 'DELETE' });
export const completeTaskApi = (taskId) => authFetch(`${API_URL}/tasks/${taskId}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_completed: true }) });


