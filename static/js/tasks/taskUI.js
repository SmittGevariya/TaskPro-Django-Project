
import { fetchTasksApi, fetchTaskApi, createTaskApi, updateTaskApi, deleteTaskApi, completeTaskApi } from './taskService.js';
import { showToast } from '../ui/toast.js';
import { modalState, getModalElements, openTaskModal, closeTaskModal, openConfirmModal, closeConfirmModal } from '../ui/modal.js';

let allTasks = [];

export const initDashboardUI = () => {
    getModalElements();

    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) addTaskBtn.addEventListener('click', handleAddTaskClick);

    const taskList = document.getElementById('task-list');
    if (taskList) taskList.addEventListener('click', handleTaskActions);

    taskList.addEventListener('click', (e) => {
        if(e.target.classList.contains('toggle-desc')){
            const id = e.target.getAttribute('data-id');
            const desc = taskList.querySelector(`.task-desc[data-id="${id}"]`);
            if(!desc) return;

            if(desc.classList.contains('line-clamp-3')){
                desc.classList.remove('line-clamp-3');
                e.target.textContent = 'Read less';
            } else {
                desc.classList.add('line-clamp-3');
                e.target.textContent = 'Read more';
            }
        }
    });

    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) filterContainer.addEventListener('click', handleFilterClick);

    const searchInput = document.getElementById('task-search');
    if (searchInput) searchInput.addEventListener('input', filterTasks);

    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) priorityFilter.addEventListener('change', filterTasks);

    fetchTasks();
};

export const handleAddTaskClick = () => {
    const { modalForm, taskIdInput, modalCompleteButton, modalTitle } = modalState;
    if (modalForm) modalForm.reset();
    if (taskIdInput) taskIdInput.value = '';
    if (modalCompleteButton) modalCompleteButton.dataset.id = '';
    if (modalTitle) modalTitle.textContent = 'Add New Task';
    openTaskModal();
};

export const handleEditClick = async (taskId) => {
    try {
        const response = await fetchTaskApi(taskId);
        if (response.status === 401) return;
        if (!response.ok) throw new Error('Task not found');
        const task = await response.json();
        const { taskIdInput, modalCompleteButton, modalTitle } = modalState;
        if (taskIdInput) taskIdInput.value = task.id;
        if (modalCompleteButton) modalCompleteButton.dataset.id = task.id;
        document.getElementById('modal-task-title').value = task.title;
        document.getElementById('modal-task-description').value = task.description;
        document.getElementById('modal-task-due-date').value = task.due_date;
        document.getElementById('modal-task-priority').value = task.priority;
        if (modalTitle) modalTitle.textContent = 'Edit Task';
        openTaskModal();
    } catch (error) { showToast(error.message, 'error'); }
};

export const handleModalFormSubmit = async (e) => {
    e.preventDefault();
    const { modalForm } = modalState;
    if (modalForm.dataset.submitting === 'true') return;
    modalForm.dataset.submitting = 'true';
    const formData = new FormData(modalForm);
    const data = Object.fromEntries(formData.entries());
    const taskId = data.task_id;
    try {
        const response = taskId ? await updateTaskApi(taskId, data) : await createTaskApi(data);
        if (response.status === 401) return;
        if (!response.ok) { const errData = await response.json(); throw new Error(JSON.stringify(errData)); }
        closeTaskModal();
        fetchTasks();
        showToast(taskId ? 'Task updated successfully!' : 'Task created successfully!');
    } catch (error) {
        showToast('Error saving task: ' + error.message, 'error');
    } finally {
        modalForm.dataset.submitting = 'false';
    }
};

export const handleTaskActions = (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const action = target.dataset.action;
    const taskId = target.dataset.id;
    if (!action || !taskId) return;
    if (action === 'complete') markTaskComplete(taskId);
    else if (action === 'delete') {
        const { confirmDeleteBtn } = modalState;
        if (confirmDeleteBtn) confirmDeleteBtn.dataset.taskIdToDelete = taskId;
        openConfirmModal();
    } else if (action === 'edit') handleEditClick(taskId);
};

