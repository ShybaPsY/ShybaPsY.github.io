// ================================================
// WINDOW MANAGER MODULE
// ================================================

export const WindowManager = {
    windows: {},
    highestZIndex: 100,
    Taskbar: null,
    appCleanupHandlers: {},
    snapPreview: null,
    SNAP_THRESHOLD: 30,
    TASKBAR_HEIGHT: 48,

    setTaskbar(taskbar) {
        this.Taskbar = taskbar;
    },

    registerCleanup(appId, handler) {
        this.appCleanupHandlers[appId] = handler;
    },

    createWindow(appId, title, width, height, content, resizable = true) {
        if (this.windows[appId]) {
            this.focusWindow(appId);
            return this.windows[appId];
        }

        const windowEl = document.createElement('div');
        windowEl.className = 'app-window';
        windowEl.id = `window-${appId}`;
        windowEl.style.width = `${width}px`;
        windowEl.style.height = `${height}px`;
        windowEl.style.left = `${150 + Object.keys(this.windows).length * 30}px`;
        windowEl.style.top = `${80 + Object.keys(this.windows).length * 30}px`;
        windowEl.style.zIndex = ++this.highestZIndex;

        const resizeHandles = resizable ? `
            <div class="app-resize-handle app-resize-e" data-resize="e"></div>
            <div class="app-resize-handle app-resize-s" data-resize="s"></div>
            <div class="app-resize-handle app-resize-se" data-resize="se"></div>
        ` : '';

        windowEl.innerHTML = `
            ${resizeHandles}
            <div class="app-window-header">
                <div class="app-window-buttons">
                    <div class="app-window-btn red" data-action="close"></div>
                    <div class="app-window-btn yellow" data-action="minimize"></div>
                    <div class="app-window-btn green" data-action="maximize"></div>
                </div>
                <span class="app-window-title">${title}</span>
            </div>
            <div class="app-window-body">${content}</div>
        `;

        document.getElementById('app-windows').appendChild(windowEl);
        this.setupWindowDrag(windowEl);
        if (resizable) this.setupWindowResize(windowEl);

        // Button handlers
        windowEl.querySelector('.app-window-btn.red').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(appId);
        });
        windowEl.querySelector('.app-window-btn.yellow').addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(appId);
        });
        windowEl.querySelector('.app-window-btn.green').addEventListener('click', (e) => {
            e.stopPropagation();
            this.maximizeWindow(appId);
        });

        windowEl.addEventListener('mousedown', () => {
            this.focusWindow(appId);
        });

        this.windows[appId] = windowEl;
        this.focusWindow(appId);

        // Add to taskbar
        if (this.Taskbar) {
            this.Taskbar.addWindow(appId, title);
        }

        return windowEl;
    },

    setupWindowDrag(windowEl) {
        const header = windowEl.querySelector('.app-window-header');
        let isDragging = false;
        let offsetX = 0, offsetY = 0;
        let rafId = null;
        let currentX = 0, currentY = 0;
        let snapZone = null;

        const startDrag = (e) => {
            if (e.target.closest('.app-window-btn') || e.target.closest('.app-window-buttons')) {
                return;
            }

            // If snapped or maximized, restore first
            if (windowEl.classList.contains('maximized') ||
                windowEl.classList.contains('snapped-left') ||
                windowEl.classList.contains('snapped-right')) {
                windowEl.classList.remove('maximized', 'snapped-left', 'snapped-right');
                windowEl.style.width = windowEl.dataset.prevWidth || '400px';
                windowEl.style.height = windowEl.dataset.prevHeight || '300px';
                // Position window centered on cursor
                const newWidth = parseInt(windowEl.style.width);
                offsetX = newWidth / 2;
                offsetY = 20;
                windowEl.style.left = `${e.clientX - offsetX}px`;
                windowEl.style.top = `${e.clientY - offsetY}px`;
            } else {
                const rect = windowEl.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            }

            isDragging = true;
            header.classList.add('dragging');
            windowEl.classList.add('dragging');
        };

        const drag = (e) => {
            if (!isDragging) return;
            currentX = e.clientX - offsetX;
            currentY = e.clientY - offsetY;

            // Detect snap zones
            snapZone = this.detectSnapZone(e.clientX, e.clientY);
            this.showSnapPreview(snapZone);

            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    windowEl.style.left = `${currentX}px`;
                    windowEl.style.top = `${currentY}px`;
                    rafId = null;
                });
            }
        };

        const stopDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            header.classList.remove('dragging');
            windowEl.classList.remove('dragging');

            // Apply snap if in zone
            if (snapZone) {
                this.applySnap(windowEl, snapZone);
            }
            this.hideSnapPreview();
            snapZone = null;

            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    },

    detectSnapZone(mouseX, mouseY) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const threshold = this.SNAP_THRESHOLD;

        if (mouseY <= threshold) {
            return 'top'; // Maximize
        } else if (mouseX <= threshold) {
            return 'left'; // Left half
        } else if (mouseX >= screenW - threshold) {
            return 'right'; // Right half
        }
        return null;
    },

    showSnapPreview(zone) {
        if (!zone) {
            this.hideSnapPreview();
            return;
        }

        if (!this.snapPreview) {
            this.snapPreview = document.createElement('div');
            this.snapPreview.className = 'snap-preview';
            document.body.appendChild(this.snapPreview);
        }

        const screenW = window.innerWidth;
        const screenH = window.innerHeight - this.TASKBAR_HEIGHT;

        this.snapPreview.classList.add('visible');

        switch (zone) {
            case 'left':
                Object.assign(this.snapPreview.style, {
                    left: '0', top: '0',
                    width: `${screenW / 2}px`,
                    height: `${screenH}px`
                });
                break;
            case 'right':
                Object.assign(this.snapPreview.style, {
                    left: `${screenW / 2}px`, top: '0',
                    width: `${screenW / 2}px`,
                    height: `${screenH}px`
                });
                break;
            case 'top':
                Object.assign(this.snapPreview.style, {
                    left: '0', top: '0',
                    width: `${screenW}px`,
                    height: `${screenH}px`
                });
                break;
        }
    },

    hideSnapPreview() {
        if (this.snapPreview) {
            this.snapPreview.classList.remove('visible');
        }
    },

    applySnap(windowEl, zone) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight - this.TASKBAR_HEIGHT;

        // Save previous position for double-click restore
        windowEl.dataset.prevWidth = windowEl.style.width || `${windowEl.offsetWidth}px`;
        windowEl.dataset.prevHeight = windowEl.style.height || `${windowEl.offsetHeight}px`;
        windowEl.dataset.prevLeft = windowEl.style.left || `${windowEl.offsetLeft}px`;
        windowEl.dataset.prevTop = windowEl.style.top || `${windowEl.offsetTop}px`;

        windowEl.classList.add('snapping');

        switch (zone) {
            case 'left':
                windowEl.style.left = '0';
                windowEl.style.top = '0';
                windowEl.style.width = `${screenW / 2}px`;
                windowEl.style.height = `${screenH}px`;
                windowEl.classList.add('snapped-left');
                break;
            case 'right':
                windowEl.style.left = `${screenW / 2}px`;
                windowEl.style.top = '0';
                windowEl.style.width = `${screenW / 2}px`;
                windowEl.style.height = `${screenH}px`;
                windowEl.classList.add('snapped-right');
                break;
            case 'top':
                windowEl.style.left = '0';
                windowEl.style.top = '0';
                windowEl.style.width = `${screenW}px`;
                windowEl.style.height = `${screenH}px`;
                windowEl.classList.add('maximized');
                break;
        }

        setTimeout(() => {
            windowEl.classList.remove('snapping');
        }, 250);
    },

    setupWindowResize(windowEl) {
        const MIN_WIDTH = 250;
        const MIN_HEIGHT = 200;
        let isResizing = false;
        let resizeDir = null;
        let startX, startY, startWidth, startHeight;
        let rafId = null;
        let newWidth = 0, newHeight = 0;

        const startResize = (e) => {
            e.stopPropagation();
            isResizing = true;
            resizeDir = e.target.dataset.resize;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = windowEl.offsetWidth;
            startHeight = windowEl.offsetHeight;
            document.body.style.cursor = e.target.style.cursor || 'se-resize';
            document.body.style.userSelect = 'none';
            windowEl.classList.add('resizing');
        };

        const doResize = (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (resizeDir.includes('e')) {
                newWidth = Math.max(MIN_WIDTH, startWidth + dx);
            }
            if (resizeDir.includes('s')) {
                newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
            }

            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    if (resizeDir.includes('e')) windowEl.style.width = `${newWidth}px`;
                    if (resizeDir.includes('s')) windowEl.style.height = `${newHeight}px`;
                    rafId = null;
                });
            }
        };

        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            resizeDir = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            windowEl.classList.remove('resizing');
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        windowEl.querySelectorAll('.app-resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', startResize);
        });
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    },

    focusWindow(appId) {
        if (!this.windows[appId]) return;
        this.windows[appId].style.zIndex = ++this.highestZIndex;
    },

    closeWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl) return;

        // Call cleanup handler if registered
        if (this.appCleanupHandlers[appId]) {
            this.appCleanupHandlers[appId]();
        }

        // Animate close
        windowEl.classList.add('closing');
        setTimeout(() => {
            windowEl.remove();
            delete this.windows[appId];

            // Remove from taskbar
            if (this.Taskbar) {
                this.Taskbar.removeWindow(appId);
            }
        }, 200);
    },

    minimizeWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl || windowEl.classList.contains('minimized')) return;

        windowEl.classList.add('minimizing');
        setTimeout(() => {
            windowEl.classList.remove('minimizing');
            windowEl.classList.add('minimized');

            if (this.Taskbar) {
                this.Taskbar.updateWindow(appId, true);
            }
        }, 300);
    },

    restoreWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl || !windowEl.classList.contains('minimized')) return;

        windowEl.classList.remove('minimized');
        windowEl.classList.add('restoring');
        setTimeout(() => {
            windowEl.classList.remove('restoring');
        }, 300);

        this.focusWindow(appId);

        if (this.Taskbar) {
            this.Taskbar.updateWindow(appId, false);
        }
    },

    maximizeWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl) return;

        const TASKBAR_HEIGHT = 48;

        if (windowEl.classList.contains('maximized')) {
            // Restore to previous size
            windowEl.classList.add('maximizing');
            windowEl.style.width = windowEl.dataset.prevWidth || '400px';
            windowEl.style.height = windowEl.dataset.prevHeight || '300px';
            windowEl.style.left = windowEl.dataset.prevLeft || '150px';
            windowEl.style.top = windowEl.dataset.prevTop || '80px';
            windowEl.classList.remove('maximized');

            setTimeout(() => {
                windowEl.classList.remove('maximizing');
            }, 250);
        } else {
            // Save current position and maximize
            windowEl.dataset.prevWidth = windowEl.style.width || `${windowEl.offsetWidth}px`;
            windowEl.dataset.prevHeight = windowEl.style.height || `${windowEl.offsetHeight}px`;
            windowEl.dataset.prevLeft = windowEl.style.left || `${windowEl.offsetLeft}px`;
            windowEl.dataset.prevTop = windowEl.style.top || `${windowEl.offsetTop}px`;

            windowEl.classList.add('maximizing');
            windowEl.style.width = '100vw';
            windowEl.style.height = `calc(100vh - ${TASKBAR_HEIGHT}px)`;
            windowEl.style.left = '0';
            windowEl.style.top = '0';
            windowEl.classList.add('maximized');

            setTimeout(() => {
                windowEl.classList.remove('maximizing');
            }, 250);
        }

        this.focusWindow(appId);
    }
};
