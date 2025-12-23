// ================================================
// BOOT SEQUENCE MODULE
// ================================================

export const BootSequence = {
    overlay: null,
    content: null,

    init() {
        this.overlay = document.getElementById('boot-overlay');
        this.content = document.getElementById('boot-content');
    },

    async run() {
        if (!this.overlay || !this.content) {
            this.init();
        }
        if (!this.overlay || !this.content) return;

        const lines = [
            'GABRIEL_OS BIOS v1.0',
            'Copyright (C) 2024 Gabriel Mendes Lopes',
            '',
            'Detecting hardware...',
            '  CPU: JavaScript V8 Engine @ ∞MHz',
            '  RAM: 16384 KB OK',
            '  GPU: CSS3/Canvas Renderer',
            '',
            'Loading modules...',
        ];

        for (const line of lines) {
            this.content.innerHTML += line + '\n';
            await this.delay(50);
        }

        const modules = [
            'ThemeManager',
            'WindowManager',
            'GamesApp',
            'MusicApp',
            'ParticleSystem',
            'AchievementEngine'
        ];

        for (const mod of modules) {
            this.content.innerHTML += `  [OK] ${mod}\n`;
            await this.delay(80);
        }

        this.content.innerHTML += '\nStarting gabriel_os...\n';
        await this.delay(300);

        this.content.innerHTML += '\n<div class="boot-progress"><div class="boot-progress-bar" id="boot-progress"></div></div>';

        const progressBar = document.getElementById('boot-progress');
        for (let i = 0; i <= 100; i += 5) {
            progressBar.style.width = i + '%';
            await this.delay(30);
        }

        await this.delay(200);
        this.overlay.classList.add('fade-out');
        await this.delay(500);
        this.overlay.classList.add('hidden');
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
