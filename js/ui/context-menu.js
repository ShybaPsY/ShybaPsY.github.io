// ================================================
// CONTEXT MENU MODULE
// ================================================

import { WallpaperManager } from '../features/wallpaper-manager.js';

export const ContextMenu = {
    element: null,
    apps: null,
    submenuTimeout: null,

    init(apps) {
        this.apps = apps;
        this.element = document.getElementById('context-menu');
        if (!this.element) return;

        WallpaperManager.init();

        document.addEventListener('contextmenu', (e) => this.show(e));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-submenu') && !e.target.closest('.context-item-submenu')) {
                this.hide();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        });
    },

    show(e) {
        // Check if clicking on desktop area (not on windows, taskbar, etc.)
        const isWindow = e.target.closest('.app-window') || e.target.closest('#terminal');
        const isTaskbar = e.target.closest('#taskbar');
        const isContextMenu = e.target.closest('.context-menu') || e.target.closest('.context-submenu');
        const isSpotlight = e.target.closest('#spotlight-overlay');

        // Show context menu only on desktop background area
        if (isWindow || isTaskbar || isContextMenu || isSpotlight) return;

        e.preventDefault();

        const wallpaperCategories = WallpaperManager.getList();
        const wallpaperSubmenu = [];

        // Build categorized wallpaper submenu
        Object.entries(wallpaperCategories).forEach(([type, category]) => {
            if (category.items.length > 0) {
                // Add category header
                if (wallpaperSubmenu.length > 0) {
                    wallpaperSubmenu.push({ label: '───────────', disabled: true });
                }
                wallpaperSubmenu.push({ label: category.name, disabled: true, header: true });
                // Add items
                category.items.forEach(w => {
                    wallpaperSubmenu.push({
                        label: (w.isActive ? '● ' : '○ ') + w.name,
                        action: () => WallpaperManager.apply(w.id)
                    });
                });
            }
        });

        const options = [
            { label: '💻 Abrir Terminal', action: () => window.dispatchEvent(new CustomEvent('open-terminal')) },
            { label: '🎨 Abrir Themes', action: () => this.apps.ThemePickerApp?.open() },
            { label: '🎮 Abrir Games', action: () => this.apps.GamesApp?.open() },
            { label: '🎵 Abrir Music', action: () => this.apps.MusicApp?.open() },
            { label: '🎬 Abrir ASCII Player', action: () => this.apps.ASCIIPlayerApp?.open() },
            { label: '📝 Abrir Notepad', action: () => this.apps.NotepadApp?.open() },
            { label: '🔢 Abrir Calculadora', action: () => this.apps.CalculatorApp?.open() },
            { separator: true },
            {
                label: '🖼️ Papel de Parede',
                submenu: wallpaperSubmenu
            },
            {
                label: '📺 Alternar CRT', action: () => {
                    document.body.classList.toggle('crt-enabled');
                    const crtBtn = document.getElementById('taskbar-crt');
                    if (crtBtn) crtBtn.classList.toggle('active');
                    localStorage.setItem('crt-enabled', document.body.classList.contains('crt-enabled'));
                }
            },
            { separator: true },
            { label: 'ℹ️ Sobre', action: () => this.apps.Terminal?.executeCommand('sobre') }
        ];

        this.element.innerHTML = options.map((opt, idx) => {
            if (opt.separator) return '<div class="context-separator"></div>';
            if (opt.submenu) {
                return `<div class="context-item context-item-submenu" data-submenu="${idx}">
                    ${opt.label} <span class="submenu-arrow">▶</span>
                </div>`;
            }
            return `<div class="context-item">${opt.label}</div>`;
        }).join('');

        let left = e.clientX;
        let top = e.clientY;

        this.element.classList.add('visible');
        const rect = this.element.getBoundingClientRect();
        if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
        if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 10;

        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;

        let itemIndex = 0;
        this.element.querySelectorAll('.context-item').forEach((item) => {
            const optIdx = parseInt(item.dataset.submenu);

            if (!isNaN(optIdx) && options[optIdx]?.submenu) {
                item.addEventListener('mouseenter', () => this.showSubmenu(item, options[optIdx].submenu));
                item.addEventListener('mouseleave', (e) => {
                    if (!e.relatedTarget?.closest('.context-submenu')) {
                        this.hideSubmenu();
                    }
                });
            } else {
                const opt = options.filter(o => !o.separator && !o.submenu)[itemIndex];
                itemIndex++;
                if (opt) {
                    item.addEventListener('click', () => {
                        opt.action();
                        this.hide();
                    });
                }
            }
        });
    },

    showSubmenu(parentItem, items) {
        clearTimeout(this.submenuTimeout);
        this.hideSubmenu();

        const submenu = document.createElement('div');
        submenu.className = 'context-submenu';

        submenu.innerHTML = items.map(item => {
            if (item.disabled) {
                const cls = item.header ? 'context-header' : 'context-separator-text';
                return `<div class="context-item ${cls}">${item.label}</div>`;
            }
            return `<div class="context-item">${item.label}</div>`;
        }).join('');

        document.body.appendChild(submenu);

        const parentRect = parentItem.getBoundingClientRect();
        const submenuRect = submenu.getBoundingClientRect();

        // Calculate position
        let left = parentRect.right - 4;
        let top = parentRect.top;

        // Check right edge
        if (left + submenuRect.width > window.innerWidth - 10) {
            left = parentRect.left - submenuRect.width + 4;
        }

        // Check left edge (if flipped)
        if (left < 10) {
            left = 10;
        }

        // Check bottom edge
        if (top + submenuRect.height > window.innerHeight - 10) {
            top = window.innerHeight - submenuRect.height - 10;
        }

        // Check top edge
        if (top < 10) {
            top = 10;
        }

        submenu.style.left = `${left}px`;
        submenu.style.top = `${top}px`;

        submenu.querySelectorAll('.context-item').forEach((el, i) => {
            if (!items[i].disabled && items[i].action) {
                el.addEventListener('click', () => {
                    items[i].action();
                    this.hide();
                });
            }
        });

        submenu.addEventListener('mouseleave', () => {
            this.submenuTimeout = setTimeout(() => this.hideSubmenu(), 100);
        });
        submenu.addEventListener('mouseenter', () => {
            clearTimeout(this.submenuTimeout);
        });
    },

    hideSubmenu() {
        document.querySelectorAll('.context-submenu').forEach(el => el.remove());
    },

    hide() {
        if (this.element) this.element.classList.remove('visible');
        this.hideSubmenu();
    }
};
