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
        // Sem emoji de bandeira: no Windows elas caem para as letras "BR"/"US"
        // desalinhadas. O código do país em caixa é legível em todo sistema.
        this.content.innerHTML = `
            <div class="boot-language-select">
                <div class="boot-lang-title">SELECT LANGUAGE / SELECIONE O IDIOMA</div>
                <div class="boot-lang-divider">${'═'.repeat(80)}</div>
                <div class="boot-lang-options">
                    <button type="button" class="boot-lang-option" data-lang="pt">
                        <span class="boot-lang-key">[1]</span>
                        <span class="boot-lang-flag">BR</span>
                        <span class="boot-lang-name">Português</span>
                    </button>
                    <button type="button" class="boot-lang-option" data-lang="en">
                        <span class="boot-lang-key">[2]</span>
                        <span class="boot-lang-flag">US</span>
                        <span class="boot-lang-name">English</span>
                    </button>
                </div>
                <div class="boot-lang-hint">
                    Press 1/2 or click &middot; Pressione 1/2 ou clique
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
            { text: t('boot.copyright'), cls: 'boot-dim' },
            '',
            t('boot.detecting_hardware'),
            { text: '  ' + t('boot.cpu'), cls: 'boot-dim' },
            { text: '  ' + t('boot.ram'), cls: 'boot-dim' },
            { text: '  ' + t('boot.gpu'), cls: 'boot-dim' },
            '',
            t('boot.loading_modules'),
        ];

        for (const line of lines) {
            this.writeLine(line);
            await this.delay(50);
        }

        const modules = [
            'ThemeManager',
            'WindowManager',
            'GamesApp',
            'MusicApp',
            'AsciiField',
            'AchievementEngine'
        ];

        for (const mod of modules) {
            this.writeLine({ text: `  [ OK ] `, cls: 'boot-ok', suffix: mod });
            await this.delay(80);
        }

        this.writeLine('');
        this.writeLine(t('boot.starting'));
        await this.delay(240);

        // Barra de progresso com borda dithered: a frente da barra passa
        // por ░▒▓ antes de virar █, como um dither de verdade.
        const bar = document.createElement('div');
        bar.className = 'boot-progress';
        this.content.appendChild(bar);

        const WIDTH = 34;
        const EDGE = ['░', '▒', '▓'];
        for (let i = 0; i <= 100; i += 4) {
            const exact = (i / 100) * WIDTH;
            const full = Math.floor(exact);
            const frac = exact - full;
            const edge = full < WIDTH ? EDGE[Math.min(2, Math.floor(frac * 3))] : '';
            const rest = Math.max(0, WIDTH - full - (edge ? 1 : 0));
            bar.innerHTML =
                `[${'█'.repeat(full)}${edge}<span class="boot-dim">${'░'.repeat(rest)}</span>]` +
                `  ${String(i).padStart(3, ' ')}%`;
            await this.delay(26);
        }

        await this.delay(260);
        this.overlay.classList.add('fade-out');
        await this.delay(520);
        this.overlay.classList.add('hidden');
    },

    // Aceita string simples ou { text, cls, suffix }: o texto vem do i18n,
    // o suffix é o nome do módulo, e nenhum dos dois é entrada do usuário.
    writeLine(line) {
        if (typeof line === 'string') {
            this.content.appendChild(document.createTextNode(line + '\n'));
            return;
        }
        const span = document.createElement('span');
        span.className = line.cls || '';
        span.textContent = line.text;
        this.content.appendChild(span);
        if (line.suffix) this.content.appendChild(document.createTextNode(line.suffix));
        this.content.appendChild(document.createTextNode('\n'));
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
