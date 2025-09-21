import { API_URL, authFetch } from './utils/api.js';
import { refreshAccessToken, forceLogout, fetchAndCacheUserProfile } from './utils/auth.js';
import { showFieldError, hideFieldError, validateEmail, togglePasswordVisibility, updatePasswordStrength, validatePasswordConfirmation } from './utils/validation.js';
import { showToast } from './ui/toast.js';
import { modalState, getModalElements, openTaskModal, closeTaskModal, openConfirmModal, closeConfirmModal } from './ui/modal.js';
import { updateUserProfileUI, toggleProfileDropdown, closeProfileDropdown } from './ui/profile.js';
import { initDashboardUI,renderTasks} from './tasks/taskUI.js';
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
            
            modalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                import('./tasks/taskUI.js').then(m => m.handleModalFormSubmit(e));
            });
            
            const submitButton = document.getElementById('modal-save-button');
            if (submitButton) {
                submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    import('./tasks/taskUI.js').then(m => m.handleModalFormSubmit(e));
                });
            }
            
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
            import('./tasks/taskUI.js').then(m => {
                m.initDashboardUI();
                updateUserProfileUI();
                
                initModalListeners();
                
                const taskList = document.querySelector('#task-list'); 

                if (taskList) {
                    taskList.addEventListener('click', function(event) {
                        const toggleBtn = event.target.closest('.toggle-desc');
                        if (!toggleBtn) return;

                        const card = toggleBtn.closest('.group');
                        if (!card) return;
                        
                        card.classList.toggle('is-expanded');

                        if (card.classList.contains('is-expanded')) {
                            toggleBtn.textContent = 'Read less';
                        } else {
                            toggleBtn.textContent = 'Read more';
                        }
                    });
                }
            });
            
        } else if (viewName === 'profile') {
            // Attach submit handler and fetch current profile
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.addEventListener('submit', handleProfileSubmitUser(navigateTo));
            }
            fetchProfileAndPopulateUser(navigateTo).then(() => updateUserProfileUI());
        }
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


    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear();
            if (logoutButton) logoutButton.classList.add('hidden');
            if (userProfileSection) userProfileSection.classList.add('hidden');
            showToast('Logged out successfully.');
            setTimeout(() => navigateTo('/login'), 1000);
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
            showToast('Logged out successfully.');
            setTimeout(() => navigateTo('/login'), 1000);
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