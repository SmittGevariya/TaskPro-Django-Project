
document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('app-content');
    const logoutButton = document.getElementById('logout-button');
    const API_URL = 'http://127.0.0.1:8000/api';

    const loadView = async (viewName) => {
        try {
            const response = await fetch(`/components/${viewName}/`);
            if (!response.ok) throw new Error('Template not found');
            const viewHtml = await response.text();
            
            appContent.innerHTML = viewHtml;
            attachEventListeners(viewName);

        } catch (error) {
            console.error('Error loading view:', error);
            appContent.innerHTML = `<p class="alert alert-danger">Error loading page content.</p>`;
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
            document.getElementById('add-task-form').addEventListener('submit', handleAddTask);
            
            const userGreeting = document.getElementById('user-greeting');
            const username = localStorage.getItem('username');
            if(username) {
                 userGreeting.textContent = username;
            }
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
            const response = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to login.');
            }
            const tokens = await response.json();
            localStorage.setItem('accessToken', tokens.access);
            localStorage.setItem('refreshToken', tokens.refresh);
            
            localStorage.setItem('username',data.username);
            logoutButton.classList.remove('hidden', 'd-none'); // Use both for safety
            loadView('dashboard');
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('hidden', 'd-none');
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
            const response = await fetch(`${API_URL}/auth/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = Object.entries(errorData).map(([field, messages]) => `${field}: ${messages.join(', ')}`).join('\n');
                throw new Error(errorMessage);
            }
            alert('Registration successful! Please log in.');
            loadView('login');
        } catch (error) {
            registerError.textContent = error.message;
            registerError.classList.remove('hidden', 'd-none');
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const addTaskForm = e.target;
        const formData = new FormData(addTaskForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_URL}/tasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Could not create task.');
            
            addTaskForm.reset();
            fetchTasks();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleTaskAction = (e) => {
        const target=e.target;
        const action=target.dataset.action;
        const taskId=target.dataset.id;

        if(!action || !taskId) return;

        if(action === 'complete'){
            markTaskComplete(taskId);
        }else if(action === 'delete'){
            if(confirm('Are you sure you want to delete this task?')){
                deleteTask(taskId);
            }
        }
    };

    const markTaskComplete = async(taskId) => {
        const token=localStorage.getItem('accessToken');
        try{
            const response=await fetch(`${API_URL}/tasks/${taskId}/`,{
                method:'PATCH',
                headers:{
                    'Content-Type':'application/json',
                    'Authorization':`Bearer ${token}`
                },
                body:JSON.stringify({is_completed:true})
            });
            if(!response.ok) throw new Error('Failed to update task.');
            fetchTasks();
            }catch(error){
                alert(error.message);
            }
    };

    const deleteTask = async (taskId) => {
        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to delete task.');
            fetchTasks(); // Refresh the list
        } catch (error) {
            alert(error.message);
        }
    };

    
    const fetchTasks = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/tasks/`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Could not fetch tasks.');
            const tasks = await response.json();
            renderTasks(tasks);

            const taskList=document.getElementById('task-list');
            if(taskList){
                taskList.removeEventListener('click',handleTaskAction);
                taskList.addEventListener('click',handleTaskAction)
            } 
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
            const priorityColors = {
                'High': 'bg-red-100 text-red-800',
                'Medium': 'bg-yellow-100 text-yellow-800',
                'Low': 'bg-green-100 text-green-800'
            };

            const taskCard = `
                <div class="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between ${task.is_completed ? 'opacity-50' : ''}">
                    <div>
                        <div class="flex justify-between items-start">
                            <h5 class="text-lg font-bold text-gray-900 mb-2">${task.title}</h5>
                            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}">
                                ${task.priority}
                            </span>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">${task.description || ''}</p>
                    </div>
                    <div class="border-t pt-4 mt-4 flex justify-between items-center">
                        <p class="text-sm text-gray-500">Due: ${task.due_date}</p>
                        <div>
                            <button class="text-xs bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded-full disabled:opacity-50" data-action="complete" data-id="${task.id}" ${task.is_completed ? 'disabled' : ''}>
                                Done
                            </button>
                            <button class="text-xs bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-full" data-action="delete" data-id="${task.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
            taskList.innerHTML += taskCard;
        });
    };

    logoutButton.addEventListener('click', () => {
        localStorage.clear();
        logoutButton.classList.add('hidden', 'd-none');
        loadView('login');
    });

    const token = localStorage.getItem('accessToken');
    if (token) {
        logoutButton.classList.remove('hidden', 'd-none');
        loadView('dashboard');
    } else {
        loadView('login');
    }
});