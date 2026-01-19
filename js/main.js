// ================================================
// MAIN ENTRY POINT
// ================================================

// i18n module (must be imported first)
import { i18n, t } from './i18n/i18n.js';

// Core modules
import { ThemeManager } from './core/theme-manager.js';
import { WindowManager } from './core/window-manager.js';
import { KeyboardShortcuts } from './core/keyboard-shortcuts.js';

// UI modules
import { Taskbar } from './ui/taskbar.js';
import { ContextMenu } from './ui/context-menu.js';
import { DesktopIcons } from './ui/desktop-icons.js';

// Effects modules
import { BootSequence } from './effects/boot-sequence.js';
import { ParticleBackground } from './effects/particles.js';
import { MatrixEffect } from './effects/matrix.js';

// Apps modules
import { ThemePickerApp } from './apps/theme-picker.js';
import { ASCIIPlayerApp } from './apps/ascii-player.js';
import { MusicApp } from './apps/music-player.js';
import { NotepadApp } from './apps/notepad.js';
import { CalculatorApp } from './apps/calculator.js';

// Games module
import { GamesApp } from './games/games-app.js';

// Projetos module
import { ProjetosApp } from './apps/projetos-app.js';

// Terminal module
import { Terminal } from './terminal/terminal.js';

// Features modules
import { AchievementManager } from './features/achievements.js';
import { Spotlight } from './features/spotlight.js';
import { DesktopPet } from './features/desktop-pet.js';
import { EasterEggs } from './features/easter-eggs.js';

