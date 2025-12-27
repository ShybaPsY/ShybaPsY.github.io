// ================================================
// WALLPAPER MANAGER MODULE
// ================================================

export const WallpaperManager = {
    currentWallpaper: 'none',

    wallpapers: {
        'none': {
            name: 'Nenhum',
            css: 'none'
        },
        'gradient-sunset': {
            name: 'Pôr do Sol',
            css: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #e94560 100%)'
        },
        'gradient-ocean': {
            name: 'Oceano',
            css: 'linear-gradient(180deg, #0c0c1e 0%, #1a1a3e 20%, #0d47a1 50%, #1565c0 70%, #42a5f5 100%)'
        },
        'gradient-forest': {
            name: 'Floresta',
            css: 'linear-gradient(160deg, #0d1b0e 0%, #1a3a1c 30%, #2d5a2e 60%, #4a7c4b 100%)'
        },
        'gradient-aurora': {
            name: 'Aurora',
            css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 30%, #24243e 50%, #0f0c29 70%, #44337a 90%, #1a1a2e 100%)'
        },
        'gradient-cyber': {
            name: 'Cyberpunk',
            css: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 25%, #2d1b4e 50%, #0a1a2e 75%, #0a0a1a 100%)'
        },
        'pattern-grid': {
            name: 'Grid',
            css: 'repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.03) 50px), repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.03) 50px), var(--background)'
        },
        'pattern-dots': {
            name: 'Dots',
            css: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px), var(--background)',
            size: '20px 20px'
        },
        'pattern-diagonal': {
            name: 'Diagonal',
            css: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px), var(--background)'
        },
        'pattern-noise': {
            name: 'Ruído',
            css: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.04\'/%3E%3C/svg%3E"), var(--background)'
        }
    },

    init() {
        const saved = localStorage.getItem('wallpaper');
        if (saved && this.wallpapers[saved]) {
            this.apply(saved);
        }
    },

    apply(wallpaperId) {
        const wallpaper = this.wallpapers[wallpaperId];
        if (!wallpaper) return;

        this.currentWallpaper = wallpaperId;
        const body = document.body;

        if (wallpaperId === 'none') {
            body.style.backgroundImage = '';
            body.style.backgroundSize = '';
        } else {
            body.style.backgroundImage = wallpaper.css;
            body.style.backgroundSize = wallpaper.size || 'cover';
        }

        localStorage.setItem('wallpaper', wallpaperId);
    },

    getList() {
        return Object.entries(this.wallpapers).map(([id, data]) => ({
            id,
            name: data.name,
            isActive: id === this.currentWallpaper
        }));
    }
};
