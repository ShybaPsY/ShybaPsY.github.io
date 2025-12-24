// ================================================
// CONTEXT MENU MODULE
// ================================================

export const ContextMenu = {
    element: null,
    apps: null, // Object containing app references

    init(apps) {
        this.apps = apps;
        this.element = document.getElementById('context-menu');
        if (!this.element) return;

        document.addEventListener('contextmenu', (e) => this.show(e));
        document.addEventListener('click', () => this.hide());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hide();
        });
    },

    show(e) {
        // Only show on desktop area
        const isDesktop = e.target.id === 'desktop' ||
                         e.target.closest('#desktop') ||
                         e.target.id === 'particle-canvas';

        if (!isDesktop) return;

        e.preventDefault();

        const options = [
            { label: '💻 Abrir Terminal', action: () => window.dispatchEvent(new CustomEvent('open-terminal')) },
            { label: '🎨 Abrir Themes', action: () => this.apps.ThemePickerApp?.open() },
            { label: '🎮 Abrir Games', action: () => this.apps.GamesApp?.open() },
            { label: '🎵 Abrir Music', action: () => this.apps.MusicApp?.open() },
            { label: '🎬 Abrir ASCII Player', action: () => this.apps.ASCIIPlayerApp?.open() },
            { separator: true },
            { label: '📺 Alternar CRT', action: () => {
                document.body.classList.toggle('crt-enabled');
                const crtBtn = document.getElementById('taskbar-crt');
                if (crtBtn) crtBtn.classList.toggle('active');
                localStorage.setItem('crt-enabled', document.body.classList.contains('crt-enabled'));
            }},
            { separator: true },
            { label: 'ℹ️ Sobre', action: () => this.apps.Terminal?.executeCommand('sobre') }
        ];

        this.element.innerHTML = options.map(opt =>
            opt.separator
                ? '<div class="context-separator"></div>'
                : `<div class="context-item">${opt.label}</div>`
        ).join('');

        let left = e.clientX;
        let top = e.clientY;

        // Prevent overflow
        this.element.classList.add('visible');
        const rect = this.element.getBoundingClientRect();
        if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
        if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 10;

        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;

        this.element.querySelectorAll('.context-item').forEach((item, i) => {
            const opt = options.filter(o => !o.separator)[i];
            if (opt) {
                item.addEventListener('click', () => {
                    opt.action();
                    this.hide();
                });
            }
        });
    },

    hide() {
        if (this.element) this.element.classList.remove('visible');
    }
};
