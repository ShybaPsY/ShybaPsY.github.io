// ================================================
// THEME PICKER APP MODULE
// ================================================

export const ThemePickerApp = {
    WindowManager: null,
    ThemeManager: null,
    AchievementManager: null,

    themeColors: {
        'tokyo-night': ['#1a1b26', '#9ece6a', '#7aa2f7', '#bb9af7', '#f7768e'],
        'dracula': ['#282a36', '#50fa7b', '#bd93f9', '#ff79c6', '#ff5555'],
        'gruvbox': ['#282828', '#b8bb26', '#83a598', '#d3869b', '#fb4934'],
        'nord': ['#2e3440', '#a3be8c', '#81a1c1', '#b48ead', '#bf616a'],
        'cyberpunk': ['#0a0e14', '#91b362', '#53bdfa', '#f07178', '#ea6c73'],
        'matrix': ['#0d0d0d', '#00ff00', '#00cc00', '#00ff66', '#ff0000'],
        'catppuccin': ['#1e1e2e', '#a6e3a1', '#89b4fa', '#f5c2e7', '#f38ba8']
    },

    init(WindowManager, ThemeManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.ThemeManager = ThemeManager;
        this.AchievementManager = AchievementManager;
    },

    open() {
        if (!this.WindowManager || !this.ThemeManager) return;

        let content = '<div class="theme-grid">';
        for (const [key, theme] of Object.entries(this.ThemeManager.themes)) {
            const colors = this.themeColors[key];
            const isActive = key === this.ThemeManager.current ? 'active' : '';
            content += `
                <div class="theme-card ${isActive}" data-theme="${key}">
                    <div class="theme-card-name">${theme.name}</div>
                    <div class="theme-card-colors">
                        ${colors.map(c => `<div class="theme-color-swatch" style="background-color: ${c}"></div>`).join('')}
                    </div>
                </div>
            `;
        }
        content += '</div>';

        const windowEl = this.WindowManager.createWindow('themes', 'Theme Picker', 320, 380, content);

        windowEl.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const themeName = card.dataset.theme;
                this.ThemeManager.apply(themeName, this.AchievementManager);
                windowEl.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });

        // Track app usage
        if (this.AchievementManager) {
            this.AchievementManager.trackApp('themes');
        }
    }
};
