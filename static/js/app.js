import { API_URL, authFetch } from './utils/api.js';
import { refreshAccessToken, forceLogout, fetchAndCacheUserProfile } from './utils/auth.js';
import { showFieldError, hideFieldError, validateEmail, togglePasswordVisibility, updatePasswordStrength, validatePasswordConfirmation } from './utils/validation.js';
import { showToast } from './ui/toast.js';
import { modalState, getModalElements, openTaskModal, closeTaskModal, openConfirmModal, closeConfirmModal } from './ui/modal.js';
import { updateUserProfileUI, toggleProfileDropdown, closeProfileDropdown } from './ui/profile.js';
import { initDashboardUI } from './tasks/taskUI.js';
import { createHandleLogin, createHandleRegister } from './utils/authHandlers.js';
import { fetchProfileAndPopulate as fetchProfileAndPopulateUser, handleProfileSubmit as handleProfileSubmitUser } from './utils/user.js';

document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const logoutButton = document.getElementById('logout-button');
    const userProfileSection = document.getElementById('user-profile-section');

    const initModalListeners = () => {
        getModalElements();
        const { modalForm, modalCloseButton, modalCloseButtonX, cancelDeleteBtn, confirmDeleteBtn, modalCompleteButton } = modalState;
        if (modalForm) {
            modalCloseButton?.addEventListener('click', closeTaskModal);
            modalCloseButtonX?.addEventListener('click', closeTaskModal);
            cancelDeleteBtn?.addEventListener('click', closeConfirmModal);
            confirmDeleteBtn?.addEventListener('click', () => import('./tasks/taskUI.js').then(m => m.handleConfirmDelete()));
            modalForm.addEventListener('submit', (e) => import('./tasks/taskUI.js').then(m => m.handleModalFormSubmit(e)));
            modalCompleteButton?.addEventListener('click', () => import('./tasks/taskUI.js').then(m => m.handleModalCompleteClick()));
        }
    };

    const navigateTo = (path) => {
        history.pushState(null, null, path);
        router();
    };

    const router = async () => {
        const routes = [
            { path: "/", view: 'home' },
            { path: "/login", view: 'login' }, 
            { path: "/signup", view: 'register' }, 
            { path: "/register", view: 'register' }, 
            { path: "/tasks", view: 'dashboard' },
            { path: "/profile", view: 'profile' }
        ];
        let match = routes.find(route => route.path === location.pathname);
        if (!match) { 
            match = { path: "/", view: 'home' }; 
        }

        const token = localStorage.getItem('accessToken');
        
        if (appContent && appContent.querySelector('.profile-form-container')) {
            const container = appContent.querySelector('.profile-form-container');
            if (container) {
                container.classList.add('opacity-0', 'translate-y-4');
                container.classList.remove('opacity-100', 'translate-y-0');
                // Wait for animation to complete before loading new view
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }
        
        if (token) {
            if (logoutButton) logoutButton.classList.remove('hidden');
            if (userProfileSection) {
                userProfileSection.classList.remove('hidden');
                // Ensure we display server-verified username (not raw input)
                
                await fetchAndCacheUserProfile(authFetch);

                updateUserProfileUI();
            }
        } else {
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
        }
        
        if (token) {
            if (match.view === 'home' || match.view === 'login' || match.view === 'register') {
                return navigateTo('/tasks');
            }
        } else {
            if (match.view === 'dashboard' || match.view === 'profile') {
                return navigateTo('/login');
            }
        }

        await loadView(match.view);
    };

    const loadView = async (viewName) => {
        try {
            const response = await fetch(`/components/${viewName}/`);
            if (!response.ok) throw new Error(`Template not found for ${viewName}`);
            
            const htmlContent = await response.text();
            if (appContent) {
                // Add animation classes for profile form
                if (viewName === 'profile') {
                    appContent.innerHTML = `<div class="profile-form-container opacity-0 transform translate-y-4 transition-all duration-250 ease-out">${htmlContent}</div>`;
                    // Trigger animation after a small delay
                    setTimeout(() => {
                        const container = appContent.querySelector('.profile-form-container');
                        if (container) {
                            container.classList.remove('opacity-0', 'translate-y-4');
                            container.classList.add('opacity-100', 'translate-y-0');
                        }
                    }, 10);
                } else if (viewName === 'home') {
                    // Subtle fade-in for landing
                    appContent.innerHTML = `<div class="opacity-0 transition-opacity duration-300">${htmlContent}</div>`;
                    setTimeout(() => {
                        const container = appContent.firstElementChild;
                        if (container) container.classList.remove('opacity-0');
                    }, 10);
                } else {
                    appContent.innerHTML = htmlContent;
                }
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
                loginForm.addEventListener('submit', createHandleLogin(navigateTo, authFetch));
            }
            
            const toggleLoginPassword = document.getElementById('toggle-login-password');
            if (toggleLoginPassword) {
                toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility('login-password', 'login-eye-open', 'login-eye-closed'));
            }
        } else if (viewName === 'register') {
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', createHandleRegister(navigateTo));
            }
            
            const toggleRegisterPassword = document.getElementById('toggle-register-password');
            const toggleRegisterConfirmPassword = document.getElementById('toggle-register-confirm-password');
            
            if (toggleRegisterPassword) {
                toggleRegisterPassword.addEventListener('click', () => togglePasswordVisibility('register-password', 'register-eye-open', 'register-eye-closed'));
            }
            
            if (toggleRegisterConfirmPassword) {
                toggleRegisterConfirmPassword.addEventListener('click', () => togglePasswordVisibility('register-confirm-password', 'register-confirm-eye-open', 'register-confirm-eye-closed'));
            }
            
            const passwordInput = document.getElementById('register-password');
            if (passwordInput) {
                passwordInput.addEventListener('input', updatePasswordStrength);
            }
            
            // Password confirmation validation
            const confirmPasswordInput = document.getElementById('register-confirm-password');
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', validatePasswordConfirmation);
            }
        } else if (viewName === 'dashboard') {
            import('./tasks/taskUI.js').then(m => {m.initDashboardUI();updateUserProfileUI();});
            
        } else if (viewName === 'profile') {
            // Attach submit handler and fetch current profile
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.addEventListener('submit', handleProfileSubmitUser(navigateTo));
            }
            fetchProfileAndPopulateUser(navigateTo).then(() => updateUserProfileUI());
        }
    };

    const handleFilterClick = (e) => {
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

    const markTaskComplete = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await authFetch(`${API_URL}/tasks/${taskId}/`, { 
                method: 'PATCH', 
                headers: { 
                    'Content-Type': 'application/json'
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
            const response = await authFetch(`${API_URL}/tasks/${taskId}/`, { 
                method: 'DELETE'
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
            const response = await authFetch(`${API_URL}/tasks/`, { 
                method: 'GET'
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
        const addTaskBtn = document.getElementById('add-task-btn');
        const searchBar = document.getElementById('task-search');
        const priorityFilter = document.getElementById('priority-filter');
        const filterContainer = document.getElementById('filter-container');
        const searchFilterSection = document.querySelector('.flex.flex-col.sm\\:flex-row.gap-4.mb-6');
        const statusFilterSection = document.querySelector('.flex.items-center.mb-4.space-x-2');
        const tasksHeading = document.querySelector('h3.text-2xl.font-bold.text-gray-800.mb-4');
        
        if (!taskList) return;

        if (!isFiltered) {
            allTasks = tasks;
        }

        const statusFilter = document.querySelector('[data-action="filter"].bg-blue-500')?.dataset.filter || 'all';
        const hasNoTasksAtAll = allTasks.length === 0;
        const isAllFilter = statusFilter === 'all';
        const showAddButton = isAllFilter && hasNoTasksAtAll && !isFiltered;

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
            
            if (hasNoTasksAtAll && !isFiltered) {
                emptyTitle = 'No tasks yet!';
                emptyMessage = 'Start by adding your first task.';
                showAddTaskButton = true;
            } else if (statusFilter === 'pending') {
                emptyTitle = 'All caught up!';
                emptyMessage = 'You have no pending tasks. 🎉';
            } else if (statusFilter === 'completed') {
                emptyTitle = 'No completed tasks yet.';
                emptyMessage = 'Finish some tasks to see them here. 🏆';
            } else {
                // All filter with tasks but filtered results are empty
                emptyTitle = 'No tasks found';
                emptyMessage = 'Try adjusting your search or filter criteria.';
            }
            
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
                    <button 
                        id="add-first-task-btn"
                        class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200 hover:scale-105 font-medium"
                    >
                        Add Task
                    </button>
                    ` : ''}
                </div>
            `;
            
            if (showAddTaskButton) {
                const addFirstTaskBtn = document.getElementById('add-first-task-btn');
                if (addFirstTaskBtn) {
                    addFirstTaskBtn.addEventListener('click', handleAddTaskClick);
                }
            }
            
            return;
        } else {
            if (addTaskBtn) addTaskBtn.classList.remove('hidden');
            if (searchFilterSection) searchFilterSection.classList.remove('hidden');
            if (statusFilterSection) statusFilterSection.classList.remove('hidden');
            if (tasksHeading) tasksHeading.classList.remove('hidden');
            
            taskList.innerHTML = '';
        }

        tasks.forEach(task => {
            const priorityColors = { 
                'High': 'bg-red-500 text-white', 
                'Medium': 'bg-yellow-500 text-white', 
                'Low': 'bg-green-500 text-white' 
            };
            
            const priorityIcons = {
                'High': '🔴',
                'Medium': '🟡', 
                'Low': '🟢'
            };
            
            const taskCard = `
                <div class="group bg-white rounded-xl shadow-md hover:shadow-lg p-6 transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 ${task.is_completed ? 'opacity-75 border-l-4 border-green-500' : 'border-l-4 border-gray-200'} relative overflow-hidden">
                    <!-- Header with Title and Priority -->
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold text-gray-900 leading-tight ${task.is_completed ? 'line-through text-gray-500' : ''}">
                            ${task.title}
                        </h3>
                        <span class="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-500 text-white'} shadow-sm">
                            <span class="text-xs">${priorityIcons[task.priority] || '⚪'}</span>
                            ${task.priority}
                        </span>
                    </div>
                    
                    <!-- Description -->
                    <p class="text-gray-600 text-sm mb-6 leading-relaxed ${task.is_completed ? 'line-through text-gray-400' : ''}">
                        ${task.description || 'No description provided'}
                    </p>
                    
                    <!-- Due Date -->
                    <div class="flex items-center gap-2 mb-6 text-sm text-gray-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span class="font-medium">Due: ${task.due_date}</span>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                        ${!task.is_completed ? `
                        <button 
                            class="group/edit flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md" 
                            data-action="edit" 
                            data-id="${task.id}"
                            title="Edit task"
                        >
                            <span class="text-sm">✏️</span>
                            <span class="hidden sm:inline">Edit</span>
                        </button>
                        ` : ''}
                        
                        <button 
                            class="group/delete flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-red-500 text-gray-600 hover:text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md" 
                            data-action="delete" 
                            data-id="${task.id}"
                            title="Delete task"
                        >
                            <span class="text-sm">🗑️</span>
                            <span class="hidden sm:inline">Delete</span>
                        </button>
                    </div>
                </div>`;
            taskList.innerHTML += taskCard;
        });
    };
    
    const updateFAB = (show) => {
        let fab = document.getElementById('floating-add-button');
        
        if (show) {
            if (!fab) {
                // Create FAB if it doesn't exist
                fab = document.createElement('button');
                fab.id = 'floating-add-button';
                fab.className = 'fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110 z-50';
                fab.innerHTML = '➕';
                fab.title = 'Add New Task';
                fab.addEventListener('click', handleAddTaskClick);
                document.body.appendChild(fab);
            }
            fab.classList.remove('hidden');
        } else {
            if (fab) {
                fab.classList.add('hidden');
            }
        }
    };


    initModalListeners();

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear();
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
            navigateTo('/login');
        });
    }

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
            closeProfileDropdown(); 
            localStorage.clear();
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
            navigateTo('/login');
        });
    }

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

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            closeProfileDropdown(); 
            navigateTo('/profile');
        });
    }
    router();
});