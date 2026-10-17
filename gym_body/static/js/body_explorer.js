/**
 * Gym Freak - Interactive Controller
 * Handles 3D Video Modal, Instagram Reels, Sub-Category Form Filters & AJAX Add
 */

document.addEventListener('DOMContentLoaded', () => {
    // Modal & Drawer Elements
    const videoModalEl = document.getElementById('videoDrawerModal');
    const videoModal = new bootstrap.Modal(videoModalEl);
    let lockedCount = 0;
    const drawerMuscleName = document.getElementById('drawerMuscleName');
    const drawerFilterTabs = document.getElementById('drawerFilterTabs');
    const drawerVideosContainer = document.getElementById('drawerVideosContainer');

    // Inline Add Form Elements
    const btnToggleAddForm = document.getElementById('btnToggleAddForm');
    const inlineAddForm = document.getElementById('inlineAddForm');
    const inlineMuscleLabel = document.getElementById('inlineMuscleLabel');
    const ajaxAddVideoForm = document.getElementById('ajaxAddVideoForm');
    const btnCancelAdd = document.getElementById('btnCancelAdd');
    const newVideoSub = document.getElementById('newVideoSub');
    const newVideoTitle = document.getElementById('newVideoTitle');
    const newVideoUrl = document.getElementById('newVideoUrl');

    // Spotlight Elements
    const searchTriggerBtn = document.getElementById('searchTriggerBtn');
    const spotlightOverlay = document.getElementById('spotlightOverlay');
    const spotlightInput = document.getElementById('spotlightInput');
    const spotlightResults = document.getElementById('spotlightResults');

    // State
    let activeMuscle = '';
    let currentVideos = [];
    let activeFilter = 'All';
    let muscleCounts = window.INITIAL_MUSCLE_COUNTS || {};

    // ----------------------------------------------------
    // 1. Open Modal & Load Videos for Selected Muscle
    // ----------------------------------------------------
    window.openMuscleVideos = function(muscleName) {
        activeMuscle = muscleName;
        activeFilter = 'All';
        drawerMuscleName.innerText = muscleName.toUpperCase();
        inlineMuscleLabel.innerText = muscleName;

        // Reset inline add form
        inlineAddForm.classList.remove('is-open');
        ajaxAddVideoForm.reset();

        drawerFilterTabs.innerHTML = '';
        drawerVideosContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-info" role="status"></div>
                <p class="text-secondary small mt-3">Loading ${escapeHtml(muscleName)} exercise forms & reels...</p>
            </div>
        `;
        videoModal.show();

        fetch(`/api/videos?muscle=${encodeURIComponent(muscleName)}`)
            .then(res => {
                lockedCount = parseInt(res.headers.get('X-Locked-Count') || '0', 10) || 0;
                return res.json();
            })
            .then(videos => {
                currentVideos = videos || [];
                buildFilterTabs();
                renderFilteredVideos();
            })
            .catch(err => {
                console.error(err);
                drawerVideosContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load exercise videos. Please check your connection.
                    </div>
                `;
            });
    };

    // ----------------------------------------------------
    // 2. Build Form / Variation Filter Tabs (Upper, Incline, etc.)
    // ----------------------------------------------------
    function buildFilterTabs() {
        const categories = new Set();
        currentVideos.forEach(v => {
            if (v.sub_category && v.sub_category.trim()) {
                categories.add(v.sub_category.trim());
            }
        });

        // Check if there are Instagram Reels
        const hasReels = currentVideos.some(v => v.platform === 'instagram');

        let html = `<button class="filter-tab-pill active" data-filter="All">All (${currentVideos.length})</button>`;
        categories.forEach(cat => {
            const count = currentVideos.filter(v => v.sub_category === cat).length;
            html += `<button class="filter-tab-pill" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)} (${count})</button>`;
        });

        if (hasReels) {
            const reelCount = currentVideos.filter(v => v.platform === 'instagram').length;
            html += `<button class="filter-tab-pill text-pink" data-filter="__REELS__"><i class="bi bi-instagram me-1"></i>Reels (${reelCount})</button>`;
        }

        drawerFilterTabs.innerHTML = html;

        drawerFilterTabs.querySelectorAll('.filter-tab-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                drawerFilterTabs.querySelectorAll('.filter-tab-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.getAttribute('data-filter');
                renderFilteredVideos();
            });
        });
    }

    // ----------------------------------------------------
    // 3. Render Video Cards (Supporting YouTube & Instagram Reels)
    // ----------------------------------------------------
    function renderFilteredVideos() {
        let filtered = currentVideos;
        if (activeFilter === '__REELS__') {
            filtered = currentVideos.filter(v => v.platform === 'instagram');
        } else if (activeFilter !== 'All') {
            filtered = currentVideos.filter(v => v.sub_category === activeFilter);
        }

        if (!filtered || filtered.length === 0) {
            drawerVideosContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-camera-video text-muted" style="font-size: 2.5rem;"></i>
                    <h6 class="text-white mt-3">No exercises found for this specific form</h6>
                    <p class="text-secondary small">Click "+ Add Exercise / Reel" above to add one!</p>
                </div>
            `;
            return;
        }

        let html = '<div class="video-grid-modal">';
        filtered.forEach(v => {
            const isInsta = v.platform === 'instagram';
            
            html += `
                <div class="video-card-item ${isInsta ? 'card-instagram' : ''}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0 text-white">${escapeHtml(v.title)}</h6>
                        ${isInsta 
                            ? '<span class="badge bg-danger text-white"><i class="bi bi-instagram me-1"></i>Reel</span>' 
                            : '<span class="badge bg-dark border border-secondary text-info">YouTube</span>'}
                    </div>

                    ${v.sub_category ? `<div class="small text-info mb-2"><i class="bi bi-tag-fill me-1"></i>${escapeHtml(v.sub_category)}</div>` : ''}

                    <div class="video-thumb ${isInsta ? 'thumb-insta' : ''}" data-url="${escapeHtml(v.url)}" data-insta="${isInsta ? 1 : 0}" data-title="${escapeHtml(v.title)}" role="button">
                        ${isInsta
                            ? '<i class="bi bi-instagram thumb-icon"></i>'
                            : `<img src="https://i.ytimg.com/vi/${ytId(v.url)}/hqdefault.jpg" alt="" loading="lazy">`}
                        <span class="thumb-play"><i class="bi bi-play-fill"></i></span>
                    </div>

                    <div class="mt-auto d-flex justify-content-between align-items-center text-muted small pt-1">
                        <span><i class="bi bi-calendar3 me-1"></i>${escapeHtml(v.added_at)}</span>

                    </div>
                </div>
            `;
        });
        html += '</div>';
        if (lockedCount > 0) {
            html += `<a href="/premium" class="d-block text-center mt-3 p-3 rounded text-decoration-none" style="border:1px dashed #00f2fe;color:#00f2fe">
                <i class="bi bi-lock-fill me-1"></i>${lockedCount} more video${lockedCount > 1 ? 's' : ''} for premium members &mdash; Unlock</a>`;
        }
        drawerVideosContainer.innerHTML = html;
    }

    // ----------------------------------------------------
    // 4. Inline Add Video / Reel (Tucked Inside Muscle Part)
    // ----------------------------------------------------
    if (btnToggleAddForm) {
        btnToggleAddForm.addEventListener('click', () => {
            inlineAddForm.classList.toggle('is-open');
            if (inlineAddForm.classList.contains('is-open')) {
                newVideoTitle.focus();
            }
        });
    }

    if (btnCancelAdd) {
        btnCancelAdd.addEventListener('click', () => {
            inlineAddForm.classList.remove('is-open');
        });
    }

    if (ajaxAddVideoForm) {
        ajaxAddVideoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = newVideoTitle.value.trim();
            const sub = newVideoSub.value.trim();
            const url = newVideoUrl.value.trim();

            if (!title || !url) return;

            const saveBtn = document.getElementById('btnSaveVideo');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

            fetch('/api/add-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    muscle: activeMuscle,
                    sub_category: sub,
                    title: title,
                    url: url
                })
            })
            .then(res => res.json())
            .then(data => {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i> Save Exercise';

                if (data.success) {
                    // Update count
                    muscleCounts[activeMuscle] = (muscleCounts[activeMuscle] || 0) + 1;
                    
                    // Add to local list & re-render
                    currentVideos.unshift(data.video);
                    inlineAddForm.classList.remove('is-open');
                    ajaxAddVideoForm.reset();

                    buildFilterTabs();
                    renderFilteredVideos();
                } else {
                    alert(data.error || 'Failed to save video.');
                }
            })
            .catch(err => {
                console.error(err);
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i> Save Exercise';
                alert('Network error while saving video.');
            });
        });
    }

    // ----------------------------------------------------
    // 5. Minimal Spotlight Command Palette Search
    // ----------------------------------------------------
    const allMusclesList = [
        "Upper Chest", "Chest", "Front Delts", "Side Delts", "Rear Delts",
        "Biceps", "Triceps", "Forearms", "Upper Abs", "Lower Abs", "Obliques",
        "Lats", "Upper Back", "Lower Back", "Quads", "Hamstrings", "Glutes", "Calves", "Traps"
    ];

    function openSpotlight() {
        spotlightOverlay.classList.add('is-visible');
        spotlightInput.value = '';
        renderSpotlightItems('');
        setTimeout(() => spotlightInput.focus(), 50);
    }

    function closeSpotlight() {
        spotlightOverlay.classList.remove('is-visible');
    }

    function renderSpotlightItems(query) {
        const q = query.toLowerCase().trim();
        const filtered = allMusclesList.filter(m => m.toLowerCase().includes(q));

        if (filtered.length === 0) {
            spotlightResults.innerHTML = `
                <div class="p-3 text-center text-muted small">No muscles found matching "${escapeHtml(query)}"</div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(m => {
            const count = muscleCounts[m] || 0;
            html += `
                <div class="spotlight-item" data-muscle="${m}">
                    <span class="d-flex align-items-center gap-2">
                        <i class="bi bi-activity text-info"></i>
                        <span class="fw-semibold">${m}</span>
                    </span>
                    <span class="badge bg-dark border border-secondary text-info">${count} Workouts</span>
                </div>
            `;
        });
        spotlightResults.innerHTML = html;

        spotlightResults.querySelectorAll('.spotlight-item').forEach(item => {
            item.addEventListener('click', () => {
                const muscle = item.getAttribute('data-muscle');
                closeSpotlight();
                openMuscleVideos(muscle);
            });
        });
    }

    if (searchTriggerBtn) {
        searchTriggerBtn.addEventListener('click', openSpotlight);
    }

    if (spotlightOverlay) {
        spotlightOverlay.addEventListener('click', (e) => {
            if (e.target === spotlightOverlay) closeSpotlight();
        });
    }

    if (spotlightInput) {
        spotlightInput.addEventListener('input', (e) => {
            renderSpotlightItems(e.target.value);
        });

        spotlightInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSpotlight();
            } else if (e.key === 'Enter') {
                const first = spotlightResults.querySelector('.spotlight-item');
                if (first) first.click();
            }
        });
    }

    // Keyboard shortcut: Ctrl+K or Cmd+K
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            openSpotlight();
        }
    });


    // ----------------------------------------------------
    // Floating in-site video player
    // ----------------------------------------------------
    function ytId(url) {
        const m = (url || '').match(/embed\/([a-zA-Z0-9_-]+)/);
        return m ? m[1] : '';
    }

    function openFloatingPlayer(url, isInsta, title) {
        closeFloatingPlayer();
        const src = isInsta
            ? url
            : url.replace('www.youtube.com', 'www.youtube-nocookie.com').split('?')[0] +
              '?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1';
        const box = document.createElement('div');
        box.id = 'floatPlayer';
        box.className = 'float-player-backdrop';
        box.innerHTML = `
            <div class="float-player ${isInsta ? 'is-insta' : ''}">
                <div class="float-player-bar">
                    <span>${escapeHtml(title || '')}</span>
                    <button type="button" class="float-player-close" aria-label="Close">&times;</button>
                </div>
                ${isInsta ? '<div class="ig-clip">' : ''}<iframe src="${src}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowfullscreen frameborder="0" scrolling="no"></iframe>${isInsta ? '</div>' : ''}
            </div>`;
        box.addEventListener('click', (e) => {
            if (e.target === box || e.target.closest('.float-player-close')) closeFloatingPlayer();
        });
        document.body.appendChild(box);
    }

    function closeFloatingPlayer() {
        const el = document.getElementById('floatPlayer');
        if (el) el.remove();
    }

    drawerVideosContainer.addEventListener('click', (e) => {
        const t = e.target.closest('.video-thumb');
        if (!t) return;
        openFloatingPlayer(t.dataset.url, t.dataset.insta === '1', t.dataset.title);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeFloatingPlayer();
    });

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }
});