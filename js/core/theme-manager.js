// ================================================
// THEME MANAGER MODULE
// ================================================

export const ThemeManager = {
    themes: {
        'tokyo-night': { name: 'Tokyo Night', description: 'Dark blue with vibrant colors (default)' },
        'dracula': { name: 'Dracula', description: 'Classic purple-based dark theme' },
        'gruvbox': { name: 'Gruvbox', description: 'Warm retro colors' },
        'nord': { name: 'Nord', description: 'Cool arctic-inspired palette' },
        'cyberpunk': { name: 'Cyberpunk', description: 'Futuristic neon vibes' },
        'matrix': { name: 'Matrix', description: 'Green on black hacker style' },
        'catppuccin': { name: 'Catppuccin', description: 'Soothing pastel colors' }
    },
    current: 'tokyo-night',
    STORAGE_KEY: 'selected-theme',
    _crossfadeTimer: null,

    // Reaplica o tema salvo da última visita (CRT e wallpaper já persistem;
    // o tema era o único que se perdia no reload)
    init() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved && this.themes[saved] && saved !== this.current) {
                this.apply(saved);
            }
        } catch (err) { /* localStorage indisponível */ }
    },

    apply(themeName, AchievementManager = null) {
        const theme = this.themes[themeName];
        if (!theme) {
            return `<span class="error">Theme "${themeName}" not found.</span>\n\nAvailable themes: ${Object.keys(this.themes).join(', ')}`;
        }

        // A troca de cor só é animada durante a troca. Fora dela, hover e
        // foco respondem na hora em vez de arrastar por 300ms.
        this.crossfade();

        if (themeName === 'tokyo-night') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', themeName);
        }

        this.current = themeName;

        try {
            localStorage.setItem(this.STORAGE_KEY, themeName);
        } catch (err) { /* localStorage indisponível */ }

        // Track achievement
        if (AchievementManager) {
            AchievementManager.trackTheme(themeName);
        }

        return `Theme changed to: <span class="highlight">${theme.name}</span>`;
    },

    crossfade() {
        const root = document.documentElement;
        root.classList.add('theme-switching');
        clearTimeout(this._crossfadeTimer);
        this._crossfadeTimer = setTimeout(() => root.classList.remove('theme-switching'), 420);
    },

    list() {
        let output = '<span class="highlight">Available Themes:</span>\n\n';
        for (const [key, theme] of Object.entries(this.themes)) {
            const marker = key === this.current ? ' <span class="detail-green">(current)</span>' : '';
            output += `  <span class="output-command">${key}</span>${marker}\n    ${theme.description}\n\n`;
        }
        output += `Use '<span class="output-command">theme [name]</span>' to switch themes.`;
        return output;
    }
};
