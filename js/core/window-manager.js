// ================================================
// WINDOW MANAGER MODULE
// ================================================

import { WindowAnimator } from './window-animator.js';

export const WindowManager = {
    windows: {},
    highestZIndex: 100,
    Taskbar: null,
    appCleanupHandlers: {},
    snapPreview: null,
    SNAP_THRESHOLD: 30,
    TASKBAR_HEIGHT: 48,

    lastPointer: null,

    setTaskbar(taskbar) {
        this.Taskbar = taskbar;
    },

    // A taskbar mede 48px no desktop e 44px no celular. Ler a altura real
    // evita as três cópias do número 48 que existiam espalhadas por aqui.
    taskbarHeight() {
        const el = document.getElementById('taskbar');
        return el?.offsetHeight || this.TASKBAR_HEIGHT;
    },

    // Retângulo de trabalho: a tela menos a taskbar.
    workArea() {
        return { width: window.innerWidth, height: window.innerHeight - this.taskbarHeight() };
    },

    // ================================================
    // PRIMITIVAS DE JANELA
    // Operam sobre um elemento, não sobre um appId, para que o terminal —
    // que não mora no registro de janelas — use exatamente o mesmo código
    // em vez da cópia que existia em main.js.
    // ================================================

    // Guarda a geometria antes de maximizar/encaixar, para poder voltar.
    saveGeometry(el) {
        el.dataset.prevWidth = el.style.width || `${el.offsetWidth}px`;
        el.dataset.prevHeight = el.style.height || `${el.offsetHeight}px`;
        el.dataset.prevLeft = el.style.left || `${el.offsetLeft}px`;
        el.dataset.prevTop = el.style.top || `${el.offsetTop}px`;
    },

    applyGeometry(el, { left, top, width, height }) {
        el.style.left = left;
        el.style.top = top;
        el.style.width = width;
        el.style.height = height;
    },

    async animateMinimize(el, appId) {
        await WindowAnimator.toRect(el, WindowAnimator.taskbarRect(appId));
        el.classList.add('minimized');
        WindowAnimator.pulseTaskbar(appId);
    },

    async animateRestore(el, appId) {
        const rect = WindowAnimator.taskbarRect(appId);
        el.classList.remove('minimized');
        await WindowAnimator.fromRect(el, rect);
    },

    // Maximizar e restaurar são a mesma operação com destinos diferentes,
    // então dividem o mesmo caminho de animação. Maximizado e encaixado
    // são estados exclusivos: entrar num limpa o outro, senão a janela
    // acumula classes que se contradizem.
    async toggleMaximizeEl(el) {
        const isMax = el.classList.contains('maximized');

        if (isMax) {
            const geo = {
                left: el.dataset.prevLeft || '150px',
                top: el.dataset.prevTop || '80px',
                width: el.dataset.prevWidth || '400px',
                height: el.dataset.prevHeight || '300px'
            };
            await WindowAnimator.flip(el, () => {
                el.classList.remove('maximized', 'snapped-left', 'snapped-right');
                this.applyGeometry(el, geo);
            });
        } else {
            this.saveGeometry(el);
            const area = this.workArea();
            await WindowAnimator.flip(el, () => {
                el.classList.remove('snapped-left', 'snapped-right');
                el.classList.add('maximized');
                this.applyGeometry(el, {
                    left: '0', top: '0',
                    width: `${area.width}px`,
                    height: `${area.height}px`
                });
            });
        }
        return !isMax;
    },

    // A janela cresce a partir de onde o usuário clicou — ícone, botão da
    // taskbar, resultado do Spotlight. Sem clique (comando digitado no
    // terminal), ela cresce do próprio centro.
    trackPointer() {
        document.addEventListener('pointerdown', (e) => {
            this.lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() };
        }, true);
    },

    applyLaunchOrigin(windowEl) {
        const p = this.lastPointer;
        if (!p || performance.now() - p.t > 800) return;
        const rect = windowEl.getBoundingClientRect();
        const ox = Math.max(0, Math.min(rect.width, p.x - rect.left));
        const oy = Math.max(0, Math.min(rect.height, p.y - rect.top));
        windowEl.style.transformOrigin = `${ox}px ${oy}px`;
        windowEl.addEventListener('animationend', () => {
            windowEl.style.transformOrigin = '';
        }, { once: true });
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
                    <div class="app-window-btn red" data-action="close" role="button" tabindex="0" aria-label="Close window"></div>
                    <div class="app-window-btn yellow" data-action="minimize" role="button" tabindex="0" aria-label="Minimize window"></div>
                    <div class="app-window-btn green" data-action="maximize" role="button" tabindex="0" aria-label="Maximize window"></div>
                </div>
                <span class="app-window-title">${title}</span>
            </div>
            <div class="app-window-body">${content}</div>
        `;

        document.getElementById('app-windows').appendChild(windowEl);
        this.applyLaunchOrigin(windowEl);
        this.setupWindowDrag(windowEl);
        if (resizable) this.setupWindowResize(windowEl);

        // Button handlers (click + keyboard)
        const bindWindowButton = (selector, action) => {
            const btn = windowEl.querySelector(selector);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                action();
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    action();
                }
            });
        };
        bindWindowButton('.app-window-btn.red', () => this.closeWindow(appId));
        bindWindowButton('.app-window-btn.yellow', () => this.minimizeWindow(appId));
        bindWindowButton('.app-window-btn.green', () => this.maximizeWindow(appId));

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

        const geo = this.snapGeometry(zone);
        if (!geo) return;

        // Ao trocar de zona (esquerda -> topo), a prévia se reposiciona com
        // um pulso, em vez de simplesmente saltar.
        const changed = this.snapPreview.dataset.zone !== zone;
        this.snapPreview.dataset.zone = zone;

        Object.assign(this.snapPreview.style, {
            left: `${geo.left}px`,
            top: `${geo.top}px`,
            width: `${geo.width}px`,
            height: `${geo.height}px`
        });
        this.snapPreview.classList.add('visible');

        if (changed) {
            this.snapPreview.classList.remove('landing');
            void this.snapPreview.offsetWidth;
            this.snapPreview.classList.add('landing');
        }
    },

    hideSnapPreview() {
        if (this.snapPreview) {
            this.snapPreview.classList.remove('visible', 'landing');
            delete this.snapPreview.dataset.zone;
        }
    },

    // Geometria de cada zona de encaixe, num lugar só — antes ela estava
    // escrita duas vezes: aqui e na pré-visualização.
    snapGeometry(zone) {
        const { width, height } = this.workArea();
        const half = Math.round(width / 2);

        switch (zone) {
            case 'left': return { left: 0, top: 0, width: half, height };
            case 'right': return { left: half, top: 0, width: width - half, height };
            case 'top': return { left: 0, top: 0, width, height };
            default: return null;
        }
    },

    async applySnap(windowEl, zone) {
        const geo = this.snapGeometry(zone);
        if (!geo) return;

        this.saveGeometry(windowEl);

        await WindowAnimator.flip(windowEl, () => {
            windowEl.classList.remove('snapped-left', 'snapped-right', 'maximized');
            windowEl.classList.add(zone === 'top' ? 'maximized' : `snapped-${zone}`);
            this.applyGeometry(windowEl, {
                left: `${geo.left}px`,
                top: `${geo.top}px`,
                width: `${geo.width}px`,
                height: `${geo.height}px`
            });
        }, { duration: 300 });
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
        this.setActive(this.windows[appId]);
    },

    // Só uma janela por vez fica com a borda e o brilho de acento.
    // O terminal entra na mesma disputa, apesar de não morar no
    // registro de janelas.
    setActive(targetEl) {
        document.querySelectorAll('.app-window.is-active, #terminal.is-active')
            .forEach(el => { if (el !== targetEl) el.classList.remove('is-active'); });
        if (targetEl) targetEl.classList.add('is-active');
    },

    async closeWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl) return;

        // Call cleanup handler if registered
        if (this.appCleanupHandlers[appId]) {
            this.appCleanupHandlers[appId]();
        }

        // A janela sai do registro antes da animação: assim um segundo
        // clique no ícone já abre uma nova em vez de focar a que morre.
        delete this.windows[appId];

        await WindowAnimator.close(windowEl);
        windowEl.remove();

        if (this.Taskbar) {
            this.Taskbar.removeWindow(appId);
        }
    },

    async minimizeWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl || windowEl.classList.contains('minimized')) return;

        // A taskbar muda de estado antes da animação para o botão já estar
        // no lugar certo quando a janela chegar nele.
        if (this.Taskbar) this.Taskbar.updateWindow(appId, true);
        await this.animateMinimize(windowEl, appId);
    },

    async restoreWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl || !windowEl.classList.contains('minimized')) return;

        if (this.Taskbar) this.Taskbar.updateWindow(appId, false);
        this.focusWindow(appId);
        await this.animateRestore(windowEl, appId);
    },

    async maximizeWindow(appId) {
        const windowEl = this.windows[appId];
        if (!windowEl) return;

        this.focusWindow(appId);
        await this.toggleMaximizeEl(windowEl);
    }
};
