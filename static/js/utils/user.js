
import { API_URL, authFetch } from './api.js';
import { showToast } from '../ui/toast.js';
import { updateUserProfileUI } from '../ui/profile.js';

export const fetchProfileAndPopulate = async (navigateTo) => {
    const token = localStorage.getItem('accessToken');
    if (!token) { return navigateTo('/login'); }
    try {
        const response = await authFetch(`${API_URL}/auth/profile/`, { headers: { 'Content-Type': 'application/json' } });
        if (response.status === 401 || response.status === 403) { return navigateTo('/login'); }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Invalid response from server');
        const data = await response.json();
        document.getElementById('profile-username')?.setAttribute('value', data.username || '');
        document.getElementById('profile-first-name')?.setAttribute('value', data.first_name || '');
        document.getElementById('profile-last-name')?.setAttribute('value', data.last_name || '');
        document.getElementById('profile-email')?.setAttribute('value', data.email || '');
    } catch (error) { showToast(error.message, 'error'); }
};

export const handleProfileSubmit = (navigateTo) => async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) { return navigateTo('/login'); }
    const form = e.target;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
        const response = await authFetch(`${API_URL}/auth/profile/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.status === 401 || response.status === 403) { return navigateTo('/login'); }
        const data = await response.json();
        if (!response.ok) { const errors = Object.values(data).flat().join(' '); throw new Error(errors || 'Failed to update profile'); }
        if (data?.username) { localStorage.setItem('username', data.username); updateUserProfileUI(); }
        showToast('Profile updated successfully!');
        setTimeout(() => { navigateTo('/tasks'); }, 1000);
    } catch (error) { showToast(error.message, 'error'); }
};


