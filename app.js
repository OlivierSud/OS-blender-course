document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.getElementById('pdf-viewer');
    const emptyState = document.getElementById('empty-state');
    const pdfContainer = document.getElementById('pdf-container');
    const courseListContainer = document.getElementById('course-list');

    // Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const sidebarCloseBtn = document.getElementById('sidebar-close');
    const sidebarOpenBtn = document.getElementById('sidebar-open');

    if (sidebarCloseBtn && sidebarOpenBtn && sidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.classList.add('closed');
            sidebarOpenBtn.classList.add('visible');
        });

        sidebarOpenBtn.addEventListener('click', () => {
            sidebar.classList.remove('closed');
            sidebarOpenBtn.classList.remove('visible');
        });
    }

    // Function to render the menu recursively
    function renderMenu(items, container) {
        if (!items || items.length === 0) return;

        items.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('course-item');

            if (item.type === 'folder') {
                // Folder logic
                const folderHeader = document.createElement('div');
                folderHeader.classList.add('folder-header');

                // Icon and Name
                folderHeader.innerHTML = `
                    <span class="folder-icon">▶</span>
                    <span class="folder-name">${item.name}</span>
                `;

                // Submenu container (hidden by default)
                const submenu = document.createElement('ul');
                submenu.classList.add('submenu');
                submenu.style.display = 'none'; // Initially collapsed

                // Toggle click
                folderHeader.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent bubbling
                    const isExpanded = submenu.style.display === 'block';
                    submenu.style.display = isExpanded ? 'none' : 'block';
                    folderHeader.classList.toggle('open', !isExpanded);
                });

                li.appendChild(folderHeader);
                li.appendChild(submenu);
                container.appendChild(li);

                // Recursively render children
                renderMenu(item.children, submenu);

            } else if (item.type === 'file') {
                // File link logic
                const link = document.createElement('a');
                link.href = '#'; // Prevent default nav
                link.classList.add('course-link');
                link.setAttribute('data-src', item.path);
                link.textContent = item.name.replace('.pdf', ''); // Remove extension for cleaner look

                link.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Visual active state handling
                    document.querySelectorAll('.course-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Load PDF
                    const pdfPath = link.getAttribute('data-src');
                    if (pdfPath) {
                        viewer.src = pdfPath;
                        emptyState.style.display = 'none';
                        pdfContainer.style.display = 'block';
                    }
                });

                li.appendChild(link);
                container.appendChild(li);
            }
        });
    }

    // Initialize Menu - Wait for Login
    document.addEventListener('login-success', () => {
        if (window.COURSE_DATA) {
            console.log("Course Data Loaded. Generated at:", window.COURSE_DATA.generatedAt);

            // Render Courses
            const courseData = window.COURSE_DATA.courses || window.COURSE_DATA; // Fallback for old format
            courseListContainer.innerHTML = '';
            renderMenu(courseData, courseListContainer);

            // Render Tips
            const tipsListContainer = document.getElementById('tips-list');
            if (window.COURSE_DATA.tips && tipsListContainer) {
                tipsListContainer.innerHTML = '';
                renderMenu(window.COURSE_DATA.tips, tipsListContainer);
            }
        } else {
            courseListContainer.innerHTML = '<li style="padding:1rem; color:red;">Erreur: Données introuvables. Lancez scan_courses.py</li>';
        }
    });
});
