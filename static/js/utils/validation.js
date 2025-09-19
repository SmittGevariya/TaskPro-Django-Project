
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const showFieldError = (fieldId, message) => {
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
};

export const hideFieldError = (fieldId) => {
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) errorDiv.classList.add('hidden');
};

export const updatePasswordStrength = () => {
    const password = document.getElementById('register-password')?.value || '';
    const strengthBars = document.querySelectorAll('#register-password-strength .h-1');
    const strengthText = document.getElementById('password-strength-text');
    if (!strengthBars.length || !strengthText) return;

    let strength = 0;
    let strengthLabel = '';
    let strengthColor = '';

    strengthBars.forEach(bar => { bar.className = 'h-1 w-full bg-gray-200 rounded-full'; });
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    for (let i = 0; i < strength; i++) {
        if (strength <= 2) { strengthBars[i].className = 'h-1 w-full bg-red-500 rounded-full'; strengthColor = 'text-red-500'; }
        else if (strength <= 3) { strengthBars[i].className = 'h-1 w-full bg-yellow-500 rounded-full'; strengthColor = 'text-yellow-500'; }
        else { strengthBars[i].className = 'h-1 w-full bg-green-500 rounded-full'; strengthColor = 'text-green-500'; }
    }

    if (password.length === 0) { strengthLabel = 'Enter a password'; strengthColor = 'text-gray-500'; }
    else if (strength <= 2) strengthLabel = 'Weak password';
    else if (strength <= 3) strengthLabel = 'Fair password';
    else strengthLabel = 'Strong password';

    strengthText.textContent = strengthLabel;
    strengthText.className = `text-xs mt-1 ${strengthColor}`;
};

export const validatePasswordConfirmation = () => {
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

export const togglePasswordVisibility = (inputId, openEyeId, closedEyeId) => {
    const input = document.getElementById(inputId);
    const openEye = document.getElementById(openEyeId);
    const closedEye = document.getElementById(closedEyeId);
    if (input && openEye && closedEye) {
        if (input.type === 'password') {
            input.type = 'text'; openEye.classList.add('hidden'); closedEye.classList.remove('hidden');
        } else {
            input.type = 'password'; openEye.classList.remove('hidden'); closedEye.classList.add('hidden');
        }
    }
};


