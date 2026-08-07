// ================================================
// WALLPAPER MANAGER
//
// Antes, cada papel de parede era um degradê CSS pintado no body — e o
// campo ASCII era desenhado por cima dele. Dois fundos empilhados, sem
// relação: nos papéis claros o campo sumia (as cores dele são feitas
// para fundo escuro) e nos verdes os dois brigavam pelo mesmo espaço.
//
// Agora o fundo do desktop é SEMPRE o campo ASCII, e o papel de parede
// diz de que cores ele é feito. "Arctic" faz o campo ir de azul profundo
// no topo a gelo no pé; "Toxic" o deixa verde-ácido e denso. Não existe
// mais imagem por trás — só a matéria do sistema, tingida pela escolha.
//
// Cada preset define:
//   bg       cor sólida atrás do campo (sempre escura, para o texto ler)
//   low/mid/high  a rampa de cor, do vale à crista
//   drift    quanto a rampa escorrega de cima para baixo (degradê vertical)
//   density  quantidade de tinta (1 = padrão)
//   ramp     conjunto de caracteres, quando o preset é sobre textura
// ================================================

import { t } from '../i18n/i18n.js';
import { AsciiField } from '../effects/ascii-field.js';

export const WallpaperManager = {
    currentWallpaper: 'none',

    wallpapers: {
        // === PADRÃO: segue o tema ===
        'none': {
            name: null, // usa tradução
            type: 'none',
            field: null // sem paleta = cores do tema
        },

        // === PALETAS COM MOVIMENTO VERTICAL FORTE ===
        'animated-aurora': {
            name: '✨ Aurora',
            type: 'animated',
            field: { bg: '#0b0918', low: '#171233', mid: '#4a3a8c', high: '#b79cff', drift: 0.55 }
        },
        'animated-sunset': {
            name: '✨ Sunset',
            type: 'animated',
            field: { bg: '#140a12', low: '#2a1220', mid: '#c9524d', high: '#ffc06a', drift: 0.75 }
        },
        'animated-neon': {
            name: '✨ Neon Pulse',
            type: 'animated',
            field: { bg: '#07070d', low: '#12102a', mid: '#6c1f6b', high: '#ff5cf4', drift: 0.5 }
        },
        'animated-ocean': {
            name: '✨ Deep Ocean',
            type: 'animated',
            field: { bg: '#050d1f', low: '#0a1a3d', mid: '#14528f', high: '#57dced', drift: 0.62 }
        },
        'animated-fire': {
            name: '✨ Fire Storm',
            type: 'animated',
            field: { bg: '#100303', low: '#2a0808', mid: '#a83015', high: '#ffab48', drift: 0.78 }
        },

        // === PALETAS ESTÁTICAS ===
        'gradient-synthwave': {
            name: '🌆 Synthwave',
            type: 'gradient',
            field: { bg: '#0c0618', low: '#1c0a35', mid: '#b02070', high: '#ffa25c', drift: 0.8 }
        },
        'gradient-midnight': {
            name: '🌙 Midnight',
            type: 'gradient',
            field: { bg: '#08080f', low: '#12142c', mid: '#313a6b', high: '#8b97d4', drift: 0.32 }
        },
        'gradient-forest': {
            name: '🌲 Forest',
            type: 'gradient',
            field: { bg: '#070f08', low: '#0f2411', mid: '#2f6b33', high: '#9bd894', drift: 0.5 }
        },
        'gradient-nebula': {
            name: '🌌 Nebula',
            type: 'gradient',
            field: { bg: '#08081a', low: '#131033', mid: '#422f7a', high: '#8fb0ff', drift: 0.45 }
        },
        'gradient-vaporwave': {
            name: '🎮 Vaporwave',
            type: 'gradient',
            field: { bg: '#0d0718', low: '#1d0f33', mid: '#c94fa5', high: '#6ceaff', drift: 0.82 }
        },
        'gradient-bloodmoon': {
            name: '🔴 Blood Moon',
            type: 'gradient',
            field: { bg: '#0b0203', low: '#1e0508', mid: '#7f1522', high: '#ff6b74', drift: 0.5 }
        },
        'gradient-arctic': {
            name: '❄️ Arctic',
            type: 'gradient',
            field: { bg: '#060d18', low: '#0d1c30', mid: '#2f6f9e', high: '#c2efff', drift: 0.68 }
        },
        'gradient-toxic': {
            name: '☢️ Toxic',
            type: 'gradient',
            field: { bg: '#060b06', low: '#0c1c0c', mid: '#2f8a1f', high: '#a8ff45', drift: 0.4, density: 1.15 }
        },

        // === TEXTURAS: mudam o alfabeto do campo, não a cor ===
        // ATENÇÃO ao escolher glifos para uma `ramp`: cada linha é
        // desenhada como uma string única sobre uma grade fixa, então
        // qualquer caractere que não tenha exatamente a largura de avanço
        // da fonte desalinha a linha inteira. Medidos em Fira Code:
        // seguros → . : - = + * # % @ o O 0 | / ~ , · •
        // quebram → ✦ (1.36x)  ∙ (0.92x)
        'pattern-grid': {
            name: '📐 Grid',
            type: 'pattern',
            field: { ramp: ' .:-=+*#%@', density: 1.35 }
        },
        'pattern-dots': {
            name: '⚫ Dots',
            type: 'pattern',
            field: { ramp: ' ....:::·oO', density: 0.8 }
        },
        'pattern-diagonal': {
            name: '📏 Diagonal',
            type: 'pattern',
            field: { ramp: ' ..///|||#@', density: 1.05 }
        },
        'pattern-hexagon': {
            name: '⬡ Hexagons',
            type: 'pattern',
            field: { ramp: ' ..::ooOO0@', density: 0.95 }
        },
        'pattern-waves': {
            name: '🌊 Waves',
            type: 'pattern',
            field: { ramp: ' ..,,~~--==', density: 1.1, low: '#12203a', mid: '#2f6f9e', high: '#7dcfff', bg: '#070d18', drift: 0.35 }
        },
        'pattern-circuit': {
            name: '🔌 Circuit',
            type: 'pattern',
            field: { ramp: ' ..--==++#|', density: 1.2, low: '#0a1a12', mid: '#127a4a', high: '#4dffab', bg: '#050a08', drift: 0.25 }
        },
        'pattern-stars': {
            name: '⭐ Starfield',
            type: 'pattern',
            field: { ramp: ' ........*•', density: 0.55, low: '#161a2e', mid: '#5b6591', high: '#ffffff', bg: '#05060d', drift: 0.2 }
        }
    },

    init() {
        const saved = localStorage.getItem('wallpaper');
        this.apply(saved && this.wallpapers[saved] ? saved : 'none');
    },

    apply(wallpaperId) {
        const wallpaper = this.wallpapers[wallpaperId];
        if (!wallpaper) return;

        this.currentWallpaper = wallpaperId;
        const body = document.body;

        // Limpa qualquer resíduo do sistema antigo de imagem de fundo —
        // inclusive de quem tem um papel de parede salvo de antes.
        body.style.backgroundImage = '';
        body.style.backgroundSize = '';
        body.style.backgroundPosition = '';
        body.style.backgroundRepeat = '';
        body.style.animation = '';

        // O fundo sólido é escuro por definição: é o que garante que os
        // rótulos dos ícones e o texto sobre o vidro continuem legíveis.
        body.style.backgroundColor = wallpaper.field?.bg || '';

        AsciiField.applyPreset(wallpaper.field);

        try {
            localStorage.setItem('wallpaper', wallpaperId);
        } catch (err) { /* localStorage indisponível */ }
    },

    getList() {
        const categories = {
            'animated': { name: t('wallpaper.animated'), items: [] },
            'gradient': { name: t('wallpaper.gradients'), items: [] },
            'pattern': { name: t('wallpaper.patterns'), items: [] },
            'none': { name: t('wallpaper.none'), items: [] }
        };

        Object.entries(this.wallpapers).forEach(([id, data]) => {
            const type = data.type || 'gradient';
            if (categories[type]) {
                categories[type].items.push({
                    id,
                    name: id === 'none' ? t('wallpaper.none') : data.name,
                    isActive: id === this.currentWallpaper
                });
            }
        });

        return categories;
    },

    getListFlat() {
        return Object.entries(this.wallpapers).map(([id, data]) => ({
            id,
            name: data.name,
            isActive: id === this.currentWallpaper
        }));
    }
};
