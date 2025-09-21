
export const showToast = (message, type = 'success') => {
    const colors = {
        success: 'linear-gradient(to right, #00b09b, #96c93d)',
        error: 'linear-gradient(to right, #ff5f6d, #ffc371)'
    };
    
    const showToastNotification = () => {
        if (typeof Toastify !== 'undefined') {
            try {
                Toastify({
                    text: message,
                    duration: 3000,
                    close: true,
                    gravity: 'top',
                    position: 'right',
                    stopOnFocus: true,
                    style: { background: colors[type] || colors.success }
                }).showToast();
            } catch (error) {
                console.error('Error showing toast:', error);
            }
        } else if (typeof window.Toastify !== 'undefined') {
            try {
                window.Toastify({
                    text: message,
                    duration: 3000,
                    close: true,
                    gravity: 'top',
                    position: 'right',
                    stopOnFocus: true,
                    style: { background: colors[type] || colors.success }
                }).showToast();
            } catch (error) {
                console.error('Error showing toast:', error);
            }
        } else {
            setTimeout(showToastNotification, 100);
        }
    };
    
    showToastNotification();
};