// API modules
import { GitHubAPI } from './api/github-api.js';
import { QuoteAPI } from './api/quote-api.js';

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', async () => {
    const terminal = document.getElementById('terminal');
    const terminalHeader = document.getElementById('terminal-header');
    const commandInput = document.getElementById('command-input');

    // Initialize achievement manager first to load saved achievements
    AchievementManager.init();

    // Initialize apps with their dependencies
    ThemePickerApp.init(WindowManager, ThemeManager, AchievementManager);
    ASCIIPlayerApp.init(WindowManager, AchievementManager);
    MusicApp.init(WindowManager, AchievementManager);
    GamesApp.init(WindowManager, AchievementManager);
    ProjetosApp.init(WindowManager, AchievementManager);
    NotepadApp.init(WindowManager, AchievementManager);
    CalculatorApp.init(WindowManager, AchievementManager);

    // Initialize terminal with all dependencies
    Terminal.init({
        ThemeManager,
        WindowManager,
        AchievementManager,
        MatrixEffect,
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        ProjetosApp,
        GitHubAPI,
        QuoteAPI
    });

    // Initialize desktop icons
    DesktopIcons.init({
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        ProjetosApp,
        NotepadApp,
        CalculatorApp
    });

    // Initialize context menu
    ContextMenu.init({
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        ProjetosApp,
        NotepadApp,
        CalculatorApp,
        Terminal
    });

    // Initialize keyboard shortcuts
    KeyboardShortcuts.init({
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        WindowManager,
        commandInput
    });

    // Initialize Spotlight search
    Spotlight.init({
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
        ProjetosApp,
        NotepadApp,
        CalculatorApp,
        Terminal
    });

    // Initialize taskbar and connect to WindowManager
    Taskbar.init(WindowManager, commandInput, terminal);
    WindowManager.setTaskbar(Taskbar);

    // ================================================
    // TERMINAL DRAG FUNCTIONALITY
    // ================================================
    if (terminal && terminalHeader) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let rafId = null;
        let targetX = 0, targetY = 0;
        let snapZone = null;

        const startDragging = (e) => {
            if (e.target.closest('.button') || e.target.closest('.buttons')) {
                return;
            }
            if (e.type === 'mousedown' && e.button !== 0) return;

            // If snapped or maximized, restore first
            if (terminal.classList.contains('snapped-left') ||
                terminal.classList.contains('snapped-right') ||
                terminal.classList.contains('maximized')) {
                terminal.classList.remove('snapped-left', 'snapped-right', 'maximized');
                if (terminal.dataset.prevWidth) {
                    terminal.style.width = terminal.dataset.prevWidth;
                    terminal.style.height = terminal.dataset.prevHeight;
                }
                // Center on cursor
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                offsetX = terminal.offsetWidth / 2;
                offsetY = 20;
                terminal.style.left = `${clientX - offsetX}px`;
                terminal.style.top = `${clientY - offsetY}px`;
                isDragging = true;
                terminalHeader.classList.add('dragging');
                document.body.classList.add('dragging-terminal');
                terminal.style.zIndex = ++WindowManager.highestZIndex;
                terminal.style.willChange = 'left, top';
                if (e.type === 'touchstart') e.preventDefault();
                return;
            }

            isDragging = true;
            const rect = terminal.getBoundingClientRect();

            if (e.touches) {
                offsetX = e.touches[0].clientX - rect.left;
                offsetY = e.touches[0].clientY - rect.top;
            } else {
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            }

            terminalHeader.classList.add('dragging');
            document.body.classList.add('dragging-terminal');
            terminal.style.zIndex = ++WindowManager.highestZIndex;
            terminal.style.willChange = 'left, top';

            if (e.type === 'touchstart') {
                e.preventDefault();
            }
        };

        const handleDragging = (e) => {
            if (!isDragging) return;

            let clientX, clientY;
            if (e.touches) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            const maxLeft = window.innerWidth - terminal.offsetWidth;
            const maxTop = window.innerHeight - terminal.offsetHeight - 48;

            targetX = Math.max(0, Math.min(clientX - offsetX, maxLeft));
            targetY = Math.max(0, Math.min(clientY - offsetY, maxTop));

            // Detect snap zones
            snapZone = WindowManager.detectSnapZone(clientX, clientY);
            WindowManager.showSnapPreview(snapZone);

            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    terminal.style.left = `${targetX}px`;
                    terminal.style.top = `${targetY}px`;
                    rafId = null;
                });
            }

            if (e.type === 'touchmove') {
                e.preventDefault();
            }
        };

        const stopDragging = () => {
            if (!isDragging) return;
            isDragging = false;
            terminalHeader.classList.remove('dragging');
            document.body.classList.remove('dragging-terminal');
            terminal.style.willChange = '';

            // Apply snap if in zone
            if (snapZone) {
                WindowManager.applySnap(terminal, snapZone);
            }
            WindowManager.hideSnapPreview();
            snapZone = null;

            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };

        terminalHeader.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', handleDragging);
        document.addEventListener('mouseup', stopDragging);
        terminalHeader.addEventListener('touchstart', startDragging, { passive: false });
        document.addEventListener('touchmove', handleDragging, { passive: false });
        document.addEventListener('touchend', stopDragging);
        document.addEventListener('touchcancel', stopDragging);
        window.addEventListener('blur', stopDragging);

        // Bring terminal to front when clicked anywhere on it
        terminal.addEventListener('mousedown', () => {
            terminal.style.zIndex = ++WindowManager.highestZIndex;
        });

        // Center terminal on load
        const centerTerminal = () => {
            const left = (window.innerWidth - terminal.offsetWidth) / 2;
            const top = (window.innerHeight - terminal.offsetHeight - 48) / 2;
            terminal.style.left = `${Math.max(0, left)}px`;
            terminal.style.top = `${Math.max(0, top)}px`;
        };

        // Keep terminal in viewport on resize
        window.addEventListener('resize', () => {
            if (!isDragging) {
                const rect = terminal.getBoundingClientRect();
                const maxLeft = window.innerWidth - terminal.offsetWidth;
                const maxTop = window.innerHeight - terminal.offsetHeight - 48;

                if (rect.left > maxLeft || rect.top > maxTop) {
                    terminal.style.left = `${Math.max(0, Math.min(rect.left, maxLeft))}px`;
                    terminal.style.top = `${Math.max(0, Math.min(rect.top, maxTop))}px`;
                }
            }
        });

        // Initialize terminal position
        requestAnimationFrame(() => {
            terminal.style.position = 'absolute';
            terminal.style.margin = '0';
            centerTerminal();
        });
    }

    // ================================================
    // TERMINAL RESIZE FUNCTIONALITY
    // ================================================
    if (terminal) {
        const MIN_WIDTH = 400;
        const MIN_HEIGHT = 300;
        let resizeRafId = null;

        const resizeState = {
            isResizing: false,
            direction: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            startLeft: 0,
            startTop: 0,
            newWidth: 0,
            newHeight: 0,
            newLeft: 0,
            newTop: 0
        };

        const resizeHandles = terminal.querySelectorAll('.resize-handle');

        const getResizeEventPosition = (event) => {
            if (event.touches && event.touches.length > 0) {
                return { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
            if (event.changedTouches && event.changedTouches.length > 0) {
                return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
            }
            if (typeof event.clientX === 'number') {
                return { x: event.clientX, y: event.clientY };
            }
            return null;
        };

        const startResize = (event) => {
            const handle = event.target;
            if (!handle.dataset.resize) return;

            event.preventDefault();
            event.stopPropagation();

            const position = getResizeEventPosition(event);
            if (!position) return;

            const rect = terminal.getBoundingClientRect();

            resizeState.isResizing = true;
            resizeState.direction = handle.dataset.resize;
            resizeState.startX = position.x;
            resizeState.startY = position.y;
            resizeState.startWidth = rect.width;
            resizeState.startHeight = rect.height;
            resizeState.startLeft = parseFloat(terminal.style.left) || 0;
            resizeState.startTop = parseFloat(terminal.style.top) || 0;

            document.body.classList.add('resizing-terminal');
            document.body.style.cursor = window.getComputedStyle(handle).cursor;
            terminal.style.willChange = 'width, height, left, top';
        };

        const handleResize = (event) => {
            if (!resizeState.isResizing) return;

            const position = getResizeEventPosition(event);
            if (!position) return;

            const deltaX = position.x - resizeState.startX;
            const deltaY = position.y - resizeState.startY;
            const dir = resizeState.direction;

            resizeState.newWidth = resizeState.startWidth;
            resizeState.newHeight = resizeState.startHeight;
            resizeState.newLeft = resizeState.startLeft;
            resizeState.newTop = resizeState.startTop;

            if (dir.includes('e')) {
                resizeState.newWidth = Math.max(MIN_WIDTH, resizeState.startWidth + deltaX);
            }
            if (dir.includes('w')) {
                const potentialWidth = resizeState.startWidth - deltaX;
                if (potentialWidth >= MIN_WIDTH) {
                    resizeState.newWidth = potentialWidth;
                    resizeState.newLeft = resizeState.startLeft + deltaX;
                }
            }
            if (dir.includes('s')) {
                resizeState.newHeight = Math.max(MIN_HEIGHT, resizeState.startHeight + deltaY);
            }
            if (dir.includes('n')) {
                const potentialHeight = resizeState.startHeight - deltaY;
                if (potentialHeight >= MIN_HEIGHT) {
                    resizeState.newHeight = potentialHeight;
                    resizeState.newTop = resizeState.startTop + deltaY;
                }
            }

            if (!resizeRafId) {
                resizeRafId = requestAnimationFrame(() => {
                    terminal.style.width = `${resizeState.newWidth}px`;
                    terminal.style.height = `${resizeState.newHeight}px`;
                    terminal.style.maxWidth = 'none';
                    terminal.style.maxHeight = 'none';
                    terminal.style.left = `${resizeState.newLeft}px`;
                    terminal.style.top = `${resizeState.newTop}px`;
                    resizeRafId = null;
                });
            }
        };

        const stopResize = () => {
            if (!resizeState.isResizing) return;

            resizeState.isResizing = false;
            resizeState.direction = null;
            document.body.classList.remove('resizing-terminal');
            document.body.style.cursor = '';
            terminal.style.willChange = '';
            if (resizeRafId) {
                cancelAnimationFrame(resizeRafId);
                resizeRafId = null;
            }
        };

        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', startResize);
            handle.addEventListener('touchstart', startResize, { passive: false });
        });

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('touchmove', handleResize, { passive: false });
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        document.addEventListener('touchcancel', stopResize);
    }

    // ================================================
    // TERMINAL WINDOW CONTROLS (Minimize, Maximize, Close)
    // ================================================
    const TerminalControls = {
        isMinimized: false,
        isMaximized: false,
        isClosed: false,
        prevState: null,

        init() {
            const closeBtn = terminal.querySelector('.button.red');
            const minimizeBtn = terminal.querySelector('.button.yellow');
            const maximizeBtn = terminal.querySelector('.button.green');

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.close();
                });
            }

            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.minimize();
                });
            }

            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleMaximize();
                });
            }

            // Add terminal to taskbar on init
            Taskbar.addWindow('terminal', 'Terminal');
        },

        close() {
            if (this.isClosed) return;

            this.isClosed = true;
            this.isMinimized = false;
            terminal.classList.add('minimizing');

            setTimeout(() => {
                terminal.classList.remove('minimizing');
                terminal.classList.add('minimized');
                Taskbar.removeWindow('terminal');
            }, 300);
        },

        open() {
            if (!this.isClosed) {
                this.focus();
                return;
            }

            this.isClosed = false;
            this.isMinimized = false;
            terminal.classList.remove('minimized');
            terminal.classList.add('restoring');

            setTimeout(() => {
                terminal.classList.remove('restoring');
            }, 300);

            terminal.style.zIndex = ++WindowManager.highestZIndex;
            Taskbar.addWindow('terminal', 'Terminal');

            // Reset terminal content
            Terminal.reset();
        },

        minimize() {
            if (this.isMinimized || this.isClosed) return;

            this.isMinimized = true;
            terminal.classList.add('minimizing');

            setTimeout(() => {
                terminal.classList.remove('minimizing');
                terminal.classList.add('minimized');
                Taskbar.updateWindow('terminal', true);
            }, 300);
        },

        restore() {
            if (!this.isMinimized) return;

            this.isMinimized = false;
            terminal.classList.remove('minimized');
            terminal.classList.add('restoring');

            setTimeout(() => {
                terminal.classList.remove('restoring');
            }, 300);

            terminal.style.zIndex = ++WindowManager.highestZIndex;
            Taskbar.updateWindow('terminal', false);
            commandInput.focus();
        },

        toggleMaximize() {
            const TASKBAR_HEIGHT = 48;

            if (this.isMaximized) {
                // Restore previous size
                terminal.classList.add('maximizing');
                if (this.prevState) {
                    terminal.style.width = this.prevState.width;
                    terminal.style.height = this.prevState.height;
                    terminal.style.left = this.prevState.left;
                    terminal.style.top = this.prevState.top;
                }
                terminal.classList.remove('maximized');
                this.isMaximized = false;

                setTimeout(() => {
                    terminal.classList.remove('maximizing');
                }, 250);
            } else {
                // Save current state
                this.prevState = {
                    width: terminal.style.width || `${terminal.offsetWidth}px`,
                    height: terminal.style.height || `${terminal.offsetHeight}px`,
                    left: terminal.style.left || `${terminal.offsetLeft}px`,
                    top: terminal.style.top || `${terminal.offsetTop}px`
                };

                // Maximize
                terminal.classList.add('maximizing');
                terminal.style.width = '100vw';
                terminal.style.height = `calc(100vh - ${TASKBAR_HEIGHT}px)`;
                terminal.style.left = '0';
                terminal.style.top = '0';
                terminal.classList.add('maximized');
                this.isMaximized = true;

                setTimeout(() => {
                    terminal.classList.remove('maximizing');
                }, 250);
            }
        },

        focus() {
            if (this.isClosed) {
                this.open();
            } else if (this.isMinimized) {
                this.restore();
            } else {
                terminal.style.zIndex = ++WindowManager.highestZIndex;
                commandInput.focus();
            }
        }
    };

    // Initialize terminal controls
    TerminalControls.init();

    // Listen for terminal-closed event from exit command
    window.addEventListener('terminal-closed', () => {
        TerminalControls.close();
    });

    // Listen for open-terminal event from context menu
    window.addEventListener('open-terminal', () => {
        TerminalControls.open();
    });

    // Update taskbar to handle terminal clicks
    const originalHandleWindowClick = Taskbar.handleWindowClick.bind(Taskbar);
    Taskbar.handleWindowClick = function (appId) {
        if (appId === 'terminal') {
            TerminalControls.focus();
        } else {
            originalHandleWindowClick(appId);
        }
    };

    // Update start button to open terminal
    const startBtn = document.getElementById('taskbar-start');
    if (startBtn) {
        // Remove old listener by cloning
        const newStartBtn = startBtn.cloneNode(true);
        startBtn.parentNode.replaceChild(newStartBtn, startBtn);

        newStartBtn.addEventListener('click', () => {
            TerminalControls.open();
        });
    }

    // ================================================
    // STARTUP SEQUENCE
    // ================================================
    async function startup() {
        // Run boot sequence first (includes language selection)
        await BootSequence.run();

        // Update all elements with data-i18n attributes
        i18n.updatePageTranslations();

        // Initialize all systems
        ParticleBackground.init();

        // Initialize Desktop Pet
        DesktopPet.init();

        // Initialize Easter Eggs
        EasterEggs.init();

        // Show welcome message
        await Terminal.showWelcome();
    }

    startup();
});
