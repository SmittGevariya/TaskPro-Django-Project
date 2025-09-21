
import { API_URL } from './api.js';
import { fetchAndCacheUserProfile } from './auth.js';
import { showToast } from '../ui/toast.js';
import { showFieldError, hideFieldError, validateEmail } from './validation.js';

export const createHandleLogin = (navigateTo, authFetch) => async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    hideFieldError('username');
    hideFieldError('password');

    if (!data.username) { showFieldError('username', 'Username is required'); return; }
    if (!data.password) { showFieldError('password', 'Password is required'); return; }

    try {
        const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        const responseData = await response.json();
        if (!response.ok) {
            if (response.status === 401) showFieldError('password', 'Invalid username or password');
            else throw new Error(responseData.detail || 'Failed to login.');
            return;
        }
        localStorage.setItem('accessToken', responseData.access);
        localStorage.setItem('refreshToken', responseData.refresh);
        await fetchAndCacheUserProfile(authFetch);
        showToast('Login successful! Welcome back.');
        navigateTo('/tasks');
    } catch (error) {
        showToast(error.message, 'error');
    }
};

export const createHandleRegister = (navigateTo) => async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    hideFieldError('register-username');
    hideFieldError('register-email');
    hideFieldError('register-password');
    hideFieldError('register-confirm-password');

    let hasErrors = false;
    if (!data.username) { showFieldError('register-username', 'Username is required'); hasErrors = true; }
    else if (data.username.length < 3) { showFieldError('register-username', 'Username must be at least 3 characters'); hasErrors = true; }
    if (!data.email) { showFieldError('register-email', 'Email is required'); hasErrors = true; }
    else if (!validateEmail(data.email)) { showFieldError('register-email', 'Please enter a valid email address'); hasErrors = true; }
    if (!data.password) { showFieldError('register-password', 'Password is required'); hasErrors = true; }
    else if (data.password.length < 8) { showFieldError('register-password', 'Password must be at least 8 characters'); hasErrors = true; }
    if (!data.confirm_password) { showFieldError('register-confirm-password', 'Please confirm your password'); hasErrors = true; }
    else if (data.password !== data.confirm_password) { showFieldError('register-confirm-password', 'Passwords do not match'); hasErrors = true; }
    if (hasErrors) return;

    try {
        const response = await fetch(`${API_URL}/auth/register/`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        const responseData = await response.json();
        if (!response.ok) {
            if (responseData.username) showFieldError('register-username', responseData.username.join(', '));
            if (responseData.email) showFieldError('register-email', responseData.email.join(', '));
            if (responseData.password) showFieldError('register-password', responseData.password.join(', '));
            if (!responseData.username && !responseData.email && !responseData.password) {
                const errorMessage = Object.entries(responseData).map(([f, msgs]) => `${f}: ${msgs.join(', ')}`).join(' | ');
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


