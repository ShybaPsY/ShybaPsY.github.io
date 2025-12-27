// ================================================
// NOTEPAD APP MODULE
// ================================================

export const NotepadApp = {
    WindowManager: null,
    AchievementManager: null,
    tabs: [],
    activeTab: 0,
    tabCounter: 0,

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;
    },

    open() {
        if (this.WindowManager.windows['notepad']) {
            this.WindowManager.focusWindow('notepad');
            return;
        }

        this.tabs = [];
        this.activeTab = 0;
        this.tabCounter = 0;

        // Load saved notes
        this.loadNotes();

        // If no notes, create a new one
        if (this.tabs.length === 0) {
            this.tabs.push({ id: this.tabCounter++, name: 'Sem título', content: '' });
        }

        const content = this.renderContent();
        const windowEl = this.WindowManager.createWindow('notepad', 'Notepad', 600, 450, content);

        this.WindowManager.registerCleanup('notepad', () => this.cleanup());
        this.AchievementManager?.trackApp('notepad');

        this.attachEvents(windowEl);
    },

    renderContent() {
        const tabsHtml = this.tabs.map((tab, i) => `
            <div class="notepad-tab ${i === this.activeTab ? 'active' : ''}" data-tab="${i}">
                <span class="tab-name">${tab.name}</span>
                ${this.tabs.length > 1 ? `<span class="tab-close" data-tab="${i}">&times;</span>` : ''}
            </div>
        `).join('');

        const activeContent = this.tabs[this.activeTab]?.content || '';
        const wordCount = this.countWords(activeContent);
        const charCount = activeContent.length;

        return `
            <div class="notepad-container">
                <div class="notepad-toolbar">
                    <button class="notepad-btn" data-action="new" title="Novo">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="12" y1="18" x2="12" y2="12"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                    </button>
                    <button class="notepad-btn" data-action="save" title="Salvar">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                    </button>
                    <div class="notepad-divider"></div>
                    <button class="notepad-btn" data-action="download" title="Download">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                </div>
                <div class="notepad-tabs">
                    ${tabsHtml}
                    <div class="notepad-tab-add" data-action="new" title="Nova aba">+</div>
                </div>
                <textarea class="notepad-editor" placeholder="Comece a digitar...">${activeContent}</textarea>
                <div class="notepad-status">
                    <span>${wordCount} palavras</span>
                    <span>${charCount} caracteres</span>
                </div>
            </div>
        `;
    },

    attachEvents(windowEl) {
        const container = windowEl.querySelector('.notepad-container');
        if (!container) return;

        // Toolbar buttons
        container.querySelectorAll('.notepad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'new') this.newTab(windowEl);
                else if (action === 'save') this.saveNotes();
                else if (action === 'download') this.downloadNote();
            });
        });

        // Tab add button
        const addBtn = container.querySelector('.notepad-tab-add');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.newTab(windowEl));
        }

        // Tab clicks
        container.querySelectorAll('.notepad-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    this.closeTab(parseInt(e.target.dataset.tab), windowEl);
                } else {
                    this.switchTab(parseInt(tab.dataset.tab), windowEl);
                }
            });

            // Double click to rename
            tab.querySelector('.tab-name')?.addEventListener('dblclick', (e) => {
                this.renameTab(parseInt(tab.dataset.tab), windowEl);
            });
        });

        // Editor changes
        const editor = container.querySelector('.notepad-editor');
        if (editor) {
            editor.addEventListener('input', () => {
                this.tabs[this.activeTab].content = editor.value;
                this.updateStatus(windowEl);
            });
        }
    },

    newTab(windowEl) {
        this.tabs.push({ id: this.tabCounter++, name: 'Sem título', content: '' });
        this.activeTab = this.tabs.length - 1;
        this.refresh(windowEl);
    },

    closeTab(index, windowEl) {
        if (this.tabs.length <= 1) return;

        this.tabs.splice(index, 1);
        if (this.activeTab >= this.tabs.length) {
            this.activeTab = this.tabs.length - 1;
        }
        this.refresh(windowEl);
    },

    switchTab(index, windowEl) {
        if (index === this.activeTab) return;
        this.activeTab = index;
        this.refresh(windowEl);
    },

    renameTab(index, windowEl) {
        const tab = this.tabs[index];
        const newName = prompt('Nome da nota:', tab.name);
        if (newName && newName.trim()) {
            tab.name = newName.trim();
            this.refresh(windowEl);
        }
    },

    refresh(windowEl) {
        const body = windowEl.querySelector('.app-window-body');
        if (body) {
            body.innerHTML = this.renderContent();
            this.attachEvents(windowEl);
        }
    },

    updateStatus(windowEl) {
        const content = this.tabs[this.activeTab]?.content || '';
        const wordCount = this.countWords(content);
        const charCount = content.length;

        const status = windowEl.querySelector('.notepad-status');
        if (status) {
            status.innerHTML = `<span>${wordCount} palavras</span><span>${charCount} caracteres</span>`;
        }
    },

    countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    },

    saveNotes() {
        localStorage.setItem('notepad-notes', JSON.stringify(this.tabs));
    },

    loadNotes() {
        try {
            const saved = localStorage.getItem('notepad-notes');
            if (saved) {
                this.tabs = JSON.parse(saved);
                this.tabCounter = Math.max(...this.tabs.map(t => t.id)) + 1;
            }
        } catch (e) {
            this.tabs = [];
        }
    },

    downloadNote() {
        const tab = this.tabs[this.activeTab];
        if (!tab) return;

        const blob = new Blob([tab.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tab.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    },

    cleanup() {
        this.saveNotes();
    }
};