export const handleConfirmDelete = () => {
    const { confirmDeleteBtn } = modalState;
    if (!confirmDeleteBtn) return;
    const taskId = confirmDeleteBtn.dataset.taskIdToDelete;
    if (taskId) {
        deleteTask(taskId);
        closeConfirmModal();
        delete confirmDeleteBtn.dataset.taskIdToDelete;
    }
};

export const handleModalCompleteClick = () => {
    const { modalCompleteButton } = modalState;
    const taskId = modalCompleteButton?.dataset.id;
    if (taskId) {
        markTaskComplete(taskId);
        closeTaskModal();
    }
};

export const fetchTasks = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
        const response = await fetchTasksApi();
        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) throw new Error('Could not fetch tasks.');
        const responseText = await response.text();
        let tasks;
        try { tasks = JSON.parse(responseText); }
        catch { renderTasks([]); showToast('API configuration error. Please check server setup.', 'error'); return; }
        renderTasks(tasks);
    } catch (error) { console.error('Fetch tasks error:', error); }
};

export const deleteTask = async (taskId) => {
    try {
        const response = await deleteTaskApi(taskId);
        if (response.status === 401) return;
        if (!response.ok) throw new Error('Failed to delete task.');
        fetchTasks();
        showToast('Task deleted successfully.');
    } catch (error) { showToast(error.message, 'error'); }
};

export const markTaskComplete = async (taskId) => {
    try {
        const response = await completeTaskApi(taskId);
        if (response.status === 401) return;
        if (!response.ok) throw new Error('Failed to update task.');
        fetchTasks();
        showToast('Task marked as complete!');
    } catch (error) { showToast(error.message, 'error'); }
};

export const filterTasks = () => {
    const searchTerm = document.getElementById('task-search')?.value.toLowerCase() || '';
    const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
    const statusFilter = document.querySelector('[data-action="filter"].bg-blue-500')?.dataset.filter || 'all';
    let filteredTasks = [...allTasks];
    if (statusFilter === 'pending') filteredTasks = filteredTasks.filter(t => !t.is_completed);
    else if (statusFilter === 'completed') filteredTasks = filteredTasks.filter(t => t.is_completed);
    if (searchTerm) filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(searchTerm));
    if (priorityFilter !== 'all') filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
    renderTasks(filteredTasks, true);
};

export const handleFilterClick = (e) => {
    const target = e.target;
    if (target.dataset.action !== 'filter') return;
    document.querySelectorAll('[data-action="filter"]').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    target.classList.add('bg-blue-500', 'text-white');
    target.classList.remove('bg-gray-200', 'text-gray-700');
    filterTasks();
};

