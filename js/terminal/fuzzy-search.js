// ================================================
// FUZZY SEARCH MODULE
// ================================================

export const FuzzySearch = {
    TabCompletion: null,

    init(TabCompletion) {
        this.TabCompletion = TabCompletion;
    },

    // Calculate Levenshtein distance between two strings
    levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    },

    // Find similar commands
    findSimilar(input, maxDistance = 3) {
        const lower = input.toLowerCase();
        const allCommands = this.TabCompletion ? this.TabCompletion.getAllCommands() : [];

        const suggestions = allCommands
            .map(cmd => ({
                command: cmd,
                distance: this.levenshtein(lower, cmd)
            }))
            .filter(item => item.distance <= maxDistance && item.distance > 0)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(item => item.command);

        return suggestions;
    },

    // Generate suggestion message
    getSuggestionMessage(input) {
        const suggestions = this.findSimilar(input);
        if (suggestions.length === 0) return null;

        if (suggestions.length === 1) {
            return `Você quis dizer '<span class="output-command">${suggestions[0]}</span>'?`;
        }

        const formatted = suggestions
            .map(s => `'<span class="output-command">${s}</span>'`)
            .join(', ');
        return `Você quis dizer: ${formatted}?`;
    }
};
