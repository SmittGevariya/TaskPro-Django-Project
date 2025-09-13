document.addEventListener('DOMContentLoaded',()=>{
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');

    const API_URL = 'http://127.0.0.1:8000/api';

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('d-none');
        registerView.classList.remove('d-none');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.classList.add('d-none');
        loginView.classList.remove('d-none');
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.classList.add('d-none');

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_URL}/auth/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Format error message from backend
                const errorMessage = Object.entries(errorData).map(([field, messages]) => 
                    `${field}: ${messages.join(', ')}`
                ).join('\n');
                throw new Error(errorMessage);
            }

            // If registration is successful, switch to login view
            alert('Registration successful! Please log in.');
            registerView.classList.add('d-none');
            loginView.classList.remove('d-none');
            registerForm.reset();

        } catch (error) {
            registerError.textContent = error.message;
            registerError.classList.remove('d-none');
        }
    });

    loginForm.addEventListener('submit',(e)=>{
        e.preventDefault();
        alert("Login functionality coming soon!")
    })
})