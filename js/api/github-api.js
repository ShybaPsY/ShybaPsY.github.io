// ================================================
// GITHUB API MODULE
// ================================================

import { t } from '../i18n/i18n.js';

export const GitHubAPI = {
    username: 'ShybaPsY',
    cacheKey: 'github-stats-cache',
    cacheTime: 60 * 60 * 1000, // 1 hour

    readCache() {
        try {
            const cached = JSON.parse(localStorage.getItem(this.cacheKey));
            if (cached && (Date.now() - cached.timestamp < this.cacheTime)) {
                return cached.stats;
            }
        } catch (err) { /* cache corrompido ou indisponível */ }
        return null;
    },

    writeCache(stats) {
        try {
            localStorage.setItem(this.cacheKey, JSON.stringify({ stats, timestamp: Date.now() }));
        } catch (err) { /* localStorage cheio ou indisponível */ }
    },

    async fetchStats() {
        const cached = this.readCache();
        if (cached) return cached;

        try {
            const [reposResponse, userResponse] = await Promise.all([
                fetch(`https://api.github.com/users/${this.username}/repos?per_page=100`),
                fetch(`https://api.github.com/users/${this.username}`)
            ]);
            if (!reposResponse.ok) throw new Error('Failed to fetch repos');
            if (!userResponse.ok) throw new Error('Failed to fetch user');
            const repos = await reposResponse.json();
            const userData = await userResponse.json();

            const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

            // Linguagem principal de cada repo (campo "language" já vem em /repos,
            // evitando uma chamada extra por repositório e o rate limit da API)
            const languages = {};
            let totalCounted = 0;
            for (const repo of repos) {
                if (repo.language && !repo.fork) {
                    languages[repo.language] = (languages[repo.language] || 0) + 1;
                    totalCounted++;
                }
            }

            const languageStats = Object.entries(languages)
                .map(([lang, count]) => ({
                    name: lang,
                    percentage: ((count / totalCounted) * 100).toFixed(2)
                }))
                .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
                .slice(0, 6);

            const stats = {
                totalStars,
                totalRepos: userData.public_repos,
                languages: languageStats
            };

            this.writeCache(stats);

            return stats;
        } catch (error) {
            console.error('GitHub API error:', error);
            return null;
        }
    },

    formatStats(stats) {
        if (!stats) {
            return `<span class="error">${t('github.error_loading')}</span>\n\n<span class="comment">${t('github.check_connection')}</span>`;
        }

        let output = `<span class="highlight">${t('github.stats_title')}</span>\n\n`;

        output += `<span class="title-blue">${t('github.stats_section')}</span>\n`;
        output += `  <span class="detail-cyan">${t('github.total_stars')}</span>       <span class="detail-green">${stats.totalStars}</span>\n`;
        output += `  <span class="detail-cyan">${t('github.total_repos')}</span>   <span class="detail-green">${stats.totalRepos}</span>\n\n`;

        output += `<span class="title-blue">${t('github.technologies')}</span>\n`;
        stats.languages.forEach(lang => {
            const barLength = Math.round(parseFloat(lang.percentage) / 5);
            const bar = '█'.repeat(barLength);
            output += `  <span class="detail-cyan">${lang.name}</span> ${lang.percentage}% ${bar}\n`;
        });

        output += `\n<span class="comment">${t('github.see_more')} <a href="https://github.com/${this.username}" target="_blank">github.com/${this.username}</a></span>`;

        return output;
    }
};
