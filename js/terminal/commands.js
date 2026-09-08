// ================================================
// TERMINAL COMMANDS MODULE
// ================================================

import { i18n, t } from '../i18n/i18n.js';
import { getRickrollCommand, getAnimatedSL } from '../features/easter-eggs.js';
import { buildNeofetch } from './neofetch.js';

// Duração de um cargo em andamento, contada na hora em que o comando roda.
// Chumbar "7 meses" no texto significaria que ele envelhece sozinho e passa
// a mentir em algumas semanas.
//
// A contagem é inclusiva, como a do LinkedIn: quem começou em fevereiro
// está em "7 meses" durante todo o mês de agosto, e não em 6.
function duracaoDesde(ano, mes) {
    const hoje = new Date();
    const meses = Math.max(
        1,
        (hoje.getFullYear() - ano) * 12 + (hoje.getMonth() + 1 - mes) + 1
    );

    const en = i18n.currentLang === 'en';
    const anos = Math.floor(meses / 12);
    const resto = meses % 12;

    const parte = (n, sing, plur) => `${n} ${n === 1 ? sing : plur}`;
    const partes = [];
    if (anos) partes.push(parte(anos, en ? 'year' : 'ano', en ? 'years' : 'anos'));
    if (resto) partes.push(parte(resto, en ? 'month' : 'mês', en ? 'months' : 'meses'));

    return partes.join(en ? ' and ' : ' e ');
}

export function createCommands(dependencies) {
    const {
        ThemeManager,
        WindowManager,
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        ProjetosApp,
        AsciiMirrorApp,
        SystemMonitorApp,
        AsciiPortrait,
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
            return t('commands.experiencia', {
                aidda_duracao: duracaoDesde(2026, 2),
                pibiti_duracao: duracaoDesde(2025, 9)
            });
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

        // O logo é o retrato do Gabriel amostrado na rampa ASCII em tempo
        // real. Se a imagem não carregar, cai no logo estático do i18n.
        neofetch: async function() {
            const live = await buildNeofetch({ ThemeManager, WindowManager });
            if (live) return live;

            const uptime = Math.floor((Date.now() - performance.timeOrigin) / 1000);
            const theme = ThemeManager?.current || 'default';
            return t('commands.neofetch', { uptime, theme });
        },

        monitor: function() {
            SystemMonitorApp?.open();
            return t('commands.open_monitor');
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

        'open mirror': function() {
            AsciiMirrorApp?.open();
            return t('commands.open_mirror');
        },

        portrait: function() {
            // dispara sem await para o terminal liberar o input
            AsciiPortrait?.play();
            return t('commands.portrait');
        },

        conquistas: function() {
            if (!AchievementManager) return t('commands.conquistas_unavailable');
            return AchievementManager.listAchievements();
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

        // obs: "exit", "clear" e "matrix" são tratados direto em terminal.js,
        // antes da consulta a este objeto
    };
}
