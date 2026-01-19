// ================================================
// SPOTLIGHT SEARCH MODULE
// ================================================

import { t } from '../i18n/i18n.js';

export const Spotlight = {
    element: null,
    input: null,
    results: null,
    apps: null,
    isOpen: false,
    selectedIndex: 0,
    searchItems: [],

    init(apps) {
        this.apps = apps;
        this.createDOM();
        this.setupKeyboardShortcut();
        this.buildSearchIndex();
    },

    createDOM() {
        const overlay = document.createElement('div');
        overlay.id = 'spotlight-overlay';
        overlay.innerHTML = `
            <div id="spotlight">
                <div id="spotlight-input-wrapper">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" id="spotlight-input" data-i18n-placeholder="spotlight.placeholder" placeholder="Search apps, commands, games..." autocomplete="off">
                </div>
                <div id="spotlight-results"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.element = overlay;
        this.input = overlay.querySelector('#spotlight-input');
        this.results = overlay.querySelector('#spotlight-results');

        // Events
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        this.input.addEventListener('input', () => this.search());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    buildSearchIndex() {
        this.searchItems = [
            // Apps
            { type: 'app', name: 'Terminal', icon: '💻', action: () => window.dispatchEvent(new CustomEvent('open-terminal')) },
            { type: 'app', name: 'Themes', icon: '🎨', action: () => this.apps.ThemePickerApp?.open() },
            { type: 'app', name: 'Games', icon: '🎮', action: () => this.apps.GamesApp?.open() },
            { type: 'app', name: 'Music', icon: '🎵', action: () => this.apps.MusicApp?.open() },
            { type: 'app', name: 'ASCII Player', icon: '🎬', action: () => this.apps.ASCIIPlayerApp?.open() },
            { type: 'app', name: 'Notepad', icon: '📝', action: () => this.apps.NotepadApp?.open() },
            { type: 'app', nameKey: 'spotlight.calculator', icon: '🔢', action: () => this.apps.CalculatorApp?.open() },

            // Terminal Commands
            { type: 'command', name: 'sobre', descKey: 'spotlight.sobre_desc', icon: '👤', action: () => this.runCommand('sobre') },
            { type: 'command', name: 'experiencia', descKey: 'spotlight.experiencia_desc', icon: '💼', action: () => this.runCommand('experiencia') },
            { type: 'command', name: 'projetos', descKey: 'spotlight.projetos_desc', icon: '📁', action: () => this.runCommand('projetos') },
            { type: 'command', name: 'skills', descKey: 'spotlight.skills_desc', icon: '⚡', action: () => this.runCommand('skills') },
            { type: 'command', name: 'contato', descKey: 'spotlight.contato_desc', icon: '📧', action: () => this.runCommand('contato') },
            { type: 'command', name: 'github', descKey: 'spotlight.github_desc', icon: '🐙', action: () => this.runCommand('github') },
            { type: 'command', name: 'quote', descKey: 'spotlight.quote_desc', icon: '💬', action: () => this.runCommand('quote') },
            { type: 'command', name: 'matrix', descKey: 'spotlight.matrix_desc', icon: '🟩', action: () => this.runCommand('matrix') },
            { type: 'command', name: 'clear', descKey: 'spotlight.clear_desc', icon: '🧹', action: () => this.runCommand('clear') },

            // Games
            { type: 'game', name: 'Snake', icon: '🐍', action: () => this.openGame('snake') },
            { type: 'game', name: 'Pong', icon: '🏓', action: () => this.openGame('pong') },
            { type: 'game', name: 'Tetris', icon: '🧱', action: () => this.openGame('tetris') },
            { type: 'game', name: '2048', icon: '🔢', action: () => this.openGame('2048') },
            { type: 'game', name: 'Breakout', icon: '🧱', action: () => this.openGame('breakout') },
            { type: 'game', name: 'Space Invaders', icon: '👾', action: () => this.openGame('space-invaders') },
            { type: 'game', name: 'Asteroids', icon: '☄️', action: () => this.openGame('asteroids') },
            { type: 'game', name: 'Dino Run', icon: '🦕', action: () => this.openGame('dino') },
            { type: 'game', name: 'Flappy Bird', icon: '🐦', action: () => this.openGame('flappy') },
            { type: 'game', name: 'Minesweeper', icon: '💣', action: () => this.openGame('minesweeper') },
            { type: 'game', name: 'Memory', icon: '🧠', action: () => this.openGame('memory') },

            // Quick Actions
            { type: 'action', nameKey: 'spotlight.toggle_crt_action', descKey: 'spotlight.toggle_crt_desc', icon: '📺', action: () => this.toggleCRT() },
            { type: 'action', nameKey: 'spotlight.download_cv_action', descKey: 'spotlight.download_cv_desc', icon: '📄', action: () => this.runCommand('download cv') },
        ];
    },

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Space or Cmd+Space
            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault();
                this.toggle();
            }
            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.isOpen = true;
        this.element.classList.add('visible');
        this.input.value = '';
        this.input.placeholder = t('spotlight.placeholder');
        this.input.focus();
        this.search(); // Show all items
    },

    close() {
        this.isOpen = false;
        this.element.classList.remove('visible');
        this.input.blur();
    },

    search() {
        const query = this.input.value.toLowerCase().trim();
        let filtered = this.searchItems;

        if (query) {
            filtered = this.searchItems.filter(item => {
                const name = (item.nameKey ? t(item.nameKey) : item.name).toLowerCase();
                const desc = (item.descKey ? t(item.descKey) : item.description || '').toLowerCase();
                return name.includes(query) || desc.includes(query) || this.fuzzyMatch(name, query);
            });
        }

        // Sort by relevance
        if (query) {
            filtered.sort((a, b) => {
                const aName = (a.nameKey ? t(a.nameKey) : a.name).toLowerCase();
                const bName = (b.nameKey ? t(b.nameKey) : b.name).toLowerCase();
                const aStarts = aName.startsWith(query);
                const bStarts = bName.startsWith(query);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return 0;
            });
        }

        this.selectedIndex = 0;
        this.renderResults(filtered);
    },

    fuzzyMatch(str, query) {
        let queryIdx = 0;
        for (let i = 0; i < str.length && queryIdx < query.length; i++) {
            if (str[i] === query[queryIdx]) queryIdx++;
        }
        return queryIdx === query.length;
    },

    renderResults(items) {
        if (items.length === 0) {
            this.results.innerHTML = `<div class="spotlight-empty">${t('spotlight.no_results')}</div>`;
            return;
        }

        // Group by type
        const grouped = {
            app: { label: t('spotlight.apps'), items: [] },
            command: { label: t('spotlight.commands'), items: [] },
            game: { label: t('spotlight.games'), items: [] },
            action: { label: t('spotlight.actions'), items: [] }
        };

        items.forEach(item => {
            if (grouped[item.type]) {
                grouped[item.type].items.push(item);
            }
        });

        let html = '';
        let globalIndex = 0;

        for (const [type, group] of Object.entries(grouped)) {
            if (group.items.length === 0) continue;

            html += `<div class="spotlight-group">
                <div class="spotlight-group-label">${group.label}</div>`;

            group.items.forEach(item => {
                const isSelected = globalIndex === this.selectedIndex;
                const itemName = item.nameKey ? t(item.nameKey) : item.name;
                const itemDesc = item.descKey ? t(item.descKey) : item.description;
                html += `<div class="spotlight-item ${isSelected ? 'selected' : ''}" data-index="${globalIndex}">
                    <span class="spotlight-icon">${item.icon}</span>
                    <div class="spotlight-item-text">
                        <span class="spotlight-name">${itemName}</span>
                        ${itemDesc ? `<span class="spotlight-desc">${itemDesc}</span>` : ''}
                    </div>
                </div>`;
                globalIndex++;
            });

            html += '</div>';
        }

        this.results.innerHTML = html;
        this.currentItems = items;

        // Click handlers
        this.results.querySelectorAll('.spotlight-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                this.executeItem(this.currentItems[idx]);
            });
        });
    },

    handleKeydown(e) {
        const items = this.currentItems || [];
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % items.length;
            this.updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
            this.updateSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (items[this.selectedIndex]) {
                this.executeItem(items[this.selectedIndex]);
            }
        }
    },

    updateSelection() {
        this.results.querySelectorAll('.spotlight-item').forEach((el, i) => {
            el.classList.toggle('selected', i === this.selectedIndex);
            if (i === this.selectedIndex) {
                el.scrollIntoView({ block: 'nearest' });
            }
        });
    },

    executeItem(item) {
        this.close();
        setTimeout(() => item.action(), 100);
    },

    runCommand(cmd) {
        window.dispatchEvent(new CustomEvent('open-terminal'));
        setTimeout(() => {
            this.apps.Terminal?.executeCommand(cmd);
        }, 300);
    },

    openGame(gameId) {
        if (this.apps.GamesApp) {
            this.apps.GamesApp.open();
            setTimeout(() => {
                this.apps.GamesApp.startGame?.(gameId);
            }, 300);
        }
    },

    toggleCRT() {
        document.body.classList.toggle('crt-enabled');
        const crtBtn = document.getElementById('taskbar-crt');
        if (crtBtn) crtBtn.classList.toggle('active');
        localStorage.setItem('crt-enabled', document.body.classList.contains('crt-enabled'));
    }
};