export const renderTasks = (tasks, isFiltered = false) => {
    const taskList = document.getElementById('task-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const searchFilterSection = document.querySelector('.flex.flex-col.sm\\:flex-row.gap-4.mb-6');
    const statusFilterSection = document.querySelector('.flex.items-center.mb-4.space-x-2');
    const tasksHeading = document.querySelector('h3.text-2xl.font-bold.text-gray-800.mb-4');
    if (!taskList) return;
    if (!isFiltered) allTasks = tasks;

    const statusFilter = document.querySelector('[data-action="filter"].bg-blue-500')?.dataset.filter || 'all';
    const hasNoTasksAtAll = allTasks.length === 0;
    if (tasks.length === 0) {
        if (hasNoTasksAtAll && !isFiltered) {
            if (addTaskBtn) addTaskBtn.classList.add('hidden');
            if (searchFilterSection) searchFilterSection.classList.add('hidden');
            if (statusFilterSection) statusFilterSection.classList.add('hidden');
            if (tasksHeading) tasksHeading.classList.add('hidden');
        } else {
            if (addTaskBtn) addTaskBtn.classList.remove('hidden');
            if (searchFilterSection) searchFilterSection.classList.remove('hidden');
            if (statusFilterSection) statusFilterSection.classList.remove('hidden');
            if (tasksHeading) tasksHeading.classList.remove('hidden');
        }
        let emptyTitle = '';
        let emptyMessage = '';
        let showAddTaskButton = false;
        if (hasNoTasksAtAll && !isFiltered) { emptyTitle = 'No tasks yet!'; emptyMessage = 'Start by adding your first task.'; showAddTaskButton = true; }
        else if (statusFilter === 'pending') { emptyTitle = 'All caught up!'; emptyMessage = 'You have no pending tasks. 🎉'; }
        else if (statusFilter === 'completed') { emptyTitle = 'No completed tasks yet.'; emptyMessage = 'Finish some tasks to see them here. 🏆'; }
        else { emptyTitle = 'No tasks found'; emptyMessage = 'Try adjusting your search or filter criteria.'; }
        taskList.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 px-6">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">${emptyTitle}</h3>
                <p class="text-gray-600 text-center max-w-md mb-6">${emptyMessage}</p>
                ${showAddTaskButton ? `
                <button id="add-first-task-btn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 hover:scale-105 font-medium">Add Task</button>
                ` : ''}
            </div>`;
        if (showAddTaskButton) {
            const addFirstTaskBtn = document.getElementById('add-first-task-btn');
            if (addFirstTaskBtn) addFirstTaskBtn.addEventListener('click', handleAddTaskClick);
        }
        return;
    }
    if (addTaskBtn) addTaskBtn.classList.remove('hidden');
    if (searchFilterSection) searchFilterSection.classList.remove('hidden');
    if (statusFilterSection) statusFilterSection.classList.remove('hidden');
    if (tasksHeading) tasksHeading.classList.remove('hidden');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const priorityColors = { 'High': 'bg-red-500 text-white', 'Medium': 'bg-yellow-500 text-white', 'Low': 'bg-green-500 text-white' };
        const priorityIcons = { 'High': '🔴', 'Medium': '🟡', 'Low': '🟢' };
        const isLongDescription = task.description && task.description.split(' ').length > 20;
        const card = `
            <div class="group bg-white rounded-xl shadow-md hover:shadow-lg p-6 transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 ${task.is_completed ? 'opacity-75 border-l-4 border-green-500' : 'border-l-4 border-gray-200'} relative overflow-hidden flex flex-col h-72">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-900 leading-tight ${task.is_completed ? 'line-through text-gray-500' : ''}">${task.title}</h3>
                    <span class="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-500 text-white'} shadow-sm">
                        <span class="text-xs">${priorityIcons[task.priority] || '⚪'}</span>
                        ${task.priority}
                    </span>
                </div>
                <div class="desc-container mb-6 min-h-[4.5rem] flex flex-col flex-grow">
                    <p class="task-desc text-gray-600 text-sm leading-relaxed line-clamp-3 ${task.is_completed ? 'line-through text-gray-400' : ''}" data-id="${task.id}">
                    ${task.description || 'No description provided'}
                    </p>
                    ${isLongDescription ? `<button class="toggle-desc text-blue-500 text-xs font-medium mt-1 hover:underline self-start" data-id="${task.id}">Read more</button>` : ''}
                </div>
                <div class="flex items-center gap-2 mb-6 text-sm text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    <span class="font-medium">Due: ${task.due_date}</span>
                </div>
                <div class="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                    ${!task.is_completed ? `
                    <button class="group/edit flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md" data-action="edit" data-id="${task.id}" title="Edit task">
                        <span class="text-sm">✏️</span><span class="hidden sm:inline">Edit</span>
                    </button>` : ''}
                    <button class="group/delete flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md" data-action="delete" data-id="${task.id}" title="Delete task">
                        <span class="text-sm">🗑️</span><span class="hidden sm:inline">Delete</span>
                    </button>
                </div>
            </div>`;
        taskList.innerHTML += card;
    });
};

