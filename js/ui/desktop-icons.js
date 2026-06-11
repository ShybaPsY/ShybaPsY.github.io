// ================================================
// DESKTOP ICONS MODULE
// ================================================

export const DesktopIcons = {
    apps: null,

    init(apps) {
        this.apps = apps;
        this.setupClickHandlers();
    },

    setupClickHandlers() {
        const icons = document.querySelectorAll('.desktop-icon');

        icons.forEach(icon => {
            icon.setAttribute('role', 'button');
            icon.setAttribute('tabindex', '0');
            const label = icon.querySelector('.icon-label');
            if (label) icon.setAttribute('aria-label', label.textContent);

            icon.addEventListener('click', () => {
                this.openApp(icon.dataset.app);
            });
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openApp(icon.dataset.app);
                }
            });
        });
    },

    openApp(appName) {
        switch (appName) {
            case 'terminal':
                window.dispatchEvent(new CustomEvent('open-terminal'));
                break;
            case 'themes':
                this.apps.ThemePickerApp?.open();
                break;
            case 'player':
                this.apps.ASCIIPlayerApp?.open();
                break;
            case 'music':
                this.apps.MusicApp?.open();
                break;
            case 'games':
                this.apps.GamesApp?.open();
                break;
            case 'projetos':
                this.apps.ProjetosApp?.open();
                break;
            case 'notepad':
                this.apps.NotepadApp?.open();
                break;
            case 'calculator':
                this.apps.CalculatorApp?.open();
                break;
        }
    }
};
