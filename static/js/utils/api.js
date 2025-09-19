
import { refreshAccessToken, forceLogout } from './auth.js';
import { showToast } from '../ui/toast.js';

export const API_URL = 'http://127.0.0.1:8000/api';

let isRefreshing = false;

export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    try {
        const response = await fetch(url, options);

        if ((response.status === 401 || response.status === 403) && localStorage.getItem('refreshToken') && !isRefreshing) {
            isRefreshing = true;
            try {
                await refreshAccessToken();
                const newToken = localStorage.getItem('accessToken');
                const retryOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${newToken}`
                    }
                };
                const retryResponse = await fetch(url, retryOptions);
                isRefreshing = false;
                return retryResponse;
            } catch (err) {
                isRefreshing = false;
                forceLogout();
                return response;
            }
        }

        return response;
    } catch (error) {
        console.error('Auth fetch error:', error);
        showToast('Network error. Please try again.', 'error');
        throw error;
    }
};


