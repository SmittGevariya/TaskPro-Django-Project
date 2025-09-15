document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const logoutButton = document.getElementById('logout-button');
    const userProfileSection = document.getElementById('user-profile-section');
    const API_URL = 'http://127.0.0.1:8000/api';
    let taskModal, modalForm, modalTitle, modalSaveButton, modalCloseButton, taskIdInput, confirmModal, confirmDeleteBtn, cancelDeleteBtn, modalCloseButtonX, modalCompleteButton;
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
        modalCompleteButton = document.getElementById('modal-complete-button');
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
            modalCompleteButton.addEventListener('click', handleModalCompleteClick);
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

    // Password toggle functionality
    const togglePasswordVisibility = (inputId, openEyeId, closedEyeId) => {
        const input = document.getElementById(inputId);
        const openEye = document.getElementById(openEyeId);
        const closedEye = document.getElementById(closedEyeId);
        
        if (input && openEye && closedEye) {
            if (input.type === 'password') {
                input.type = 'text';
                openEye.classList.add('hidden');
                closedEye.classList.remove('hidden');
            } else {
                input.type = 'password';
                openEye.classList.remove('hidden');
                closedEye.classList.add('hidden');
            }
        }
    };

    // Password strength indicator
    const updatePasswordStrength = () => {
        const password = document.getElementById('register-password')?.value || '';
        const strengthBars = document.querySelectorAll('#register-password-strength .h-1');
        const strengthText = document.getElementById('password-strength-text');
        
        if (!strengthBars.length || !strengthText) return;
        
        let strength = 0;
        let strengthLabel = '';
        let strengthColor = '';
        
        // Reset bars
        strengthBars.forEach(bar => {
            bar.className = 'h-1 w-full bg-gray-200 rounded-full';
        });
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Update bars
        for (let i = 0; i < strength; i++) {
            if (strength <= 2) {
                strengthBars[i].className = 'h-1 w-full bg-red-500 rounded-full';
                strengthColor = 'text-red-500';
            } else if (strength <= 3) {
                strengthBars[i].className = 'h-1 w-full bg-yellow-500 rounded-full';
                strengthColor = 'text-yellow-500';
            } else {
                strengthBars[i].className = 'h-1 w-full bg-green-500 rounded-full';
                strengthColor = 'text-green-500';
            }
        }
        
        // Update text
        if (password.length === 0) {
            strengthLabel = 'Enter a password';
            strengthColor = 'text-gray-500';
        } else if (strength <= 2) {
            strengthLabel = 'Weak password';
        } else if (strength <= 3) {
            strengthLabel = 'Fair password';
        } else {
            strengthLabel = 'Strong password';
        }
        
        strengthText.textContent = strengthLabel;
        strengthText.className = `text-xs mt-1 ${strengthColor}`;
    };

    // Password confirmation validation
    const validatePasswordConfirmation = () => {
        const password = document.getElementById('register-password')?.value || '';
        const confirmPassword = document.getElementById('register-confirm-password')?.value || '';
        const errorDiv = document.getElementById('register-confirm-password-error');
        
        if (!errorDiv) return;
        
        if (confirmPassword && password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.remove('hidden');
        } else {
            errorDiv.classList.add('hidden');
        }
    };

    // Form validation helpers
    const showFieldError = (fieldId, message) => {
        const errorDiv = document.getElementById(`${fieldId}-error`);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    };

    const hideFieldError = (fieldId) => {
        const errorDiv = document.getElementById(`${fieldId}-error`);
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const fetchAndCacheUserProfile = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;
        try {
            const response = await fetch(`${API_URL}/auth/me/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return null;
            const profile = await response.json();
            if (profile?.username) {
                localStorage.setItem('username', profile.username);
            }
            return profile;
        } catch (e) { return null; }
    };

    const updateUserProfile = () => {
        const username = localStorage.getItem('username');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (username) {
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
            { path: "/", view: 'dashboard' },
            { path: "/profile", view: 'profile' }
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
                // Ensure we display server-verified username (not raw input)
                if (!localStorage.getItem('username')) {
                    await fetchAndCacheUserProfile();
                }
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
            
            // Password toggle functionality
            const toggleLoginPassword = document.getElementById('toggle-login-password');
            if (toggleLoginPassword) {
                toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility('login-password', 'login-eye-open', 'login-eye-closed'));
            }
        } else if (viewName === 'register') {
            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.addEventListener('submit', handleRegister);
            }
            
            // Password toggle functionality
            const toggleRegisterPassword = document.getElementById('toggle-register-password');
            const toggleRegisterConfirmPassword = document.getElementById('toggle-register-confirm-password');
            
            if (toggleRegisterPassword) {
                toggleRegisterPassword.addEventListener('click', () => togglePasswordVisibility('register-password', 'register-eye-open', 'register-eye-closed'));
            }
            
            if (toggleRegisterConfirmPassword) {
                toggleRegisterConfirmPassword.addEventListener('click', () => togglePasswordVisibility('register-confirm-password', 'register-confirm-eye-open', 'register-confirm-eye-closed'));
            }
            
            // Password strength indicator
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
        } else if (viewName === 'profile') {
            // Attach submit handler and fetch current profile
            const profileForm = document.getElementById('profile-form');
            if (profileForm) {
                profileForm.addEventListener('submit', handleProfileSubmit);
            }
            fetchProfileAndPopulate();
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Clear previous errors
        hideFieldError('username');
        hideFieldError('password');
        
        // Basic validation
        if (!data.username) {
            showFieldError('username', 'Username is required');
            return;
        }
        
        if (!data.password) {
            showFieldError('password', 'Password is required');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/login/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(data) 
            });
            const responseData = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    showFieldError('password', 'Invalid username or password');
                } else {
                    throw new Error(responseData.detail || 'Failed to login.');
                }
                return;
            }
            
            localStorage.setItem('accessToken', responseData.access);
            localStorage.setItem('refreshToken', responseData.refresh);
            // Fetch actual profile to get canonical username
            await fetchAndCacheUserProfile();
            navigateTo('/');
        } catch (error) { 
            showToast(error.message, 'error'); 
        }
    };

    const fetchProfileAndPopulate = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) { return navigateTo('/login'); }
        try {
            const response = await fetch(`${API_URL}/auth/profile/`, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` 
                }
            });
            if (response.status === 401 || response.status === 403) { return forceLogout(); }
            // if (!response.ok) throw new Error('Failed to load profile');
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Invalid response from server");
            }
            const data = await response.json();
            document.getElementById('profile-username')?.setAttribute('value', data.username || '');
            document.getElementById('profile-first-name')?.setAttribute('value', data.first_name || '');
            document.getElementById('profile-last-name')?.setAttribute('value', data.last_name || '');
            document.getElementById('profile-email')?.setAttribute('value', data.email || '');
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

        const handleProfileSubmit = async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('accessToken');
            if (!token) { return navigateTo('/login'); }
            const form = e.target;
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            try {
                const response = await fetch(`${API_URL}/auth/profile/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (response.status === 401 || response.status === 403) { return forceLogout(); }
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.detail || 'Failed to update profile');
                }
                if (data?.username) {
                    localStorage.setItem('username', data.username);
                    updateUserProfile();
                }
                showToast('Profile updated successfully!');
            } catch (error) {
                showToast(error.message, 'error');
            }
        };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Clear previous errors
        hideFieldError('register-username');
        hideFieldError('register-email');
        hideFieldError('register-password');
        hideFieldError('register-confirm-password');
        
        let hasErrors = false;
        
        // Username validation
        if (!data.username) {
            showFieldError('register-username', 'Username is required');
            hasErrors = true;
        } else if (data.username.length < 3) {
            showFieldError('register-username', 'Username must be at least 3 characters');
            hasErrors = true;
        }
        
        // Email validation
        if (!data.email) {
            showFieldError('register-email', 'Email is required');
            hasErrors = true;
        } else if (!validateEmail(data.email)) {
            showFieldError('register-email', 'Please enter a valid email address');
            hasErrors = true;
        }
        
        // Password validation
        if (!data.password) {
            showFieldError('register-password', 'Password is required');
            hasErrors = true;
        } else if (data.password.length < 8) {
            showFieldError('register-password', 'Password must be at least 8 characters');
            hasErrors = true;
        }
        
        // Confirm password validation
        if (!data.confirm_password) {
            showFieldError('register-confirm-password', 'Please confirm your password');
            hasErrors = true;
        } else if (data.password !== data.confirm_password) {
            showFieldError('register-confirm-password', 'Passwords do not match');
            hasErrors = true;
        }
        
        if (hasErrors) return;
        
        try {
            const response = await fetch(`${API_URL}/auth/register/`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(data) 
            });
            const responseData = await response.json();
            
            if (!response.ok) { 
                // Handle field-specific errors
                if (responseData.username) {
                    showFieldError('register-username', responseData.username.join(', '));
                }
                if (responseData.email) {
                    showFieldError('register-email', responseData.email.join(', '));
                }
                if (responseData.password) {
                    showFieldError('register-password', responseData.password.join(', '));
                }
                
                // Show general error if no specific field errors
                if (!responseData.username && !responseData.email && !responseData.password) {
                    const errorMessage = Object.entries(responseData)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join(' | '); 
                    throw new Error(errorMessage);
                }
                return;
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
        if (modalCompleteButton) modalCompleteButton.dataset.id = '';
        if (modalTitle) modalTitle.textContent = 'Add New Task';
        openTaskModal();
    };

    const handleEditClick = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        console.log("Access token:", token);
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 401) { return forceLogout(); }
            if (!response.ok) throw new Error('Task not found');
            
            const task = await response.json();

            if (taskIdInput) taskIdInput.value = task.id;
            if (modalCompleteButton) modalCompleteButton.dataset.id = task.id;
            
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

    const handleModalCompleteClick = () => {
        const taskId = modalCompleteButton?.dataset.id;
        if (taskId) {
            markTaskComplete(taskId);
            closeTaskModal();
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
        const addTaskBtn = document.getElementById('add-task-btn');
        const searchBar = document.getElementById('task-search');
        const priorityFilter = document.getElementById('priority-filter');
        const filterContainer = document.getElementById('filter-container');
        const searchFilterSection = document.querySelector('.flex.flex-col.sm\\:flex-row.gap-4.mb-6');
        const statusFilterSection = document.querySelector('.flex.items-center.mb-4.space-x-2');
        const tasksHeading = document.querySelector('h3.text-2xl.font-bold.text-gray-800.mb-4');
        
        if (!taskList) return;

        // Only store all tasks when not filtering (i.e., when called from fetchTasks)
        if (!isFiltered) {
            allTasks = tasks;
        }

        // Get current filter status
        const statusFilter = document.querySelector('[data-action="filter"].bg-blue-500')?.dataset.filter || 'all';
        const hasNoTasksAtAll = allTasks.length === 0;
        const isAllFilter = statusFilter === 'all';
        const showAddButton = isAllFilter && hasNoTasksAtAll && !isFiltered;

        if (tasks.length === 0) {
            // Only hide UI elements when there are absolutely no tasks at all
            if (hasNoTasksAtAll && !isFiltered) {
                if (addTaskBtn) addTaskBtn.classList.add('hidden');
                if (searchFilterSection) searchFilterSection.classList.add('hidden');
                if (statusFilterSection) statusFilterSection.classList.add('hidden');
                if (tasksHeading) tasksHeading.classList.add('hidden');
            } else {
                // Keep UI elements visible when filtering results in empty list
                if (addTaskBtn) addTaskBtn.classList.remove('hidden');
                if (searchFilterSection) searchFilterSection.classList.remove('hidden');
                if (statusFilterSection) statusFilterSection.classList.remove('hidden');
                if (tasksHeading) tasksHeading.classList.remove('hidden');
            }
            
            // Determine empty state message based on filter
            let emptyTitle = '';
            let emptyMessage = '';
            let showAddTaskButton = false;
            
            if (hasNoTasksAtAll && !isFiltered) {
                // No tasks at all - show Add Task button
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
            
            // Set engaging empty state HTML
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
            
            // Add event listener for the Add Task button if it exists
            if (showAddTaskButton) {
                const addFirstTaskBtn = document.getElementById('add-first-task-btn');
                if (addFirstTaskBtn) {
                    addFirstTaskBtn.addEventListener('click', handleAddTaskClick);
                }
            }
            
            return;
        } else {
            // Show UI elements when task list is not empty
            if (addTaskBtn) addTaskBtn.classList.remove('hidden');
            if (searchFilterSection) searchFilterSection.classList.remove('hidden');
            if (statusFilterSection) statusFilterSection.classList.remove('hidden');
            if (tasksHeading) tasksHeading.classList.remove('hidden');
            
            // Clear the task list container
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

    const filterTasks = () => {
        const searchTerm = document.getElementById('task-search')?.value.toLowerCase() || '';
        const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
        const statusFilter = document.querySelector('[data-action="filter"].bg-blue-500')?.dataset.filter || 'all';

        let filteredTasks = [...allTasks]; // Create a copy to avoid mutating original array

        // Filter by status first
        if (statusFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.is_completed);
        } else if (statusFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.is_completed);
        }
        // 'all' filter shows all tasks (no additional filtering needed)

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

    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            navigateTo('/profile');
        });
}

    router();
});