document.addEventListener('DOMContentLoaded',()=>{
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const dashboardView = document.getElementById('dashboard-view');
    const userGreeting = document.getElementById('user-greeting');
    const logoutButton = document.getElementById('logout-button');

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

    loginForm.addEventListener('submit',async(e)=>{
        e.preventDefault();
        loginError.classList.add('d-none'); 

        const formData=new FormData(loginForm);
        const data=Object.fromEntries(formData.entries());

        try{
            const response=await fetch(`${API_URL}/auth/login/`,{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(data),
            });

            if (!response.ok){
                const errorData=await response.json();
                throw new Error(errorData.detail || 'Failed to login.');
            }

            const tokens=await response.json();

            localStorage.setItem('accessToken',tokens.access);
            localStorage.setItem('refreshToken',tokens.refresh);

            showDashboard();
        }catch(error){
            loginError.textContent=error.message;
            loginError.classList.remove('d-none');
        }
    });

    logoutButton.addEventListener('click',()=>{
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        dashboardView.classList.add('d-none');
        logoutButton.classList.add('d-none');
        loginView.classList.remove('d-none');
    });

    function showDashboard(){
        loginView.classList.add('d-none');
        registerView.classList.add('d-none');
        dashboardView.classList.remove('d-none');
        logoutButton.classList.remove('d-none');

        const token=localStorage.getItem('accessToken');
        if(token){
            const payload=JSON.parse(atob(token.split('.')[1]));
            userGreeting.textContent=payload.username;
        }
    }
})