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
            // Check visibility (explicitly false means hidden, default true)
            if (item.visibility === false) return;

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

    // PDF.js State for Mobile
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const scale = window.devicePixelRatio || 1; // High DPI support
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    }

    async function renderPage(num) {
        pageRendering = true;
        const page = await pdfDoc.getPage(num);

        const viewport = page.getViewport({ scale: 2 }); // Render at higher scale for clarity
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Ensure canvas fits container
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        await renderTask.promise;
        pageRendering = false;
        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }

        // Update UI
        document.getElementById('page-num').textContent = num;
    }

    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    async function loadPDFMobile(path) {
        emptyState.style.display = 'none';
        pdfContainer.style.display = 'none';
        const mobileContainer = document.getElementById('mobile-pdf-container');
        mobileContainer.style.display = 'flex';

        try {
            const loadingTask = pdfjsLib.getDocument(path);
            pdfDoc = await loadingTask.promise;
            document.getElementById('page-count').textContent = pdfDoc.numPages;

            pageNum = 1;
            renderPage(pageNum);
        } catch (error) {
            console.error('Error loading PDF with PDF.js:', error);
            alert('Erreur lors du chargement du PDF sur mobile.');
        }
    }

    // Controls for Mobile Viewer
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Initialize Menu - Wait for Login
    document.addEventListener('login-success', () => {
        if (window.COURSE_DATA) {
            console.log("Course Data Loaded. Generated at:", window.COURSE_DATA.generatedAt);

            // Render Courses
            let courseData = window.COURSE_DATA.courses || window.COURSE_DATA; // Fallback for old format

            // Handle Group filtering - prioritize sessionStorage (from login), then URL parameters
            let groupName = sessionStorage.getItem('selectedGroup');

            // If no session group, check URL parameters
            if (!groupName) {
                const urlParams = new URLSearchParams(window.location.search);
                groupName = urlParams.get('group');
            }

            if (groupName) {
                // Special case for "Prof" mode - show all courses
                if (groupName === 'Prof') {
                    const brandSubtitle = document.querySelector('.brand-subtitle');
                    if (brandSubtitle) {
                        brandSubtitle.textContent = 'Mode Professeur - Tous les cours';
                    }
                    console.log('Prof mode: Showing all courses');
                } else {
                    // Find the specific folder
                    const groupFolder = courseData.find(item => item.name === groupName && item.type === 'folder');

                    if (groupFolder) {
                        // Update header/title to reflect current view
                        const brandSubtitle = document.querySelector('.brand-subtitle');
                        if (brandSubtitle) {
                            brandSubtitle.textContent = `Cours : ${groupName}`;
                        }

                        // Render ONLY the children of this group
                        courseData = groupFolder.children;
                        console.log(`Filtering view for group: ${groupName}`);
                    } else {
                        console.warn(`Group "${groupName}" not found. Showing all courses.`);
                    }
                }
            }

            courseListContainer.innerHTML = '';
            renderMenu(courseData, courseListContainer);

            // Override click behavior for mobile integration
            document.querySelectorAll('.course-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    if (isMobile()) {
                        e.stopPropagation(); // Stop the default listener (mostly for visual active state)
                        const pdfPath = link.getAttribute('data-src');
                        if (pdfPath) {
                            loadPDFMobile(pdfPath);
                        }
                    }
                });
            });

            // Render Tips
            const tipsListContainer = document.getElementById('tips-list');
            if (window.COURSE_DATA.tips && tipsListContainer) {
                tipsListContainer.innerHTML = '';
                renderMenu(window.COURSE_DATA.tips, tipsListContainer);

                // Also override tips links for mobile
                tipsListContainer.querySelectorAll('.course-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        if (isMobile()) {
                            const pdfPath = link.getAttribute('data-src');
                            if (pdfPath) loadPDFMobile(pdfPath);
                        }
                    });
                });
            }

            // Show switch class button
            const switchClassBtn = document.getElementById('switch-class-btn');
            if (switchClassBtn) {
                switchClassBtn.style.display = 'block';
            }
        } else {
            courseListContainer.innerHTML = '<li style="padding:1rem; color:red;">Erreur: Données introuvables. Lancez scan_courses.py</li>';
        }
    });
});
