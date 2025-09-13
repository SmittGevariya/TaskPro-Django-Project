document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const logoutButton = document.getElementById('logout-button');
    const API_URL = 'http://127.0.0.1:8000/api';

    const taskModal = document.getElementById('task-modal');
    const modalForm = document.getElementById('modal-form');
    const modalTitle = document.getElementById('modal-title');
    const modalSaveButton = document.getElementById('modal-save-button');
    const modalCloseButton = document.getElementById('modal-close-button');
    const taskIdInput = document.getElementById('task-id');

    const confirmModal = document.getElementById('confirm-delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    const openModal = () => taskModal.classList.remove('hidden');
    const closeModal = () => taskModal.classList.add('hidden');
    const openConfirmModal = () => confirmModal.classList.remove('hidden');
    const closeConfirmModal = () => confirmModal.classList.add('hidden');

    const showToast = (message, type='success') => {
        const colors = {
            success : 'linear-gradient(to right, #00b09b, #96c93d)',
            error : 'linear-gradient(to right, #ff5f6d, #ffc371)',
        };

        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity : "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: colors[type] || colors.success
            },
        }).showToast();
    };

    modalCloseButton.addEventListener('click', closeModal);
    modalSaveButton.addEventListener('click', () => modalForm.requestSubmit());
    cancelDeleteBtn.addEventListener('click',closeConfirmModal);
    logoutButton.addEventListener('click', () => {
        localStorage.clear();
        logoutButton.classList.add('hidden');
        loadView('login');
    });

    const loadView = async (viewName) => {
        try {
            const response = await fetch(`/components/${viewName}/`);
            if (!response.ok) throw new Error('Template not found');
            const viewHtml = await response.text();
            appContent.innerHTML = viewHtml;
            attachEventListeners(viewName);
        } catch (error) {
            console.error('Error loading view:', error);
            appContent.innerHTML = `<p class="text-red-500 font-bold">Error: Could not load page content. Please check the browser console for more details.</p>`;
        }
    };

    const attachEventListeners = (viewName) => {
        if (viewName === 'login') {
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); loadView('register'); });
        } else if (viewName === 'register') {
            document.getElementById('register-form').addEventListener('submit', handleRegister);
            document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); loadView('login'); });
        } else if (viewName === 'dashboard') {
            // CORRECT: Listens for a CLICK on the BUTTON, not a submit on a form
            document.getElementById('add-task-btn').addEventListener('click', handleAddTaskClick);
            
            // CORRECT: Listener for the whole task list is set here, once.
            document.getElementById('task-list').addEventListener('click', handleTaskActions);
            
            // CORRECT: Listener for the modal form is also set here.
            modalForm.addEventListener('submit', handleModalFormSubmit);

            confirmDeleteBtn.addEventListener('click',handleConfirmDelete);
            
            document.getElementById('filter-container').addEventListener('click',handleFilterClick);

            const userGreeting = document.getElementById('user-greeting');
            const username = localStorage.getItem('username');
            if (username) userGreeting.textContent = username;
            
            fetchTasks();
        }
    };
    
    const handleLogin = async (e) => {
        e.preventDefault();
        const loginForm = e.target;
        const loginError = document.getElementById('login-error');
        loginError.classList.add('hidden');
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_URL}/auth/login/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.detail || 'Failed to login.'); }
            const tokens = await response.json();
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('username', data.username);
            logoutButton.classList.remove('hidden');
            loadView('dashboard');
        } catch (error) {
            showToast(error.message,'error');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const registerForm = e.target;
        const registerError = document.getElementById('register-error');
        registerError.classList.add('hidden');
        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());
        try {
            const response = await fetch(`${API_URL}/auth/register/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) { const errorData = await response.json(); const errorMessage = Object.entries(errorData).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('\n'); throw new Error(errorMessage); }
            showToast('Registration successful! Please log in.');
            loadView('login');
        } catch (error) {
            showToast(error.message,'error');
        }
    };

    const handleAddTaskClick = () => {
        modalForm.reset();
        taskIdInput.value = '';
        modalTitle.textContent = 'Add New Task';
        openModal();
    };

    const handleEditClick = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Task not found');
            const task = await response.json();
            
            taskIdInput.value = task.id;
            document.getElementById('modal-task-title').value = task.title;
            document.getElementById('modal-task-description').value = task.description;
            document.getElementById('modal-task-due-date').value = task.due_date;
            document.getElementById('modal-task-priority').value = task.priority;
            
            modalTitle.textContent = 'Edit Task';
            openModal();
        } catch(error) {
            alert(error.message);
        }
    };
    
    const handleModalFormSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const formData = new FormData(modalForm);
        const data = Object.fromEntries(formData.entries());
        const taskId = data.task_id;
        
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `${API_URL}/tasks/${taskId}/` : `${API_URL}/tasks/`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if (!response.ok) { const errData = await response.json(); throw new Error(JSON.stringify(errData)); };
            closeModal();
            fetchTasks();
            showToast(taskId ? 'Task updated successfully!' : 'Task created successfully!');
        } catch (error) {
            showToast('Error saving task: ' + error.message , 'error');
        }
    };

    const handleTaskActions = (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const action = target.dataset.action;
        const taskId = target.dataset.id;
        if (!action || !taskId) return;
        if (action === 'complete') markTaskComplete(taskId);
        else if (action === 'delete') {
            confirmDeleteBtn.dataset.taskIdToDelete = taskId;
            openConfirmModal();
        }
        else if (action === 'edit') handleEditClick(taskId);
    };

    const handleConfirmDelete = () => {
        const taskId = confirmDeleteBtn.dataset.taskIdToDelete;
        if(taskId){
            deleteTask(taskId);
            closeConfirmModal();
            delete confirmDeleteBtn.dataset.taskIdToDelete;
        }
    }

    const markTaskComplete = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_completed: true })
            });
            if (!response.ok) throw new Error('Failed to update task.');
            fetchTasks();
            showToast('Task marked as complete!')
        } catch (error) {
            showToast(error.message,'error');
        }
    };

    const deleteTask = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to delete task.');
            fetchTasks();
            showToast('Task deleted successfully.');
        } catch (error) {
            showToast(error.message,'error')
        }
    };

    const handleFilterClick = (e) => {
        const target = e.target;
        if(target.dataset.action !== 'filter') return;

        const filterType = target.dataset.filter;
        let queryParams = '';

        if (filterType === 'pending'){
            queryParams = '?is_completed=false';
        }else if (filterType === 'completed'){
            queryParams = '?is_completed=true';
        }

        document.querySelectorAll('[data-action="filter"]').forEach(btn=>{
            btn.classList.remove('bg-blue-500','text-white');
            btn.classList.add('bg-gray-200','text-gray-700');
        });
        target.classList.add('bg-blue-500','text-white');
        target.classList.remove('bg-gray-200','text-gray-700');

        fetchTasks(queryParams);
    }
    
    const fetchTasks = async (queryParams = '') => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/tasks/${queryParams}`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Could not fetch tasks.');
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Fetch tasks error:', error);
        }
    };

    const renderTasks = (tasks) => {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<p class="text-gray-500 col-span-full">No tasks found. Add one above!</p>';
            return;
        }
        tasks.forEach(task => {
            const priorityColors = { 'High': 'bg-red-100 text-red-800', 'Medium': 'bg-yellow-100 text-yellow-800', 'Low': 'bg-green-100 text-green-800' };
            const taskCard = `
                <div class="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between ${task.is_completed ? 'opacity-50 border-l-4 border-green-500' : 'border-l-4 border-gray-300'}">
                    <div>
                        <div class="flex justify-between items-start">
                            <h5 class="text-lg font-bold text-gray-900 mb-2">${task.title}</h5>
                            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}">${task.priority}</span>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">${task.description || ''}</p>
                    </div>
                    <div class="border-t pt-4 mt-4 flex justify-between items-center">
                        <p class="text-sm text-gray-500">Due: ${task.due_date}</p>
                        <div class="flex items-center space-x-2">
                            <button class="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded-full" data-action="edit" data-id="${task.id}">Edit</button>
                            <button class="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full disabled:opacity-50" data-action="complete" data-id="${task.id}" ${task.is_completed ? 'disabled' : ''}>Done</button>
                            <button class="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full" data-action="delete" data-id="${task.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `;
            taskList.innerHTML += taskCard;
        });
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
        logoutButton.classList.remove('hidden');
        loadView('dashboard');
    } else {
        loadView('login');
    }
});