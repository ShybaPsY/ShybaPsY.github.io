// ================================================
// MAIN ENTRY POINT
// ================================================

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

// Games module
import { GamesApp } from './games/games-app.js';

// Terminal module
import { Terminal } from './terminal/terminal.js';

// Features modules
import { AchievementManager } from './features/achievements.js';

// API modules
import { GitHubAPI } from './api/github-api.js';
import { QuoteAPI } from './api/quote-api.js';

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', async () => {
    const terminal = document.getElementById('terminal');
    const terminalHeader = document.getElementById('terminal-header');
    const pageBody = document.getElementById('page-body');
    const commandInput = document.getElementById('command-input');

    // Initialize apps with their dependencies
    ThemePickerApp.init(WindowManager, ThemeManager, AchievementManager);
    ASCIIPlayerApp.init(WindowManager, AchievementManager);
    MusicApp.init(WindowManager, AchievementManager);
    GamesApp.init(WindowManager, AchievementManager);

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
        GitHubAPI,
        QuoteAPI
    });

    // Initialize desktop icons
    DesktopIcons.init({
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp
    });

    // Initialize context menu
    ContextMenu.init({
        ThemePickerApp,
        ASCIIPlayerApp,
        MusicApp,
        GamesApp,
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

    // Initialize taskbar and connect to WindowManager
    Taskbar.init(WindowManager, commandInput, terminal);
    WindowManager.setTaskbar(Taskbar);

    // ================================================
    // TERMINAL DRAG FUNCTIONALITY
    // ================================================
    if (terminal && terminalHeader) {
        const dragState = {
            isDragging: false,
            offsetX: 0,
            offsetY: 0
        };

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const getEventPosition = (event) => {
            if (event.touches && event.touches.length > 0) {
                const touch = event.touches[0];
                return { x: touch.clientX, y: touch.clientY };
            }
            if (event.changedTouches && event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                return { x: touch.clientX, y: touch.clientY };
            }
            if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
                return { x: event.clientX, y: event.clientY };
            }
            return null;
        };

        const setTerminalPosition = (left, top) => {
            const bodyRect = pageBody.getBoundingClientRect();
            const maxLeft = Math.max(bodyRect.width - terminal.offsetWidth, 0);
            const maxTop = Math.max(bodyRect.height - terminal.offsetHeight, 0);
            const boundedLeft = clamp(left, 0, maxLeft);
            const boundedTop = clamp(top, 0, maxTop);

            terminal.style.left = `${boundedLeft}px`;
            terminal.style.top = `${boundedTop}px`;
        };

        const ensureTerminalWithinViewport = () => {
            const parsedLeft = parseFloat(terminal.style.left);
            const parsedTop = parseFloat(terminal.style.top);
            const currentLeft = Number.isFinite(parsedLeft) ? parsedLeft : terminal.offsetLeft;
            const currentTop = Number.isFinite(parsedTop) ? parsedTop : terminal.offsetTop;
            setTerminalPosition(currentLeft, currentTop);
        };

        const centerTerminal = () => {
            const bodyRect = pageBody.getBoundingClientRect();
            const centeredLeft = (bodyRect.width - terminal.offsetWidth) / 2;
            const centeredTop = (bodyRect.height - terminal.offsetHeight) / 2;
            setTerminalPosition(centeredLeft, centeredTop);
        };

        const startDragging = (event) => {
            if (event.type === 'mousedown' && event.button !== 0) return;

            const position = getEventPosition(event);
            if (!position) return;

            const terminalRect = terminal.getBoundingClientRect();
            dragState.isDragging = true;
            dragState.offsetX = position.x - terminalRect.left;
            dragState.offsetY = position.y - terminalRect.top;

            terminalHeader.classList.add('dragging');
            pageBody.classList.add('dragging-terminal');

            if (event.type === 'touchstart') {
                event.preventDefault();
            }
        };

        const handleDragging = (event) => {
            if (!dragState.isDragging) return;

            const position = getEventPosition(event);
            if (!position) return;

            const bodyRect = pageBody.getBoundingClientRect();
            const nextLeft = position.x - dragState.offsetX - bodyRect.left;
            const nextTop = position.y - dragState.offsetY - bodyRect.top;

            setTerminalPosition(nextLeft, nextTop);

            if (event.type === 'touchmove') {
                event.preventDefault();
            }
        };

        const stopDragging = () => {
            if (!dragState.isDragging) return;

            dragState.isDragging = false;
            terminalHeader.classList.remove('dragging');
            pageBody.classList.remove('dragging-terminal');
        };

        terminalHeader.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', handleDragging);
        document.addEventListener('mouseup', stopDragging);
        terminalHeader.addEventListener('touchstart', startDragging, { passive: false });
        document.addEventListener('touchmove', handleDragging, { passive: false });
        document.addEventListener('touchend', stopDragging);
        document.addEventListener('touchcancel', stopDragging);
        window.addEventListener('blur', stopDragging);

        window.addEventListener('resize', () => {
            if (!dragState.isDragging) {
                ensureTerminalWithinViewport();
            }
        });

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

        const resizeState = {
            isResizing: false,
            direction: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            startLeft: 0,
            startTop: 0
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

            pageBody.classList.add('resizing-terminal');
            pageBody.style.cursor = window.getComputedStyle(handle).cursor;
        };

        const handleResize = (event) => {
            if (!resizeState.isResizing) return;

            const position = getResizeEventPosition(event);
            if (!position) return;

            const deltaX = position.x - resizeState.startX;
            const deltaY = position.y - resizeState.startY;
            const dir = resizeState.direction;

            let newWidth = resizeState.startWidth;
            let newHeight = resizeState.startHeight;
            let newLeft = resizeState.startLeft;
            let newTop = resizeState.startTop;

            // Handle horizontal resize
            if (dir.includes('e')) {
                newWidth = Math.max(MIN_WIDTH, resizeState.startWidth + deltaX);
            }
            if (dir.includes('w')) {
                const potentialWidth = resizeState.startWidth - deltaX;
                if (potentialWidth >= MIN_WIDTH) {
                    newWidth = potentialWidth;
                    newLeft = resizeState.startLeft + deltaX;
                }
            }

            // Handle vertical resize
            if (dir.includes('s')) {
                newHeight = Math.max(MIN_HEIGHT, resizeState.startHeight + deltaY);
            }
            if (dir.includes('n')) {
                const potentialHeight = resizeState.startHeight - deltaY;
                if (potentialHeight >= MIN_HEIGHT) {
                    newHeight = potentialHeight;
                    newTop = resizeState.startTop + deltaY;
                }
            }

            // Apply new dimensions
            terminal.style.width = `${newWidth}px`;
            terminal.style.height = `${newHeight}px`;
            terminal.style.maxWidth = 'none';
            terminal.style.maxHeight = 'none';
            terminal.style.left = `${newLeft}px`;
            terminal.style.top = `${newTop}px`;
        };

        const stopResize = () => {
            if (!resizeState.isResizing) return;

            resizeState.isResizing = false;
            resizeState.direction = null;
            pageBody.classList.remove('resizing-terminal');
            pageBody.style.cursor = '';
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
    // STARTUP SEQUENCE
    // ================================================
    async function startup() {
        // Run boot sequence first
        await BootSequence.run();

        // Initialize all systems
        ParticleBackground.init();

        // Show welcome message
        await Terminal.showWelcome();
    }

    startup();
});
