// ================================================
// WALLPAPER MANAGER MODULE - Enhanced Version
// ================================================

export const WallpaperManager = {
    currentWallpaper: 'none',
    animationStyleEl: null,

    wallpapers: {
        // === NO WALLPAPER ===
        'none': {
            name: 'Nenhum',
            type: 'none'
        },

        // === ANIMATED GRADIENTS ===
        'animated-aurora': {
            name: '✨ Aurora Animated',
            type: 'animated',
            css: 'linear-gradient(-45deg, #0f0c29, #302b63, #24243e, #1a1a3e, #44337a, #0f0c29)',
            animation: 'gradientShift 15s ease infinite',
            size: '400% 400%'
        },
        'animated-sunset': {
            name: '✨ Sunset Animated',
            type: 'animated',
            css: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
            animation: 'gradientShift 12s ease infinite',
            size: '400% 400%'
        },
        'animated-neon': {
            name: '✨ Neon Pulse',
            type: 'animated',
            css: 'linear-gradient(-45deg, #0a0a0a, #1a0030, #000030, #001a1a, #0a0a0a)',
            animation: 'gradientShift 20s ease infinite',
            size: '400% 400%'
        },
        'animated-ocean': {
            name: '✨ Deep Ocean',
            type: 'animated',
            css: 'linear-gradient(-45deg, #0c1445, #1a237e, #0d47a1, #01579b, #006064, #0c1445)',
            animation: 'gradientShift 18s ease infinite',
            size: '400% 400%'
        },
        'animated-fire': {
            name: '✨ Fire Storm',
            type: 'animated',
            css: 'linear-gradient(-45deg, #1a0000, #4a0000, #8b0000, #cc3300, #ff6600, #4a0000)',
            animation: 'gradientShift 10s ease infinite',
            size: '400% 400%'
        },

        // === STATIC GRADIENTS ===
        'gradient-synthwave': {
            name: '🌆 Synthwave',
            type: 'gradient',
            css: 'linear-gradient(180deg, #0a0a0a 0%, #1a0030 20%, #2d1b4e 40%, #ff006e 80%, #ff6b35 100%)'
        },
        'gradient-midnight': {
            name: '🌙 Midnight',
            type: 'gradient',
            css: 'linear-gradient(135deg, #0c0c1e 0%, #1a1a3e 30%, #141428 60%, #0a0a14 100%)'
        },
        'gradient-forest': {
            name: '🌲 Forest',
            type: 'gradient',
            css: 'linear-gradient(160deg, #0d1b0e 0%, #1a3a1c 30%, #2d5a2e 60%, #1a3a1c 100%)'
        },
        'gradient-nebula': {
            name: '🌌 Nebula',
            type: 'gradient',
            css: 'radial-gradient(ellipse at 20% 50%, #2d1b4e 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, #0d47a1 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #4a0072 0%, transparent 40%), linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)'
        },
        'gradient-vaporwave': {
            name: '🎮 Vaporwave',
            type: 'gradient',
            css: 'linear-gradient(180deg, #0a0a14 0%, #1a0a2e 20%, #3d1a5c 40%, #ff71ce 70%, #01cdfe 90%, #05ffa1 100%)'
        },
        'gradient-bloodmoon': {
            name: '🔴 Blood Moon',
            type: 'gradient',
            css: 'radial-gradient(circle at 75% 25%, #8b0000 0%, transparent 35%), linear-gradient(180deg, #0a0000 0%, #1a0505 40%, #2d0a0a 70%, #0a0000 100%)'
        },
        'gradient-arctic': {
            name: '❄️ Arctic',
            type: 'gradient',
            css: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 30%, #2d5a7b 50%, #4a90a4 70%, #87ceeb 100%)'
        },
        'gradient-toxic': {
            name: '☢️ Toxic',
            type: 'gradient',
            css: 'radial-gradient(circle at 30% 70%, #00ff00 0%, transparent 30%), radial-gradient(circle at 70% 30%, #39ff14 0%, transparent 25%), linear-gradient(180deg, #0a0a0a 0%, #0a1a0a 50%, #0a0a0a 100%)'
        },

        // === PATTERNS ===
        'pattern-grid': {
            name: '📐 Grid',
            type: 'pattern',
            css: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.05) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.05) 50px)',
            bg: 'var(--background)'
        },
        'pattern-dots': {
            name: '⚫ Dots',
            type: 'pattern',
            css: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            size: '20px 20px',
            bg: 'var(--background)'
        },
        'pattern-diagonal': {
            name: '📏 Diagonal Lines',
            type: 'pattern',
            css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
            bg: 'var(--background)'
        },
        'pattern-hexagon': {
            name: '⬡ Hexagons',
            type: 'pattern',
            css: 'radial-gradient(circle farthest-side at 0% 50%, transparent 47%, rgba(255,255,255,0.04) 49%, transparent 51%), radial-gradient(circle farthest-side at 100% 50%, transparent 47%, rgba(255,255,255,0.04) 49%, transparent 51%)',
            size: '60px 35px',
            bg: 'var(--background)'
        },
        'pattern-waves': {
            name: '🌊 Waves',
            type: 'pattern',
            css: 'radial-gradient(ellipse 100% 100% at 50% 100%, transparent 40%, rgba(255,255,255,0.03) 41%, transparent 42%), radial-gradient(ellipse 100% 100% at 50% 0%, transparent 40%, rgba(255,255,255,0.03) 41%, transparent 42%)',
            size: '100px 50px',
            bg: 'var(--background)'
        },
        'pattern-circuit': {
            name: '🔌 Circuit',
            type: 'pattern',
            css: 'linear-gradient(90deg, transparent 48%, rgba(0,255,136,0.1) 49%, rgba(0,255,136,0.1) 51%, transparent 52%), linear-gradient(0deg, transparent 48%, rgba(0,255,136,0.1) 49%, rgba(0,255,136,0.1) 51%, transparent 52%)',
            size: '40px 40px',
            bg: '#0a0a14'
        },
        'pattern-stars': {
            name: '⭐ Starfield',
            type: 'pattern',
            css: 'radial-gradient(2px 2px at 20px 30px, #fff, transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 90px 40px, #fff, transparent), radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 160px 20px, #fff, transparent)',
            size: '200px 100px',
            bg: '#0a0a14'
        }
    },

    init() {
        // Inject animation keyframes
        this.injectAnimations();

        const saved = localStorage.getItem('wallpaper');
        if (saved && this.wallpapers[saved]) {
            this.apply(saved);
        }
    },

    injectAnimations() {
        if (this.animationStyleEl) return;

        this.animationStyleEl = document.createElement('style');
        this.animationStyleEl.textContent = `
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        document.head.appendChild(this.animationStyleEl);
    },

    apply(wallpaperId) {
        const wallpaper = this.wallpapers[wallpaperId];
        if (!wallpaper) return;

        this.currentWallpaper = wallpaperId;
        const body = document.body;

        // Reset all styles first
        body.style.backgroundImage = '';
        body.style.backgroundColor = '';
        body.style.backgroundSize = '';
        body.style.backgroundPosition = '';
        body.style.backgroundRepeat = '';
        body.style.animation = '';

        switch (wallpaper.type) {
            case 'none':
                // Just use the theme's background color
                break;

            case 'animated':
                body.style.backgroundImage = wallpaper.css;
                body.style.backgroundSize = wallpaper.size || '400% 400%';
                body.style.animation = wallpaper.animation;
                break;

            case 'gradient':
                body.style.backgroundImage = wallpaper.css;
                body.style.backgroundSize = 'cover';
                body.style.backgroundPosition = 'center';
                break;

            case 'image':
                body.style.backgroundImage = `url('${wallpaper.url}')`;
                body.style.backgroundSize = 'cover';
                body.style.backgroundPosition = 'center';
                body.style.backgroundRepeat = 'no-repeat';
                break;

            case 'pattern':
                body.style.backgroundImage = wallpaper.css;
                body.style.backgroundColor = wallpaper.bg || 'var(--background)';
                if (wallpaper.size) {
                    body.style.backgroundSize = wallpaper.size;
                }
                break;
        }

        localStorage.setItem('wallpaper', wallpaperId);
    },

    getList() {
        const categories = {
            'animated': { name: '✨ Animated', items: [] },
            'gradient': { name: '🎨 Gradients', items: [] },
            'pattern': { name: '📐 Patterns', items: [] },
            'none': { name: '⚫ None', items: [] }
        };

        Object.entries(this.wallpapers).forEach(([id, data]) => {
            const type = data.type || 'gradient';
            if (categories[type]) {
                categories[type].items.push({
                    id,
                    name: data.name,
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
