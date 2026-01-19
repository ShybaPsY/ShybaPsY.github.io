// ================================================
// TASKBAR MODULE
// ================================================

import { i18n } from '../i18n/i18n.js';

export const Taskbar = {
    clockInterval: null,
    WindowManager: null,
    commandInput: null,
    terminal: null,

    init(WindowManager, commandInput, terminal) {
        this.WindowManager = WindowManager;
        this.commandInput = commandInput;
        this.terminal = terminal;

        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);

        // CRT toggle button
        const crtBtn = document.getElementById('taskbar-crt');
        if (crtBtn) {
            const crtEnabled = localStorage.getItem('crt-enabled') === 'true';
            if (crtEnabled) {
                document.body.classList.add('crt-enabled');
                crtBtn.classList.add('active');
            }

            crtBtn.addEventListener('click', () => {
                document.body.classList.toggle('crt-enabled');
                crtBtn.classList.toggle('active');
                localStorage.setItem('crt-enabled', document.body.classList.contains('crt-enabled'));
            });
        }

        // Start button opens terminal focus
        const startBtn = document.getElementById('taskbar-start');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.commandInput) this.commandInput.focus();
                if (this.terminal && this.WindowManager) {
                    this.terminal.style.zIndex = ++this.WindowManager.highestZIndex;
                }
            });
        }
    },

    updateClock() {
        const timeEl = document.getElementById('clock-time');
        const dateEl = document.getElementById('clock-date');

        if (timeEl || dateEl) {
            const now = new Date();
            const locale = i18n.getDateLocale();

            if (timeEl) {
                timeEl.textContent = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            }

            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
            }
        }
    },

    addWindow(appId, title) {
        const container = document.getElementById('taskbar-windows');
        if (!container) return;

        const btn = document.createElement('button');
        btn.className = 'taskbar-window-btn active';
        btn.dataset.app = appId;
        btn.textContent = title;
        btn.addEventListener('click', () => this.handleWindowClick(appId));
        container.appendChild(btn);
    },

    removeWindow(appId) {
        const btn = document.querySelector(`.taskbar-window-btn[data-app="${appId}"]`);
        if (btn) btn.remove();
    },

    updateWindow(appId, isMinimized) {
        const btn = document.querySelector(`.taskbar-window-btn[data-app="${appId}"]`);
        if (btn) {
            btn.classList.toggle('minimized', isMinimized);
            btn.classList.toggle('active', !isMinimized);
        }
    },

    handleWindowClick(appId) {
        if (!this.WindowManager) return;
        const win = this.WindowManager.windows[appId];
        if (!win) return;

        if (win.classList.contains('minimized')) {
            this.WindowManager.restoreWindow(appId);
        } else {
            this.WindowManager.focusWindow(appId);
        }
    }
};
