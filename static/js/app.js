document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const logoutButton = document.getElementById('logout-button');
    const userProfileSection = document.getElementById('user-profile-section');
    const API_URL = 'http://127.0.0.1:8000/api';
    let taskModal, modalForm, modalTitle, modalSaveButton, modalCloseButton, taskIdInput, confirmModal, confirmDeleteBtn, cancelDeleteBtn, modalCloseButtonX;
    let modalListenersAttached = false;
    let allTasks = []; // Store all tasks for filtering

    const getModalElements = () => {
        taskModal = document.getElementById('task-modal');
        modalForm = document.getElementById('modal-form');
        modalTitle = document.getElementById('modal-title');
        modalSaveButton = document.getElementById('modal-save-button');
        modalCloseButton = document.getElementById('modal-close-button');
        taskIdInput = document.getElementById('task-id');
        confirmModal = document.getElementById('confirm-delete-modal');
        confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        cancelDeleteBtn = document.getElementById('cancel-delete-btn');
        modalCloseButtonX = document.getElementById('modal-close-button-x');
    };

    const initModalListeners = () => {
        // Only attach listeners once
        if (modalListenersAttached) return;
        
        // Initialize modal elements
        getModalElements();
        
        // Attach modal event listeners only once
        if (modalForm) {
            modalCloseButton.addEventListener('click', closeTaskModal);
            modalCloseButtonX.addEventListener('click', closeTaskModal);
            // Save button is type="submit" so it will automatically trigger form submit
            // No need for a separate click handler
            cancelDeleteBtn.addEventListener('click', closeConfirmModal);
            confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
            modalForm.addEventListener('submit', handleModalFormSubmit);
            modalListenersAttached = true;
        }
    };

    const showToast = (message, type = 'success') => {
        const colors = {
            success: 'linear-gradient(to right, #00b09b, #96c93d)',
            error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
        };
        if (typeof Toastify !== 'undefined') {
            Toastify({ 
                text: message, 
                duration: 3000, 
                close: true, 
                gravity: "top", 
                position: "right", 
                stopOnFocus: true, 
                style: { background: colors[type] || colors.success } 
            }).showToast();
        }
    };

    const openTaskModal = () => { 
        if (taskModal) {
            taskModal.classList.remove('hidden'); 
            setTimeout(() => { 
                taskModal.classList.remove('opacity-0'); 
                const form = taskModal.querySelector('form');
                if (form) form.classList.remove('scale-95'); 
            }, 10); 
        }
    };

    const closeTaskModal = () => { 
        if (taskModal) {
            taskModal.classList.add('opacity-0'); 
            const form = taskModal.querySelector('form');
            if (form) form.classList.add('scale-95'); 
            setTimeout(() => taskModal.classList.add('hidden'), 300); 
        }
    };

    const openConfirmModal = () => { 
        if (confirmModal) {
            confirmModal.classList.remove('hidden'); 
            setTimeout(() => { 
                confirmModal.classList.remove('opacity-0'); 
                const modalContent = confirmModal.querySelector('div.relative');
                if (modalContent) modalContent.classList.remove('scale-95'); 
            }, 10); 
        }
    };

    const closeConfirmModal = () => { 
        if (confirmModal) {
            confirmModal.classList.add('opacity-0'); 
            const modalContent = confirmModal.querySelector('div.relative');
            if (modalContent) modalContent.classList.add('scale-95'); 
            setTimeout(() => confirmModal.classList.add('hidden'), 300); 
        }
    };

    const updateUserProfile = () => {
        const username = localStorage.getItem('username');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (username) {
            // Generate initials from username
            const initials = username.charAt(0).toUpperCase();
            if (userAvatar) {
                userAvatar.textContent = initials;
            }
            if (userName) {
                userName.textContent = username;
            }
        }
    };

    const toggleProfileDropdown = () => {
        const dropdown = document.getElementById('profile-dropdown');
        const arrow = document.getElementById('dropdown-arrow');
        
        if (dropdown && arrow) {
            const isVisible = !dropdown.classList.contains('opacity-0');
            
            if (isVisible) {
                // Hide dropdown
                dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
                dropdown.classList.remove('scale-100');
                arrow.style.transform = 'rotate(0deg)';
            } else {
                // Show dropdown
                dropdown.classList.remove('opacity-0', 'invisible', 'scale-95');
                dropdown.classList.add('scale-100');
                arrow.style.transform = 'rotate(180deg)';
            }
        }
    };

    const closeProfileDropdown = () => {
        const dropdown = document.getElementById('profile-dropdown');
        const arrow = document.getElementById('dropdown-arrow');
        
        if (dropdown && arrow) {
            dropdown.classList.add('opacity-0', 'invisible', 'scale-95');
            dropdown.classList.remove('scale-100');
            arrow.style.transform = 'rotate(0deg)';
        }
    };

    const forceLogout = () => { 
        localStorage.clear(); 
        if (logoutButton) logoutButton.classList.add('hidden');
        if (userProfileSection) userProfileSection.classList.add('hidden'); 
        navigateTo('/login'); 
        showToast('Your session has expired.', 'error'); 
    };

    const navigateTo = (path) => {
        history.pushState(null, null, path);
        router();
    };

    const router = async () => {
        const routes = [
            { path: "/login", view: 'login' }, 
            { path: "/register", view: 'register' }, 
            { path: "/", view: 'dashboard' }
        ];
        let match = routes.find(route => route.path === location.pathname);
        if (!match) { 
            match = { path: "/", view: 'dashboard' }; 
        }

        const token = localStorage.getItem('accessToken');
        
        // Manage logout button and user profile section visibility based on authentication state
        if (token) {
            if (logoutButton) logoutButton.classList.remove('hidden');
            if (userProfileSection) {
                userProfileSection.classList.remove('hidden');
                updateUserProfile();
            }
        } else {
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
        }
        
        if (match.view === 'dashboard' && !token) { 
            return navigateTo('/login'); 
        }
        if ((match.view === 'login' || match.view === 'register') && token) { 
            return navigateTo('/'); 
        }

        await loadView(match.view);
    };

    const loadView = async (viewName) => {
        try {
            const response = await fetch(`/components/${viewName}/`);
            if (!response.ok) throw new Error(`Template not found for ${viewName}`);
            
            const htmlContent = await response.text();
            if (appContent) {
                appContent.innerHTML = htmlContent;
                setTimeout(() => attachEventListeners(viewName), 50);
            }
        } catch (error) {
            console.error('Error loading view:', error);
            if (appContent) {
                appContent.innerHTML = `<div class="p-8"><p class="text-red-500 font-bold">Error: Could not load page content.</p><p class="text-gray-600 mt-2">${error.message}</p></div>`;
            }
        }
    };

    const attachEventListeners = (viewName) => {
        if (viewName === 'login') {
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', handleLogin);
            }
        } else if (viewName === 'register') {
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', handleRegister);
            }
        } else if (viewName === 'dashboard') {
            // Refresh modal elements (but don't reattach listeners)
            getModalElements();
            
            // Attach dashboard element listeners
            const addTaskBtn = document.getElementById('add-task-btn');
            if (addTaskBtn) {
                addTaskBtn.addEventListener('click', handleAddTaskClick);
            }

            const taskList = document.getElementById('task-list');
            if (taskList) {
                taskList.addEventListener('click', handleTaskActions);
            }

            const filterContainer = document.getElementById('filter-container');
            if (filterContainer) {
                filterContainer.addEventListener('click', handleFilterClick);
            }

            // Search functionality
            const searchInput = document.getElementById('task-search');
            if (searchInput) {
                searchInput.addEventListener('input', filterTasks);
            }

            // Priority filter
            const priorityFilter = document.getElementById('priority-filter');
            if (priorityFilter) {
                priorityFilter.addEventListener('change', filterTasks);
            }

            // Set user greeting
            const userGreeting = document.getElementById('user-greeting');
            const username = localStorage.getItem('username');
            if (username && userGreeting) {
                userGreeting.textContent = username;
            }

            fetchTasks();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${API_URL}/auth/login/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(data) 
            });
            const responseData = await response.json();
            
            if (!response.ok) throw new Error(responseData.detail || 'Failed to login.');
            
            localStorage.setItem('accessToken', responseData.access);
            localStorage.setItem('refreshToken', responseData.refresh);
            localStorage.setItem('username', data.username);
            
            navigateTo('/');
        } catch (error) { 
            showToast(error.message, 'error'); 
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch(`${API_URL}/auth/register/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(data) 
            });
            const responseData = await response.json();
            
            if (!response.ok) { 
                const errorMessage = Object.entries(responseData)
                    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                    .join(' | '); 
                throw new Error(errorMessage); 
            }
            showToast('Registration successful! Please log in.');
            navigateTo('/login');
        } catch (error) { 
            showToast(error.message, 'error'); 
        }
    };

    const handleAddTaskClick = () => {
        if (modalForm) modalForm.reset();
        if (taskIdInput) taskIdInput.value = '';
        if (modalTitle) modalTitle.textContent = 'Add New Task';
        openTaskModal();
    };

    const handleEditClick = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) { return forceLogout(); }
            if (!response.ok) throw new Error('Task not found');
            
            const task = await response.json();

            if (taskIdInput) taskIdInput.value = task.id;
            
            const modalTaskTitle = document.getElementById('modal-task-title');
            const modalTaskDescription = document.getElementById('modal-task-description');
            const modalTaskDueDate = document.getElementById('modal-task-due-date');
            const modalTaskPriority = document.getElementById('modal-task-priority');

            if (modalTaskTitle) modalTaskTitle.value = task.title;
            if (modalTaskDescription) modalTaskDescription.value = task.description;
            if (modalTaskDueDate) modalTaskDueDate.value = task.due_date;
            if (modalTaskPriority) modalTaskPriority.value = task.priority;
            if (modalTitle) modalTitle.textContent = 'Edit Task';

            openTaskModal();
        } catch(error) { 
            showToast(error.message, 'error'); 
        }
    };

    const handleModalFormSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent multiple rapid submissions
        if (modalForm.dataset.submitting === 'true') {
            return;
        }
        
        modalForm.dataset.submitting = 'true';
        
        const token = localStorage.getItem('accessToken');
        const formData = new FormData(modalForm);
        const data = Object.fromEntries(formData.entries());
        const taskId = data.task_id;
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `${API_URL}/tasks/${taskId}/` : `${API_URL}/tasks/`;

        try {
            const response = await fetch(url, { 
                method: method, 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }, 
                body: JSON.stringify(data) 
            });
            if (response.status === 401) { return forceLogout(); }
            if (!response.ok) { 
                const errData = await response.json(); 
                throw new Error(JSON.stringify(errData)); 
            }
            closeTaskModal();
            fetchTasks();
            showToast(taskId ? 'Task updated successfully!' : 'Task created successfully!');
        } catch (error) {
            showToast('Error saving task: ' + error.message, 'error');
        } finally {
            // Reset the submitting flag
            modalForm.dataset.submitting = 'false';
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
            if (confirmDeleteBtn) confirmDeleteBtn.dataset.taskIdToDelete = taskId;
            openConfirmModal();
        } else if (action === 'edit') handleEditClick(taskId);
    };

    const handleConfirmDelete = () => {
        if (confirmDeleteBtn) {
            const taskId = confirmDeleteBtn.dataset.taskIdToDelete;
            if (taskId) {
                deleteTask(taskId);
                closeConfirmModal();
                delete confirmDeleteBtn.dataset.taskIdToDelete;
            }
        }
    };

    const handleFilterClick = (e) => {
        const target = e.target;
        if (target.dataset.action !== 'filter') return;

        // Update button styles
        document.querySelectorAll('[data-action="filter"]').forEach(btn => {
            btn.classList.remove('bg-blue-500', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        target.classList.add('bg-blue-500', 'text-white');
        target.classList.remove('bg-gray-200', 'text-gray-700');

        // Apply filters
        filterTasks();
    };

    const markTaskComplete = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, { 
                method: 'PATCH', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }, 
                body: JSON.stringify({ is_completed: true }) 
            });
            if (response.status === 401) { return forceLogout(); }
            if (!response.ok) throw new Error('Failed to update task.');
            fetchTasks();
            showToast('Task marked as complete!');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const deleteTask = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) { return forceLogout(); }
            if (!response.ok) throw new Error('Failed to delete task.');
            fetchTasks();
            showToast('Task deleted successfully.');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const fetchTasks = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) { 
            navigateTo('/login'); 
            return; 
        }
        try {
            const response = await fetch(`${API_URL}/tasks/`, { 
                method: 'GET', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401 || response.status === 403) { return forceLogout(); }
            if (!response.ok) throw new Error('Could not fetch tasks.');
            
            const responseText = await response.text();
            let tasks;
            try {
                tasks = JSON.parse(responseText);
            } catch (parseError) {
                console.error('API returned HTML instead of JSON. Check your /api/tasks/ endpoint.');
                renderTasks([]);
                showToast('API configuration error. Please check server setup.', 'error');
                return;
            }
            
            renderTasks(tasks);
        } catch (error) {
            console.error('Fetch tasks error:', error);
        }
    };

    const renderTasks = (tasks, isFiltered = false) => {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        // Only store all tasks when not filtering (i.e., when called from fetchTasks)
        if (!isFiltered) {
            allTasks = tasks;
        }

        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="text-center col-span-full py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-900">All caught up!</h3>
                    <p class="mt-1 text-sm text-gray-500">You have no pending tasks. Good job!</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const priorityColors = { 
                'High': 'bg-red-100 text-red-800', 
                'Medium': 'bg-yellow-100 text-yellow-800', 
                'Low': 'bg-green-100 text-green-800' 
            };
            
            const taskCard = `
                <div class="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between ${task.is_completed ? 'opacity-50 border-l-4 border-green-500' : 'border-l-4 border-gray-300'} transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
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
                            <button class="transition-colors duration-200 text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded-full" data-action="edit" data-id="${task.id}">Edit</button>
                            <button class="transition-colors duration-200 text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full disabled:opacity-50" data-action="complete" data-id="${task.id}" ${task.is_completed ? 'disabled' : ''}>Done</button>
                            <button class="transition-colors duration-200 text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full" data-action="delete" data-id="${task.id}">Delete</button>
                        </div>
                    </div>
                </div>`;
            taskList.innerHTML += taskCard;
        });
    };

    const filterTasks = () => {
        const searchTerm = document.getElementById('task-search')?.value.toLowerCase() || '';
        const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
        const statusFilter = document.querySelector('[data-action="filter"].bg-blue-500')?.dataset.filter || 'all';

        let filteredTasks = [...allTasks]; // Create a copy to avoid mutating original array

        // Filter by search term
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by priority
        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                task.priority === priorityFilter
            );
        }

        // Filter by status
        if (statusFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.is_completed);
        } else if (statusFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.is_completed);
        }

        renderTasks(filteredTasks, true);
    };

    // Initialize modal listeners once at startup
    initModalListeners();

    // Logout button event listener
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear();
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
            navigateTo('/login');
        });
    }

    // Profile dropdown event listeners
    const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
    const profileLogoutBtn = document.getElementById('profile-logout-btn');
    
    if (profileDropdownBtn) {
        profileDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfileDropdown();
        });
    }

    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
            localStorage.clear();
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
            navigateTo('/login');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profile-dropdown');
        const dropdownBtn = document.getElementById('profile-dropdown-btn');
        
        if (dropdown && dropdownBtn && !dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
            closeProfileDropdown();
        }
    });

    window.addEventListener('popstate', router);

    document.body.addEventListener('click', e => {
        const link = e.target.closest('a[data-link]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('href'));
        }
    });

    router();
});