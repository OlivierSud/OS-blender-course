document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('login-overlay');
    const classSelection = document.getElementById('class-selection');
    const passwordSection = document.getElementById('password-section');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const backButton = document.getElementById('back-button');
    const errorMessage = document.getElementById('login-error');
    const selectedClassLabel = document.getElementById('selected-class-label');
    const loginTitle = document.getElementById('login-title');
    const loginSubtitle = document.getElementById('login-subtitle');

    // Password configuration for each class
    const CLASS_PASSWORDS = {
        '3D1': '3D1',
        '3D2': '3D2',
        'DA3': 'DA3',
        'Prof': 'Prof'
    };

    let selectedClass = null;

    // Check if user is already logged in for this session
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const savedGroup = sessionStorage.getItem('selectedGroup');
        overlay.style.display = 'none';
        document.dispatchEvent(new CustomEvent('login-success', { detail: { group: savedGroup } }));
    } else {
        overlay.style.display = 'flex';
        initializeClassButtons();
    }

    function initializeClassButtons() {
        // Wait for courses_data.js to load
        const checkData = setInterval(() => {
            if (window.COURSE_DATA && window.COURSE_DATA.courses) {
                clearInterval(checkData);
                generateClassButtons();
            }
        }, 100);
    }

    function generateClassButtons() {
        classSelection.innerHTML = '';

        // Get all course folders
        const courseFolders = window.COURSE_DATA.courses.filter(item => item.type === 'folder');

        courseFolders.forEach(folder => {
            const button = document.createElement('button');
            button.className = 'class-button';
            button.textContent = folder.name;
            button.addEventListener('click', () => selectClass(folder.name));
            classSelection.appendChild(button);
        });

        // Add "Prof" button
        const profButton = document.createElement('button');
        profButton.className = 'class-button prof-button';
        profButton.textContent = 'Professeur';
        profButton.addEventListener('click', () => selectClass('Prof'));
        classSelection.appendChild(profButton);
    }

    function selectClass(className) {
        selectedClass = className;

        // Hide class selection, show password input
        classSelection.style.display = 'none';
        passwordSection.style.display = 'block';

        // Update UI text
        loginTitle.textContent = 'Authentification';
        loginSubtitle.textContent = 'Entrez le mot de passe pour accéder aux cours.';
        selectedClassLabel.textContent = `Classe : ${className}`;

        // Focus password input
        passwordInput.value = '';
        passwordInput.focus();
        errorMessage.style.display = 'none';
    }

    function attemptLogin() {
        const input = passwordInput.value;
        const correctPassword = CLASS_PASSWORDS[selectedClass];

        if (input === correctPassword) {
            // Store login state
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('selectedGroup', selectedClass);

            // Fade out overlay
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.dispatchEvent(new CustomEvent('login-success', { detail: { group: selectedClass } }));
            }, 500);
        } else {
            errorMessage.textContent = 'Mot de passe incorrect';
            errorMessage.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function goBack() {
        // Show class selection, hide password input
        passwordSection.style.display = 'none';
        classSelection.style.display = 'grid';

        // Reset UI text
        loginTitle.textContent = 'Sélectionnez votre classe';
        loginSubtitle.textContent = 'Choisissez votre classe pour accéder aux cours.';

        // Clear state
        selectedClass = null;
        passwordInput.value = '';
        errorMessage.style.display = 'none';
    }

    // Event listeners
    loginButton.addEventListener('click', attemptLogin);
    backButton.addEventListener('click', goBack);

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });

    // Switch Class Button Handler
    const switchClassBtn = document.getElementById('switch-class-btn');
    if (switchClassBtn) {
        switchClassBtn.addEventListener('click', () => {
            // Clear session storage
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('selectedGroup');

            // Reload page to show login screen
            window.location.reload();
        });
    }
});
