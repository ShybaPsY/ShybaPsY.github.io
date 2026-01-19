// ================================================
// BOOT SEQUENCE MODULE
// ================================================

import { i18n, t } from '../i18n/i18n.js';

export const BootSequence = {
    overlay: null,
    content: null,
    selectedLang: null,

    init() {
        this.overlay = document.getElementById('boot-overlay');
        this.content = document.getElementById('boot-content');
    },

    async run() {
        if (!this.overlay || !this.content) {
            this.init();
        }
        if (!this.overlay || !this.content) return null;

        // STEP 1: Show language selector first
        await this.showLanguageSelector();

        // STEP 2: Initialize i18n with selected language
        await i18n.init(this.selectedLang);

        // STEP 3: Continue boot with translated messages
        await this.runBootSequence();

        return this.selectedLang;
    },

    async showLanguageSelector() {
        this.content.innerHTML = `
            <div class="boot-language-select">
                <div class="boot-lang-title">SELECT LANGUAGE / SELECIONE O IDIOMA</div>
                <div class="boot-lang-divider">════════════════════════════════════════</div>
                <div class="boot-lang-options">
                    <div class="boot-lang-option" data-lang="pt" tabindex="0">
                        <span class="boot-lang-key">[1]</span>
                        <span class="boot-lang-flag">🇧🇷</span>
                        <span class="boot-lang-name">Português (BR)</span>
                    </div>
                    <div class="boot-lang-option" data-lang="en" tabindex="0">
                        <span class="boot-lang-key">[2]</span>
                        <span class="boot-lang-flag">🇺🇸</span>
                        <span class="boot-lang-name">English (US)</span>
                    </div>
                </div>
                <div class="boot-lang-hint">
                    Press 1/2 or click to select • Pressione 1/2 ou clique para selecionar
                </div>
            </div>
        `;

        return new Promise(resolve => {
            const handleSelect = (lang) => {
                this.selectedLang = lang;
                document.removeEventListener('keydown', keyHandler);

                // Visual feedback
                const selectedOption = this.content.querySelector(`[data-lang="${lang}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('selected');
                }

                setTimeout(resolve, 200);
            };

            const keyHandler = (e) => {
                if (e.key === '1') handleSelect('pt');
                if (e.key === '2') handleSelect('en');
            };

            document.addEventListener('keydown', keyHandler);

            this.content.querySelectorAll('.boot-lang-option').forEach(opt => {
                opt.addEventListener('click', () => handleSelect(opt.dataset.lang));
                opt.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(opt.dataset.lang);
                    }
                });
            });

            // Focus first option for keyboard navigation
            const firstOption = this.content.querySelector('.boot-lang-option');
            if (firstOption) firstOption.focus();
        });
    },

    async runBootSequence() {
        this.content.innerHTML = '';

        const lines = [
            t('boot.bios_title'),
            t('boot.copyright'),
            '',
            t('boot.detecting_hardware'),
            '  ' + t('boot.cpu'),
            '  ' + t('boot.ram'),
            '  ' + t('boot.gpu'),
            '',
            t('boot.loading_modules'),
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

        this.content.innerHTML += '\n' + t('boot.starting') + '\n';
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
