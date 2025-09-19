
import { API_URL } from './api.js';
import { showToast } from '../ui/toast.js';

export const forceLogout = () => {
    localStorage.clear();
    // UI elements are hidden by app.js based on token state
    window.history.pushState(null, null, '/login');
    window.dispatchEvent(new PopStateEvent('popstate')); 
    showToast('Your session has expired.', 'error');
};

export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await fetch(`${API_URL}/auth/login/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken })
    });
    if (!response.ok) throw new Error('Failed to refresh token');
    const data = await response.json();
    localStorage.setItem('accessToken', data.access);
    if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
    return data.access;
};

export const fetchAndCacheUserProfile = async (authFetch) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
        const response = await authFetch(`${API_URL}/auth/me/`);
        if (!response.ok) return null;
        const profile = await response.json();
        if (profile?.username) localStorage.setItem('username', profile.username);
        return profile;
    } catch (e) {
        return null;
    }
};


