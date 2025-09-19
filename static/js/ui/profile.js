
export const updateUserProfileUI = () => {
    const username = localStorage.getItem('username');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userGreeting = document.getElementById('user-greeting');
    if (username) {
        const initials = username.charAt(0).toUpperCase();
        if (userAvatar) userAvatar.textContent = initials;
        if (userName) userName.textContent = username;
        if(userGreeting) userGreeting.textContent = username;
    }
};

export const toggleProfileDropdown = () => {
    const dropdown = document.getElementById('profile-dropdown');
    const arrow = document.getElementById('dropdown-arrow');
    if (dropdown && arrow) {
        const isVisible = !dropdown.classList.contains('opacity-0');
        if (isVisible) {
            dropdown.classList.add('opacity-0', 'invisible', 'scale-95', 'translate-y-2');
            dropdown.classList.remove('scale-100', 'translate-y-0');
            arrow.style.transform = 'rotate(0deg)';
        } else {
            dropdown.classList.remove('opacity-0', 'invisible', 'scale-95', 'translate-y-2');
            dropdown.classList.add('scale-100', 'translate-y-0');
            arrow.style.transform = 'rotate(180deg)';
        }
    }
};

export const closeProfileDropdown = () => {
    const dropdown = document.getElementById('profile-dropdown');
    const arrow = document.getElementById('dropdown-arrow');
    if (dropdown && arrow) {
        dropdown.classList.add('opacity-0', 'invisible', 'scale-95', 'translate-y-2');
        dropdown.classList.remove('scale-100', 'translate-y-0');
        arrow.style.transform = 'rotate(0deg)';
    }
};


