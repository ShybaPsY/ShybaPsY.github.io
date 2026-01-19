// ================================================
// TERMINAL COMMANDS MODULE
// ================================================

import { t } from '../i18n/i18n.js';
import { getRickrollCommand, getAnimatedSL } from '../features/easter-eggs.js';

export function createCommands(dependencies) {
    const {
        ThemeManager,
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        ProjetosApp,
        AchievementManager,
        GitHubAPI,
        QuoteAPI,
        welcomeMessage
    } = dependencies;

    return {
        help: function() {
            return t('commands.help');
        },

        sobre: function() {
            return t('commands.sobre');
        },

        experiencia: function() {
            return t('commands.experiencia');
        },

        projetos: function() {
            ProjetosApp?.open();
            return t('commands.open_projetos');
        },

        skills: function() {
            return t('commands.skills');
        },

        cursos: function() {
            return t('commands.cursos');
        },

        idiomas: function() {
            return t('commands.idiomas');
        },

        contato: function() {
            return t('commands.contato');
        },

        'download cv': function() {
            return t('commands.download_cv');
        },

        bemvindo: welcomeMessage,

        extras: function() {
            return t('commands.extras');
        },

        ls: function() {
            return t('commands.ls');
        },

        tree: function() {
            return t('commands.tree');
        },

        neofetch: function() {
            const uptime = Math.floor((Date.now() - performance.timing.navigationStart) / 1000);
            const theme = ThemeManager?.current || 'default';
            return t('commands.neofetch', { uptime, theme });
        },

        sudo: function() {
            return t('commands.sudo');
        },

        coffee: function() {
            if (AchievementManager) {
                AchievementManager.unlock('coffee_lover');
            }
            return t('commands.coffee');
        },

        hack: async function() {
            if (AchievementManager) {
                AchievementManager.unlock('hacker');
            }
            return t('commands.hack');
        },

        '42': function() {
            return t('commands.42');
        },

        vim: function() {
            return t('commands.vim');
        },

        sl: getAnimatedSL(),

        rickroll: getRickrollCommand(),

        secret: function() {
            if (AchievementManager) {
                AchievementManager.unlock('curious');
            }
            return t('commands.secret');
        },

        github: async function() {
            const stats = await GitHubAPI.fetchStats();
            return GitHubAPI.formatStats(stats);
        },

        quote: async function() {
            const quote = await QuoteAPI.fetch();
            return QuoteAPI.format(quote);
        },

        desktop: function() {
            return t('commands.desktop');
        },

        'open player': function() {
            ASCIIPlayerApp?.open();
            return t('commands.open_player');
        },

        'open music': function() {
            MusicApp?.open();
            return t('commands.open_music');
        },

        'open games': function() {
            GamesApp?.open();
            return t('commands.open_games');
        },

        'open projetos': function() {
            ProjetosApp?.open();
            return t('commands.open_projetos');
        },

        'open themes': function() {
            ThemePickerApp?.open();
            return t('commands.open_themes');
        },

        conquistas: function() {
            if (AchievementManager) {
                const achievements = AchievementManager.getAll();
                if (achievements.length > 0) {
                    const translatedAchievements = achievements.map(a => {
                        const translated = t(`achievements.${a}`);
                        // If translation exists and is different from the key, use it
                        return translated !== `achievements.${a}` ? translated : a;
                    });
                    return `<span class="highlight">${t('commands.conquistas_title')}</span>\n\n${translatedAchievements.map(a => `  - ${a}`).join('\n')}`;
                }
                return t('commands.conquistas_empty');
            }
            return t('commands.conquistas_unavailable');
        },

        theme: function(args) {
            if (!args || args.length === 0) {
                const themes = ThemeManager ? Object.keys(ThemeManager.themes) : [];
                return `
  <span class="highlight">${t('commands.theme_available')}</span>

  ${themes.map(th => `  <span class="output-command">${th}</span>`).join('\n')}

  <span class="comment">${t('commands.theme_usage')}</span>`;
            }

            const themeName = args.join(' ').toLowerCase();
            if (ThemeManager && ThemeManager.themes[themeName]) {
                ThemeManager.apply(themeName);
                return t('commands.theme_applied', { theme: themeName });
            }
            return t('commands.theme_not_found', { theme: themeName });
        },

        exit: function() {
            window.dispatchEvent(new CustomEvent('terminal-closed'));
            return t('terminal.closing_terminal');
        }
    };
}
