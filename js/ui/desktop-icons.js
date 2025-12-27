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
            icon.addEventListener('click', () => {
                const appName = icon.dataset.app;
                this.openApp(appName);
            });
        });
    },

    openApp(appName) {
        switch(appName) {
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
            case 'notepad':
                this.apps.NotepadApp?.open();
                break;
            case 'calculator':
                this.apps.CalculatorApp?.open();
                break;
        }
    }
};
