// ================================================
// TAB COMPLETION MODULE
// ================================================

export const TabCompletion = {
    commands: null,
    aliases: null,
    ThemeManager: null,
    lastInput: '',
    matches: [],
    matchIndex: 0,
    isThemeCompletion: false,

    init(commands, aliases, ThemeManager) {
        this.commands = commands;
        this.aliases = aliases;
        this.ThemeManager = ThemeManager;
    },

    getAllCommands() {
        const cmds = Object.keys(this.commands || {});
        const als = Object.keys(this.aliases || {});
        const special = ['clear', 'exit', 'matrix', 'theme', 'themes'];
        return [...new Set([...cmds, ...als, ...special])].sort();
    },

    getAllThemes() {
        if (!this.ThemeManager) return [];
        return Object.keys(this.ThemeManager.themes).sort();
    },

    getMatches(partial) {
        if (!partial) return [];
        const lower = partial.toLowerCase();
        return this.getAllCommands().filter(cmd => cmd.startsWith(lower));
    },

    getThemeMatches(partial) {
        if (!partial) return this.getAllThemes();
        const lower = partial.toLowerCase();
        return this.getAllThemes().filter(theme => theme.startsWith(lower));
    },

    complete(input) {
        const trimmed = input.trim().toLowerCase();

        // Check if completing theme name
        if (trimmed.startsWith('theme ') || trimmed.startsWith('tema ')) {
            const prefix = trimmed.startsWith('theme ') ? 'theme ' : 'tema ';
            const themePartial = trimmed.substring(prefix.length);

            if (trimmed !== this.lastInput) {
                this.lastInput = trimmed;
                this.matches = this.getThemeMatches(themePartial);
                this.matchIndex = 0;
                this.isThemeCompletion = true;
            } else if (this.matches.length > 0) {
                this.matchIndex = (this.matchIndex + 1) % this.matches.length;
            }

            if (this.matches.length > 0) {
                return `theme ${this.matches[this.matchIndex]}`;
            }
            return input;
        }

        // Regular command completion
        this.isThemeCompletion = false;

        if (trimmed !== this.lastInput) {
            this.lastInput = trimmed;
            this.matches = this.getMatches(trimmed);
            this.matchIndex = 0;
        } else if (this.matches.length > 0) {
            this.matchIndex = (this.matchIndex + 1) % this.matches.length;
        }

        if (this.matches.length > 0) {
            return this.matches[this.matchIndex];
        }
        return input;
    },

    reset() {
        this.lastInput = '';
        this.matches = [];
        this.matchIndex = 0;
        this.isThemeCompletion = false;
    }
};
