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

        const wrapper = document.getElementById('pdf-canvas-wrapper');
        const containerWidth = wrapper.clientWidth - 20; // Some margin

        const unscaledViewport = page.getViewport({ scale: 1 });
        const fitScale = containerWidth / unscaledViewport.width;

        // Render at 2x the fit scale for high resolution
        const viewport = page.getViewport({ scale: fitScale * 2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Visual display size (CSS)
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = 'auto'; // Maintain aspect ratio

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

    // Swipe Navigation for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    const mobilePdfContainer = document.getElementById('mobile-pdf-container');
    if (mobilePdfContainer) {
        mobilePdfContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        mobilePdfContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const threshold = 50; // Minimum swipe distance
        const delta = touchEndX - touchStartX;

        if (Math.abs(delta) > threshold) {
            if (delta < 0) {
                // Swipe Left -> Next Page
                if (pdfDoc && pageNum < pdfDoc.numPages) {
                    pageNum++;
                    queueRenderPage(pageNum);
                }
            } else {
                // Swipe Right -> Previous Page
                if (pdfDoc && pageNum > 1) {
                    pageNum--;
                    queueRenderPage(pageNum);
                }
            }
        }
    }

    // Controls for Mobile Viewer
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (!pdfDoc || pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    // Initialize Menu - Wait for Login
    document.addEventListener('login-success', () => {
        if (window.COURSE_DATA) {
            console.log("Course Data Loaded. Generated at:", window.COURSE_DATA.generatedAt);

            // Handle Data Structure (Object for years, or fallback Array for legacy)
            let rawCourses = window.COURSE_DATA.courses || window.COURSE_DATA;
            let courseData = [];

            // Handle Group filtering - prioritize sessionStorage (from login), then URL parameters
            let groupName = sessionStorage.getItem('selectedGroup');
            if (!groupName) {
                const urlParams = new URLSearchParams(window.location.search);
                groupName = urlParams.get('group');
            }

            if (groupName === 'Prof') {
                // PROF MODE: Show everything, grouped by year folders
                const brandSubtitle = document.querySelector('.brand-subtitle');
                if (brandSubtitle) brandSubtitle.textContent = 'Mode Professeur - Archives Complètes';

                if (typeof rawCourses === 'object' && !Array.isArray(rawCourses)) {
                    // Convert years object to folder structure
                    const years = Object.keys(rawCourses).sort((a, b) => b - a); // Newest first
                    courseData = years.map(year => ({
                        type: 'folder',
                        name: `Année ${year}`,
                        children: rawCourses[year],
                        visibility: true
                    }));
                } else {
                    courseData = rawCourses; // Legacy fallback
                }
            } else if (groupName) {
                // STUDENT MODE: Show only latest year for specific class
                if (typeof rawCourses === 'object' && !Array.isArray(rawCourses)) {
                    const sortedYears = Object.keys(rawCourses).sort((a, b) => b - a);
                    if (sortedYears.length > 0) {
                        const latestYear = sortedYears[0];
                        const brandSubtitle = document.querySelector('.brand-subtitle');
                        if (brandSubtitle) brandSubtitle.textContent = `Cours ${groupName} - ${latestYear}`;

                        const groupFolder = rawCourses[latestYear].find(item => item.name === groupName && item.type === 'folder');
                        if (groupFolder) {
                            courseData = groupFolder.children;
                        } else {
                            console.warn(`Classe "${groupName}" non trouvée en ${latestYear}`);
                        }
                    }
                } else {
                    // Legacy fallback filtering
                    const groupFolder = rawCourses.find(item => item.name === groupName && item.type === 'folder');
                    if (groupFolder) courseData = groupFolder.children;
                }
            } else {
                courseData = Array.isArray(rawCourses) ? rawCourses : [];
            }

            // Centralized click handling
            const handleLinkClick = (link, e) => {
                const pdfPath = link.getAttribute('data-src');
                if (!pdfPath) return;

                // Visual active state handling
                document.querySelectorAll('.course-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Load content
                if (isMobile() && pdfPath.toLowerCase().endsWith('.pdf')) {
                    // Use PDF.js for mobile PDFs
                    loadPDFMobile(pdfPath);
                } else {
                    // Use standard iframe for everything else (desktop, or mobile non-PDF)
                    viewer.src = pdfPath;
                    emptyState.style.display = 'none';
                    pdfContainer.style.display = 'block';
                    document.getElementById('mobile-pdf-container').style.display = 'none';
                }
            };

            // Initialize Course Menu
            courseListContainer.innerHTML = '';
            renderMenu(courseData, courseListContainer);

            // Initialize Tips Menu
            const tipsListContainer = document.getElementById('tips-list');
            if (window.COURSE_DATA.tips && tipsListContainer) {
                tipsListContainer.innerHTML = '';
                renderMenu(window.COURSE_DATA.tips, tipsListContainer);
            }

            // Apply global listener and override renderMenu's inline logic if needed
            // Actually, let's just use the shared logic for all .course-link
            document.querySelectorAll('.course-link').forEach(link => {
                // Remove the one added in renderMenu and use our new one
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);

                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleLinkClick(newLink, e);
                });
            });

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
