// ================================================
// ACHIEVEMENT MANAGER MODULE
// ================================================

export const AchievementManager = {
    achievements: {
        'first_command': { name: 'Primeiro Passo', desc: 'Execute seu primeiro comando', icon: '🎯' },
        'theme_master': { name: 'Estilista', desc: 'Experimente 3 temas diferentes', icon: '🎨' },
        'matrix_fan': { name: 'Neo', desc: 'Ative o efeito Matrix', icon: '💊' },
        'coffee_lover': { name: 'Cafeínado', desc: 'Pegue um café virtual', icon: '☕' },
        'gamer': { name: 'Gamer', desc: 'Jogue um mini-game', icon: '🎮' },
        'music_lover': { name: 'Melômano', desc: 'Ouça música lofi', icon: '🎵' },
        'hacker': { name: 'Hacker', desc: 'Execute o comando hack', icon: '💻' },
        'curious': { name: 'Curioso', desc: 'Encontre um easter egg', icon: '🥚' },
        'explorer': { name: 'Explorador', desc: 'Use todos os apps', icon: '🧭' }
    },

    unlocked: new Set(JSON.parse(localStorage.getItem('achievements') || '[]')),
    themesUsed: new Set(JSON.parse(localStorage.getItem('themes-used') || '[]')),
    appsUsed: new Set(JSON.parse(localStorage.getItem('apps-used') || '[]')),

    check(id) {
        if (this.unlocked.has(id)) return false;

        this.unlocked.add(id);
        localStorage.setItem('achievements', JSON.stringify([...this.unlocked]));
        this.showToast(id);
        return true;
    },

    trackTheme(themeName) {
        this.themesUsed.add(themeName);
        localStorage.setItem('themes-used', JSON.stringify([...this.themesUsed]));
        if (this.themesUsed.size >= 3) {
            this.check('theme_master');
        }
    },

    trackApp(appName) {
        this.appsUsed.add(appName);
        localStorage.setItem('apps-used', JSON.stringify([...this.appsUsed]));
        if (this.appsUsed.size >= 4) {
            this.check('explorer');
        }
    },

    showToast(id) {
        const ach = this.achievements[id];
        if (!ach) return;

        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <span class="achievement-icon">${ach.icon}</span>
            <div>
                <div class="achievement-title">Conquista Desbloqueada!</div>
                <div class="achievement-name">${ach.name}</div>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    listAchievements() {
        let output = '<span class="highlight">Conquistas:</span>\n\n';
        for (const [id, ach] of Object.entries(this.achievements)) {
            const status = this.unlocked.has(id)
                ? '<span class="detail-green">✓</span>'
                : '<span class="comment">○</span>';
            output += `${status} ${ach.icon} <span class="output-command">${ach.name}</span>\n   ${ach.desc}\n\n`;
        }
        output += `<span class="comment">Desbloqueadas: ${this.unlocked.size}/${Object.keys(this.achievements).length}</span>`;
        return output;
    }
};
