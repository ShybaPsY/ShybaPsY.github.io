// ================================================
// GITHUB API MODULE
// ================================================

export const GitHubAPI = {
    username: 'ShybaPsY',
    cache: {
        stats: null,
        timestamp: 0
    },
    cacheTime: 5 * 60 * 1000, // 5 minutes

    async fetchStats() {
        const now = Date.now();
        if (this.cache.stats && (now - this.cache.timestamp < this.cacheTime)) {
            return this.cache.stats;
        }

        try {
            const reposResponse = await fetch(`https://api.github.com/users/${this.username}/repos?per_page=100`);
            if (!reposResponse.ok) throw new Error('Failed to fetch repos');
            const repos = await reposResponse.json();

            const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

            const languages = {};
            let totalBytes = 0;

            for (const repo of repos) {
                try {
                    const langResponse = await fetch(`https://api.github.com/repos/${this.username}/${repo.name}/languages`);
                    if (langResponse.ok) {
                        const langData = await langResponse.json();
                        for (const [lang, bytes] of Object.entries(langData)) {
                            languages[lang] = (languages[lang] || 0) + bytes;
                            totalBytes += bytes;
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to fetch languages for ${repo.name}:`, err);
                }
            }

            const languageStats = Object.entries(languages)
                .map(([lang, bytes]) => ({
                    name: lang,
                    percentage: ((bytes / totalBytes) * 100).toFixed(2)
                }))
                .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
                .slice(0, 6);

            const userResponse = await fetch(`https://api.github.com/users/${this.username}`);
            if (!userResponse.ok) throw new Error('Failed to fetch user');
            const userData = await userResponse.json();

            const stats = {
                totalStars,
                totalRepos: userData.public_repos,
                languages: languageStats
            };

            this.cache.stats = stats;
            this.cache.timestamp = now;

            return stats;
        } catch (error) {
            console.error('GitHub API error:', error);
            return null;
        }
    },

    formatStats(stats) {
        if (!stats) {
            return '<span class="error">Não foi possível carregar as estatísticas do GitHub.</span>\n\n<span class="comment">Verifique sua conexão com a internet.</span>';
        }

        let output = '<span class="highlight">Estatísticas do GitHub de Gabriel Lopes:</span>\n\n';

        output += '<span class="title-blue">📊 Estatísticas:</span>\n';
        output += `  <span class="detail-cyan">⭐ Total de estrelas:</span>       <span class="detail-green">${stats.totalStars}</span>\n`;
        output += `  <span class="detail-cyan">📁 Total de repositórios:</span>   <span class="detail-green">${stats.totalRepos}</span>\n\n`;

        output += '<span class="title-blue">💻 Tecnologias:</span>\n';
        stats.languages.forEach(lang => {
            const barLength = Math.round(parseFloat(lang.percentage) / 5);
            const bar = '█'.repeat(barLength);
            output += `  <span class="detail-cyan">${lang.name}</span> ${lang.percentage}% ${bar}\n`;
        });

        output += `\n<span class="comment">Veja mais em: <a href="https://github.com/${this.username}" target="_blank">github.com/${this.username}</a></span>`;

        return output;
    }
};
