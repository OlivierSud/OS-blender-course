document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('login-overlay');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('login-error');

    // Hardcoded simple password
    // To change it, replace 'OS2026' with your desired password
    const CORRECT_PASSWORD = '0000';

    // Check if user is already logged in for this session
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        overlay.style.display = 'none';
        document.dispatchEvent(new Event('login-success'));
    } else {
        overlay.style.display = 'flex';
    }

    function attemptLogin() {
        const input = passwordInput.value;
        if (input === CORRECT_PASSWORD) {
            sessionStorage.setItem('isLoggedIn', 'true');
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.dispatchEvent(new Event('login-success'));
            }, 500); // Wait for transition
        } else {
            errorMessage.textContent = 'Mot de passe incorrect';
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    loginButton.addEventListener('click', attemptLogin);

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
});
