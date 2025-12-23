// ================================================
// TERMINAL PORTFOLIO - MAIN SCRIPT
// Gabriel Mendes Lopes
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const terminal = document.getElementById('terminal');
    const terminalHeader = document.getElementById('terminal-header');
    const output = document.getElementById('output');
    const commandInput = document.getElementById('command-input');
    const terminalBody = document.getElementById('terminal-body');
    const cursor = document.getElementById('cursor');
    const inputMirror = document.getElementById('input-mirror');
    const pageBody = document.body;

    let isCursorLocked = false;

    // === THEME MANAGER ===
    const ThemeManager = {
        themes: {
            'tokyo-night': { name: 'Tokyo Night', description: 'Dark blue with vibrant colors (default)' },
            'dracula': { name: 'Dracula', description: 'Classic purple-based dark theme' },
            'gruvbox': { name: 'Gruvbox', description: 'Warm retro colors' },
            'nord': { name: 'Nord', description: 'Cool arctic-inspired palette' },
            'cyberpunk': { name: 'Cyberpunk', description: 'Futuristic neon vibes' },
            'matrix': { name: 'Matrix', description: 'Green on black hacker style' },
            'catppuccin': { name: 'Catppuccin', description: 'Soothing pastel colors' }
        },
        current: 'tokyo-night',

        apply(themeName) {
            const theme = this.themes[themeName];
            if (!theme) {
                return `<span class="error">Theme "${themeName}" not found.</span>\n\nAvailable themes: ${Object.keys(this.themes).join(', ')}`;
            }

            if (themeName === 'tokyo-night') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', themeName);
            }

            this.current = themeName;

            // Track achievement
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.trackTheme(themeName);
            }

            return `Theme changed to: <span class="highlight">${theme.name}</span>`;
        },

        list() {
            let output = '<span class="highlight">Available Themes:</span>\n\n';
            for (const [key, theme] of Object.entries(this.themes)) {
                const marker = key === this.current ? ' <span class="detail-green">(current)</span>' : '';
                output += `  <span class="output-command">${key}</span>${marker}\n    ${theme.description}\n\n`;
            }
            output += `Use '<span class="output-command">theme [name]</span>' to switch themes.`;
            return output;
        }
    };

    // === WINDOW MANAGER ===
    const WindowManager = {
        windows: {},
        highestZIndex: 10,

        createWindow(appId, title, width, height, content, resizable = true) {
            if (this.windows[appId]) {
                this.focusWindow(appId);
                return this.windows[appId];
            }

            const windowEl = document.createElement('div');
            windowEl.className = 'app-window';
            windowEl.id = `window-${appId}`;
            windowEl.style.width = `${width}px`;
            windowEl.style.height = `${height}px`;
            windowEl.style.left = `${150 + Object.keys(this.windows).length * 30}px`;
            windowEl.style.top = `${80 + Object.keys(this.windows).length * 30}px`;
            windowEl.style.zIndex = ++this.highestZIndex;

            const resizeHandles = resizable ? `
                <div class="app-resize-handle app-resize-e" data-resize="e"></div>
                <div class="app-resize-handle app-resize-s" data-resize="s"></div>
                <div class="app-resize-handle app-resize-se" data-resize="se"></div>
            ` : '';

            windowEl.innerHTML = `
                ${resizeHandles}
                <div class="app-window-header">
                    <div class="app-window-buttons">
                        <div class="app-window-btn red" data-action="close"></div>
                        <div class="app-window-btn yellow" data-action="minimize"></div>
                        <div class="app-window-btn green" data-action="maximize"></div>
                    </div>
                    <span class="app-window-title">${title}</span>
                </div>
                <div class="app-window-body">${content}</div>
            `;

            document.getElementById('app-windows').appendChild(windowEl);
            this.setupWindowDrag(windowEl);
            if (resizable) this.setupWindowResize(windowEl);

            // Button handlers
            windowEl.querySelector('.app-window-btn.red').addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeWindow(appId);
            });
            windowEl.querySelector('.app-window-btn.yellow').addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizeWindow(appId);
            });
            windowEl.querySelector('.app-window-btn.green').addEventListener('click', (e) => {
                e.stopPropagation();
                this.maximizeWindow(appId);
            });

            windowEl.addEventListener('mousedown', () => {
                this.focusWindow(appId);
            });

            this.windows[appId] = windowEl;
            this.focusWindow(appId);

            // Add to taskbar
            if (typeof Taskbar !== 'undefined') {
                Taskbar.addWindow(appId, title);
            }

            return windowEl;
        },

        setupWindowDrag(windowEl) {
            const header = windowEl.querySelector('.app-window-header');
            let isDragging = false;
            let offsetX = 0, offsetY = 0;

            const startDrag = (e) => {
                if (e.target.classList.contains('app-window-close')) return;
                isDragging = true;
                const rect = windowEl.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                header.classList.add('dragging');
            };

            const drag = (e) => {
                if (!isDragging) return;
                windowEl.style.left = `${e.clientX - offsetX}px`;
                windowEl.style.top = `${e.clientY - offsetY}px`;
            };

            const stopDrag = () => {
                isDragging = false;
                header.classList.remove('dragging');
            };

            header.addEventListener('mousedown', startDrag);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        },

        setupWindowResize(windowEl) {
            const MIN_WIDTH = 250;
            const MIN_HEIGHT = 200;
            let isResizing = false;
            let resizeDir = null;
            let startX, startY, startWidth, startHeight;

            const startResize = (e) => {
                e.stopPropagation();
                isResizing = true;
                resizeDir = e.target.dataset.resize;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = windowEl.offsetWidth;
                startHeight = windowEl.offsetHeight;
                document.body.style.cursor = e.target.style.cursor || 'se-resize';
                document.body.style.userSelect = 'none';
            };

            const doResize = (e) => {
                if (!isResizing) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                if (resizeDir.includes('e')) {
                    windowEl.style.width = `${Math.max(MIN_WIDTH, startWidth + dx)}px`;
                }
                if (resizeDir.includes('s')) {
                    windowEl.style.height = `${Math.max(MIN_HEIGHT, startHeight + dy)}px`;
                }
            };

            const stopResize = () => {
                isResizing = false;
                resizeDir = null;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };

            windowEl.querySelectorAll('.app-resize-handle').forEach(handle => {
                handle.addEventListener('mousedown', startResize);
            });
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        },

        focusWindow(appId) {
            if (!this.windows[appId]) return;
            this.windows[appId].style.zIndex = ++this.highestZIndex;
        },

        closeWindow(appId) {
            const windowEl = this.windows[appId];
            if (!windowEl) return;

            if (appId === 'music') MusicApp.stop();
            if (appId === 'player') ASCIIPlayerApp.stop();
            if (appId === 'games') GamesApp.cleanup();

            // Animate close
            windowEl.classList.add('closing');
            setTimeout(() => {
                windowEl.remove();
                delete this.windows[appId];

                // Remove from taskbar
                if (typeof Taskbar !== 'undefined') {
                    Taskbar.removeWindow(appId);
                }
            }, 200);
        },

        minimizeWindow(appId) {
            const windowEl = this.windows[appId];
            if (!windowEl || windowEl.classList.contains('minimized')) return;

            windowEl.classList.add('minimizing');
            setTimeout(() => {
                windowEl.classList.remove('minimizing');
                windowEl.classList.add('minimized');

                if (typeof Taskbar !== 'undefined') {
                    Taskbar.updateWindow(appId, true);
                }
            }, 300);
        },

        restoreWindow(appId) {
            const windowEl = this.windows[appId];
            if (!windowEl || !windowEl.classList.contains('minimized')) return;

            windowEl.classList.remove('minimized');
            windowEl.classList.add('restoring');
            setTimeout(() => {
                windowEl.classList.remove('restoring');
            }, 300);

            this.focusWindow(appId);

            if (typeof Taskbar !== 'undefined') {
                Taskbar.updateWindow(appId, false);
            }
        },

        maximizeWindow(appId) {
            const windowEl = this.windows[appId];
            if (!windowEl) return;

            if (windowEl.classList.contains('maximized')) {
                // Restore to previous size
                windowEl.style.width = windowEl.dataset.prevWidth || '400px';
                windowEl.style.height = windowEl.dataset.prevHeight || '300px';
                windowEl.style.left = windowEl.dataset.prevLeft || '150px';
                windowEl.style.top = windowEl.dataset.prevTop || '80px';
                windowEl.classList.remove('maximized');
            } else {
                // Save current position and maximize
                windowEl.dataset.prevWidth = windowEl.style.width;
                windowEl.dataset.prevHeight = windowEl.style.height;
                windowEl.dataset.prevLeft = windowEl.style.left;
                windowEl.dataset.prevTop = windowEl.style.top;

                windowEl.style.width = '100%';
                windowEl.style.height = 'calc(100% - 40px)'; // Account for taskbar
                windowEl.style.left = '0';
                windowEl.style.top = '0';
                windowEl.classList.add('maximized');
            }
        }
    };

    // === THEME PICKER APP ===
    const ThemePickerApp = {
        themeColors: {
            'tokyo-night': ['#1a1b26', '#9ece6a', '#7aa2f7', '#bb9af7', '#f7768e'],
            'dracula': ['#282a36', '#50fa7b', '#bd93f9', '#ff79c6', '#ff5555'],
            'gruvbox': ['#282828', '#b8bb26', '#83a598', '#d3869b', '#fb4934'],
            'nord': ['#2e3440', '#a3be8c', '#81a1c1', '#b48ead', '#bf616a'],
            'cyberpunk': ['#0a0e14', '#91b362', '#53bdfa', '#f07178', '#ea6c73'],
            'matrix': ['#0d0d0d', '#00ff00', '#00cc00', '#00ff66', '#ff0000'],
            'catppuccin': ['#1e1e2e', '#a6e3a1', '#89b4fa', '#f5c2e7', '#f38ba8']
        },

        open() {
            let content = '<div class="theme-grid">';
            for (const [key, theme] of Object.entries(ThemeManager.themes)) {
                const colors = this.themeColors[key];
                const isActive = key === ThemeManager.current ? 'active' : '';
                content += `
                    <div class="theme-card ${isActive}" data-theme="${key}">
                        <div class="theme-card-name">${theme.name}</div>
                        <div class="theme-card-colors">
                            ${colors.map(c => `<div class="theme-color-swatch" style="background-color: ${c}"></div>`).join('')}
                        </div>
                    </div>
                `;
            }
            content += '</div>';

            const windowEl = WindowManager.createWindow('themes', 'Theme Picker', 320, 380, content);

            windowEl.querySelectorAll('.theme-card').forEach(card => {
                card.addEventListener('click', () => {
                    const themeName = card.dataset.theme;
                    ThemeManager.apply(themeName);
                    windowEl.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                });
            });

            // Track app usage
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.trackApp('themes');
            }
        }
    };

    // === ASCII PLAYER APP ===
    const ASCIIPlayerApp = {
        animationInterval: null,
        frameIndex: 0,
        currentAnimation: null,
        resizeObserver: null,
        cols: 40,
        rows: 15,

        getGridSize() {
            const display = document.getElementById('ascii-display');
            if (!display) return { cols: 40, rows: 15 };

            const charWidth = 8.4;  // Approximate width of monospace char at 14px
            const charHeight = 15.4; // Approximate height with line-height 1.1

            const availableWidth = display.clientWidth - 24;  // minus padding
            const availableHeight = display.clientHeight - 24;

            const cols = Math.max(20, Math.floor(availableWidth / charWidth));
            const rows = Math.max(8, Math.floor(availableHeight / charHeight));

            return { cols, rows };
        },

        generateCubeFrames(cols, rows) {
            const frames = [];
            for (let angle = 0; angle < 360; angle += 15) {
                const rad = angle * Math.PI / 180;
                let frame = '';
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const dx = (x - cols/2) / (cols/4);
                        const dy = (y - rows/2) / (rows/4);
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const wave = Math.sin(dist * 2 - rad * 2);
                        const chars = ' .:-=+*#%@';
                        frame += chars[Math.floor((wave + 1) * 4.5)];
                    }
                    frame += '\n';
                }
                frames.push(frame);
            }
            return frames;
        },

        generateWaveFrames(cols, rows) {
            const frames = [];
            for (let t = 0; t < 20; t++) {
                let frame = '';
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const wave = Math.sin(x * 0.2 + t * 0.5) * (rows/2 - 1) + rows/2;
                        frame += y > wave ? '~' : ' ';
                    }
                    frame += '\n';
                }
                frames.push(frame);
            }
            return frames;
        },

        generateFireFrames(cols, rows) {
            const frames = [];
            const chars = ' .:-=+*#%@';
            for (let f = 0; f < 15; f++) {
                let frame = '';
                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        const intensity = Math.random() * (rows - y) / rows;
                        frame += chars[Math.min(Math.floor(intensity * 9), 9)];
                    }
                    frame += '\n';
                }
                frames.push(frame);
            }
            return frames;
        },

        generateBallFrames(cols, rows) {
            const frames = [];
            for (let i = 0; i < 20; i++) {
                const x = Math.floor(Math.abs(Math.sin(i * 0.3)) * (cols - 1));
                const y = Math.floor(Math.abs(Math.sin(i * 0.5)) * (rows - 2));
                let frame = '';
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        if (row === y && col === x) frame += 'O';
                        else if (row === rows - 1) frame += '_';
                        else frame += ' ';
                    }
                    frame += '\n';
                }
                frames.push(frame);
            }
            return frames;
        },

        generateFrames(animName) {
            const { cols, rows } = this.getGridSize();
            this.cols = cols;
            this.rows = rows;

            switch(animName) {
                case 'cube': return this.generateCubeFrames(cols, rows);
                case 'wave': return this.generateWaveFrames(cols, rows);
                case 'fire': return this.generateFireFrames(cols, rows);
                case 'ball': return this.generateBallFrames(cols, rows);
                default: return [];
            }
        },

        open() {
            const content = `
                <div class="ascii-player">
                    <div class="ascii-display" id="ascii-display">Select an animation</div>
                    <div class="ascii-controls">
                        <button class="ascii-btn" data-anim="cube">3D Cube</button>
                        <button class="ascii-btn" data-anim="wave">Wave</button>
                        <button class="ascii-btn" data-anim="fire">Fire</button>
                        <button class="ascii-btn" data-anim="ball">Ball</button>
                        <button class="ascii-btn" data-anim="stop">Stop</button>
                    </div>
                </div>
            `;

            const windowEl = WindowManager.createWindow('player', 'ASCII Video Player', 400, 350, content);

            windowEl.querySelectorAll('.ascii-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const anim = btn.dataset.anim;
                    if (anim === 'stop') {
                        this.stop();
                    } else {
                        this.play(anim);
                    }
                    windowEl.querySelectorAll('.ascii-btn').forEach(b => b.classList.remove('active'));
                    if (anim !== 'stop') btn.classList.add('active');
                });
            });

            // Setup resize observer to regenerate frames when window is resized
            const display = document.getElementById('ascii-display');
            if (display && window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    if (this.currentAnimation && this.animationInterval) {
                        this.play(this.currentAnimation);
                    }
                });
                this.resizeObserver.observe(display);
            }

            // Track app usage
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.trackApp('player');
            }
        },

        play(animName) {
            this.stop(true); // Don't clear currentAnimation
            this.currentAnimation = animName;
            this.frameIndex = 0;
            const display = document.getElementById('ascii-display');
            if (!display) return;

            const frames = this.generateFrames(animName);
            this.animationInterval = setInterval(() => {
                if (!document.getElementById('ascii-display')) {
                    this.stop();
                    return;
                }
                display.textContent = frames[this.frameIndex];
                this.frameIndex = (this.frameIndex + 1) % frames.length;
            }, 100);
        },

        stop(keepAnimation = false) {
            if (this.animationInterval) {
                clearInterval(this.animationInterval);
                this.animationInterval = null;
            }
            if (!keepAnimation) {
                this.currentAnimation = null;
            }
            const display = document.getElementById('ascii-display');
            if (display && !keepAnimation) display.textContent = 'Select an animation';
            if (this.resizeObserver && !keepAnimation) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        }
    };

    // === MUSIC APP ===
    const MusicApp = {
        audio: null,
        isPlaying: false,
        volume: 0.5,
        visualizerInterval: null,
        currentStation: 0,

        stations: [
            { name: 'Lofi Girl', url: 'https://boxradio-edge-00.streamafrica.net/lofi' },
            { name: 'Chillofi Radio', url: 'https://azc.rdstream-5677.dez.ovh/listen/chillofi/radio.mp3' },
            { name: 'Hunter.FM Lo-Fi', url: 'https://live.hunter.fm/lofi_normal' },
            { name: 'ISEKOI Chill Zone', url: 'https://public.isekoi-radio.com/listen/chill/radio.mp3' },
            { name: 'Nightwave Plaza', url: 'https://radio.plaza.one/mp3' }
        ],

        open() {
            const bars = Array(16).fill(0).map(() => '<div class="visualizer-bar" style="height: 4px;"></div>').join('');
            const stationOptions = this.stations.map((s, i) =>
                `<option value="${i}"${i === this.currentStation ? ' selected' : ''}>${s.name}</option>`
            ).join('');

            const content = `
                <div class="music-player">
                    <div class="music-visualizer" id="music-visualizer">${bars}</div>
                    <div class="music-station">
                        <select id="station-select" class="station-select">${stationOptions}</select>
                    </div>
                    <div class="music-info" id="music-status">Select station & press Play</div>
                    <div class="music-controls">
                        <button class="music-btn" id="music-play-btn">Play</button>
                        <div class="volume-control">
                            <span>Vol:</span>
                            <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="50">
                        </div>
                    </div>
                </div>
            `;

            const windowEl = WindowManager.createWindow('music', 'Lofi Radio', 320, 250, content);

            const playBtn = windowEl.querySelector('#music-play-btn');
            const volumeSlider = windowEl.querySelector('#volume-slider');
            const stationSelect = windowEl.querySelector('#station-select');

            playBtn.addEventListener('click', () => {
                if (this.isPlaying) {
                    this.stop();
                    playBtn.textContent = 'Play';
                    playBtn.classList.remove('playing');
                } else {
                    this.play();
                    playBtn.textContent = 'Pause';
                    playBtn.classList.add('playing');
                }
            });

            volumeSlider.addEventListener('input', (e) => {
                this.volume = e.target.value / 100;
                if (this.audio) this.audio.volume = this.volume;
            });

            stationSelect.addEventListener('change', (e) => {
                this.currentStation = parseInt(e.target.value);
                if (this.isPlaying) {
                    this.stop();
                    this.play();
                    playBtn.textContent = 'Pause';
                    playBtn.classList.add('playing');
                }
            });

            // Track app usage
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.trackApp('music');
            }
        },

        play() {
            if (this.isPlaying) return;

            const station = this.stations[this.currentStation];
            const statusEl = document.getElementById('music-status');

            if (statusEl) statusEl.textContent = 'Connecting...';

            this.audio = new Audio(station.url);
            this.audio.volume = this.volume;
            this.audio.crossOrigin = 'anonymous';

            this.audio.addEventListener('playing', () => {
                this.isPlaying = true;
                if (statusEl) statusEl.textContent = `Playing: ${station.name}`;

                // Track music lover achievement
                if (typeof AchievementManager !== 'undefined') {
                    AchievementManager.check('music_lover');
                }
                this.startVisualizer();
            });

            this.audio.addEventListener('error', () => {
                if (statusEl) statusEl.textContent = 'Error - Try another station';
                this.stop();
                const playBtn = document.getElementById('music-play-btn');
                if (playBtn) {
                    playBtn.textContent = 'Play';
                    playBtn.classList.remove('playing');
                }
            });

            this.audio.addEventListener('waiting', () => {
                if (statusEl) statusEl.textContent = 'Buffering...';
            });

            this.audio.play().catch(() => {
                if (statusEl) statusEl.textContent = 'Error - Try another station';
            });
        },

        startVisualizer() {
            const bars = document.querySelectorAll('#music-visualizer .visualizer-bar');
            if (!bars.length) return;

            this.visualizerInterval = setInterval(() => {
                bars.forEach(bar => {
                    bar.style.height = this.isPlaying ? `${Math.random() * 35 + 5}px` : '4px';
                });
            }, 100);
        },

        stop() {
            this.isPlaying = false;
            if (this.visualizerInterval) {
                clearInterval(this.visualizerInterval);
                this.visualizerInterval = null;
            }
            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
                this.audio = null;
            }
            const bars = document.querySelectorAll('#music-visualizer .visualizer-bar');
            bars.forEach(bar => bar.style.height = '4px');

            const statusEl = document.getElementById('music-status');
            if (statusEl) statusEl.textContent = 'Select station & press Play';
        }
    };

    // === GAMES APP ===
    const GamesApp = {
        gameLoop: null,
        keyHandler: null,
        resizeObserver: null,

        open() {
            const content = `<div class="games-menu" id="games-content"></div>`;
            WindowManager.createWindow('games', 'Mini Games', 420, 480, content);
            this.showMenu();

            // Track app usage
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.trackApp('games');
            }
        },

        showMenu() {
            this.cleanup();
            const container = document.getElementById('games-content');
            if (!container) return;

            container.className = 'games-menu';
            container.innerHTML = `
                <div class="game-option" data-game="snake">
                    <div class="game-option-title">🐍 Snake</div>
                    <div class="game-option-desc">Arrow keys • Fill the grid!</div>
                </div>
                <div class="game-option" data-game="pong">
                    <div class="game-option-title">🏓 Pong</div>
                    <div class="game-option-desc">W/S keys • First to 5!</div>
                </div>
                <div class="game-option" data-game="tetris">
                    <div class="game-option-title">🧱 Tetris</div>
                    <div class="game-option-desc">Arrow keys • Clear lines!</div>
                </div>
                <div class="game-option" data-game="breakout">
                    <div class="game-option-title">🧱 Breakout</div>
                    <div class="game-option-desc">Mouse/Arrow • Break bricks!</div>
                </div>
                <div class="game-option" data-game="invaders">
                    <div class="game-option-title">👾 Invaders</div>
                    <div class="game-option-desc">Arrow + Space • Shoot!</div>
                </div>
                <div class="game-option" data-game="asteroids">
                    <div class="game-option-title">🚀 Asteroids</div>
                    <div class="game-option-desc">Arrows + Space • Survive!</div>
                </div>
                <div class="game-option" data-game="dino">
                    <div class="game-option-title">🦖 Dino Run</div>
                    <div class="game-option-desc">Space to jump!</div>
                </div>
                <div class="game-option" data-game="2048">
                    <div class="game-option-title">🔢 2048</div>
                    <div class="game-option-desc">Arrow keys • Merge tiles!</div>
                </div>
                <div class="game-option" data-game="flappy">
                    <div class="game-option-title">🐦 Flappy Bird</div>
                    <div class="game-option-desc">Space/Click • Fly!</div>
                </div>
                <div class="game-option" data-game="minesweeper">
                    <div class="game-option-title">💣 Minesweeper</div>
                    <div class="game-option-desc">Click • Find mines!</div>
                </div>
                <div class="game-option" data-game="memory">
                    <div class="game-option-title">🃏 Memory</div>
                    <div class="game-option-desc">Click • Match pairs!</div>
                </div>
            `;

            container.querySelectorAll('.game-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const game = opt.dataset.game;
                    if (game === 'snake') this.startSnake();
                    else if (game === 'pong') this.startPong();
                    else if (game === 'tetris') this.startTetris();
                    else if (game === 'breakout') this.startBreakout();
                    else if (game === 'invaders') this.startInvaders();
                    else if (game === 'asteroids') this.startAsteroids();
                    else if (game === 'dino') this.startDino();
                    else if (game === '2048') this.start2048();
                    else if (game === 'flappy') this.startFlappy();
                    else if (game === 'minesweeper') this.startMinesweeper();
                    else if (game === 'memory') this.startMemory();

                    // Track achievement
                    if (typeof AchievementManager !== 'undefined') {
                        AchievementManager.check('gamer');
                    }
                });
            });
        },

        startSnake() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="snake-score">0</span></div>
                <canvas id="snake-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('snake-canvas');
            const ctx = canvas.getContext('2d');
            const tileCount = 15;
            const maxScore = tileCount * tileCount - 1;

            const resizeCanvas = () => {
                const scoreHeight = 30;
                const buttonHeight = 45;
                const padding = 20;
                const availableWidth = container.clientWidth - padding;
                const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
                const size = Math.min(availableWidth, availableHeight);
                canvas.width = Math.max(150, size);
                canvas.height = Math.max(150, size);
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            let snake = [{x: 7, y: 7}];
            let food = {x: 10, y: 10};
            let direction = {dx: 0, dy: 0};
            let nextDirection = {dx: 0, dy: 0};
            let score = 0;
            let gameOver = false;

            const spawnFood = () => {
                const emptyCells = [];
                for (let x = 0; x < tileCount; x++) {
                    for (let y = 0; y < tileCount; y++) {
                        if (!snake.some(s => s.x === x && s.y === y)) {
                            emptyCells.push({x, y});
                        }
                    }
                }
                if (emptyCells.length > 0) {
                    food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                }
            };

            const showEndScreen = (won) => {
                gameOver = true;
                clearInterval(this.gameLoop);

                const gridSize = canvas.width / tileCount;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = won ? getComputedStyle(document.documentElement).getPropertyValue('--green') : getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${gridSize * 1.5}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - 20);

                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${gridSize}px 'Fira Code', monospace`;
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

                ctx.font = `${gridSize * 0.7}px 'Fira Code', monospace`;
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + 50);
            };

            const handleKey = (e) => {
                if (gameOver) return;
                if (e.key === 'ArrowUp' && direction.dy !== 1) { nextDirection = {dx: 0, dy: -1}; }
                else if (e.key === 'ArrowDown' && direction.dy !== -1) { nextDirection = {dx: 0, dy: 1}; }
                else if (e.key === 'ArrowLeft' && direction.dx !== 1) { nextDirection = {dx: -1, dy: 0}; }
                else if (e.key === 'ArrowRight' && direction.dx !== -1) { nextDirection = {dx: 1, dy: 0}; }
            };

            document.addEventListener('keydown', handleKey);
            this.keyHandler = handleKey;

            const gameLoop = () => {
                if (gameOver) return;

                // Apply queued direction
                direction = {...nextDirection};

                const gridSize = canvas.width / tileCount;
                const head = {x: snake[0].x + direction.dx, y: snake[0].y + direction.dy};

                // Wrap around
                if (head.x < 0) head.x = tileCount - 1;
                if (head.x >= tileCount) head.x = 0;
                if (head.y < 0) head.y = tileCount - 1;
                if (head.y >= tileCount) head.y = 0;

                // Check collision with self (only if moving)
                if (snake.some(s => s.x === head.x && s.y === head.y) && (direction.dx !== 0 || direction.dy !== 0)) {
                    showEndScreen(false);
                    return;
                }

                snake.unshift(head);

                if (head.x === food.x && head.y === food.y) {
                    score++;
                    document.getElementById('snake-score').textContent = score;

                    // Check win condition
                    if (score >= maxScore) {
                        showEndScreen(true);
                        return;
                    }
                    spawnFood();
                } else {
                    snake.pop();
                }

                // Draw background
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw snake with gradient (head is brighter)
                const greenColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
                snake.forEach((s, i) => {
                    const brightness = 1 - (i / snake.length) * 0.5;
                    ctx.fillStyle = i === 0 ? getComputedStyle(document.documentElement).getPropertyValue('--cyan') : greenColor;
                    ctx.globalAlpha = brightness;
                    ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2);
                });
                ctx.globalAlpha = 1;

                // Draw food with pulsing effect
                const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                const foodSize = (gridSize - 2) * pulse;
                const foodOffset = (gridSize - 2 - foodSize) / 2;
                ctx.fillRect(food.x * gridSize + 1 + foodOffset, food.y * gridSize + 1 + foodOffset, foodSize, foodSize);
            };

            this.gameLoop = setInterval(gameLoop, 120);

            document.getElementById('game-back').addEventListener('click', () => {
                this.showMenu();
            });
        },

        startPong() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score"><span id="player-score">0</span> - <span id="ai-score">0</span></div>
                <canvas id="pong-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('pong-canvas');
            const ctx = canvas.getContext('2d');

            const winScore = 5;

            // Responsive sizing functions
            const getPaddleHeight = () => canvas.height * 0.15;
            const getPaddleWidth = () => Math.max(8, canvas.width * 0.02);
            const getBallRadius = () => Math.max(5, Math.min(canvas.width, canvas.height) * 0.015);
            const getPlayerSpeed = () => canvas.height * 0.015;
            const getBaseSpeed = () => Math.min(canvas.width, canvas.height) * 0.012;

            // Store positions as ratios (0-1) for resize handling
            let playerYRatio = 0.5;
            let aiYRatio = 0.5;
            let ballXRatio = 0.5;
            let ballYRatio = 0.5;
            let ballDXRatio = 0, ballDYRatio = 0;
            let playerScore = 0;
            let aiScore = 0;
            let gameOver = false;
            let speedMultiplier = 1;
            let aiSpeedMultiplier = 0.7;

            // Track which keys are pressed for smooth movement
            const keysPressed = { up: false, down: false };

            const resizeCanvas = () => {
                const scoreHeight = 30;
                const buttonHeight = 45;
                const padding = 20;
                const availableWidth = container.clientWidth - padding;
                const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
                canvas.width = Math.max(200, availableWidth);
                canvas.height = Math.max(150, availableHeight);
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            const resetBall = (towardsPlayer = Math.random() > 0.5) => {
                ballXRatio = 0.5;
                ballYRatio = 0.5;
                const angle = (Math.random() - 0.5) * Math.PI / 2;
                const initialSpeed = 0.008; // Slower start
                ballDXRatio = Math.cos(angle) * initialSpeed * (towardsPlayer ? -1 : 1);
                ballDYRatio = Math.sin(angle) * initialSpeed;
                speedMultiplier = 1;
            };
            resetBall();

            const showEndScreen = (playerWon) => {
                gameOver = true;
                clearInterval(this.gameLoop);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = playerWon ? getComputedStyle(document.documentElement).getPropertyValue('--green') : getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${canvas.height / 8}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(playerWon ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - 20);

                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${canvas.height / 12}px 'Fira Code', monospace`;
                ctx.fillText(`${playerScore} - ${aiScore}`, canvas.width / 2, canvas.height / 2 + 25);

                ctx.font = `${canvas.height / 15}px 'Fira Code', monospace`;
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + 60);
            };

            const handleKeyDown = (e) => {
                if (gameOver) return;
                if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                    keysPressed.up = true;
                    e.preventDefault();
                }
                if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                    keysPressed.down = true;
                    e.preventDefault();
                }
            };

            const handleKeyUp = (e) => {
                if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                    keysPressed.up = false;
                }
                if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                    keysPressed.down = false;
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            this.keyHandler = handleKeyDown;
            this.keyUpHandler = handleKeyUp;

            const gameLoop = () => {
                if (gameOver) return;

                // Get responsive sizes
                const paddleHeight = getPaddleHeight();
                const paddleWidth = getPaddleWidth();
                const ballRadius = getBallRadius();
                const playerSpeed = getPlayerSpeed();
                const aiSpeed = playerSpeed * aiSpeedMultiplier;

                // Get actual positions from ratios
                let playerY = playerYRatio * (canvas.height - paddleHeight);
                let aiY = aiYRatio * (canvas.height - paddleHeight);
                let ballX = ballXRatio * canvas.width;
                let ballY = ballYRatio * canvas.height;

                // Smooth player paddle movement
                if (keysPressed.up) {
                    playerY = Math.max(0, playerY - playerSpeed);
                }
                if (keysPressed.down) {
                    playerY = Math.min(canvas.height - paddleHeight, playerY + playerSpeed);
                }
                playerYRatio = playerY / (canvas.height - paddleHeight);

                // Move ball (using ratios for consistent speed across sizes)
                ballX += ballDXRatio * canvas.width * speedMultiplier;
                ballY += ballDYRatio * canvas.height * speedMultiplier;

                // Ball collision with top/bottom walls
                if (ballY - ballRadius <= 0) {
                    ballDYRatio = Math.abs(ballDYRatio);
                    ballY = ballRadius;
                }
                if (ballY + ballRadius >= canvas.height) {
                    ballDYRatio = -Math.abs(ballDYRatio);
                    ballY = canvas.height - ballRadius;
                }

                // AI movement (follows ball with some delay)
                const aiCenter = aiY + paddleHeight / 2;
                const deadZone = paddleHeight * 0.2;
                if (aiCenter < ballY - deadZone) {
                    aiY = Math.min(canvas.height - paddleHeight, aiY + aiSpeed);
                } else if (aiCenter > ballY + deadZone) {
                    aiY = Math.max(0, aiY - aiSpeed);
                }
                aiYRatio = aiY / (canvas.height - paddleHeight);

                // Player paddle collision
                if (ballX - ballRadius <= paddleWidth + 5 &&
                    ballY >= playerY && ballY <= playerY + paddleHeight &&
                    ballDXRatio < 0) {
                    const hitPos = (ballY - playerY) / paddleHeight;
                    const angle = (hitPos - 0.5) * Math.PI / 3;
                    const baseSpeed = 0.008;
                    ballDXRatio = Math.cos(angle) * baseSpeed;
                    ballDYRatio = Math.sin(angle) * baseSpeed;
                    speedMultiplier = Math.min(2.5, speedMultiplier + 0.12);
                    ballX = paddleWidth + 5 + ballRadius;
                }

                // AI paddle collision
                if (ballX + ballRadius >= canvas.width - paddleWidth - 5 &&
                    ballY >= aiY && ballY <= aiY + paddleHeight &&
                    ballDXRatio > 0) {
                    const hitPos = (ballY - aiY) / paddleHeight;
                    const angle = (hitPos - 0.5) * Math.PI / 3;
                    const baseSpeed = 0.008;
                    ballDXRatio = -Math.cos(angle) * baseSpeed;
                    ballDYRatio = Math.sin(angle) * baseSpeed;
                    speedMultiplier = Math.min(2.5, speedMultiplier + 0.12);
                    ballX = canvas.width - paddleWidth - 5 - ballRadius;
                }

                // Update ball ratios
                ballXRatio = ballX / canvas.width;
                ballYRatio = ballY / canvas.height;

                // Scoring
                if (ballX - ballRadius <= 0) {
                    aiScore++;
                    document.getElementById('ai-score').textContent = aiScore;
                    if (aiScore >= winScore) {
                        showEndScreen(false);
                        return;
                    }
                    resetBall(true);
                }

                if (ballX + ballRadius >= canvas.width) {
                    playerScore++;
                    document.getElementById('player-score').textContent = playerScore;
                    if (playerScore >= winScore) {
                        showEndScreen(true);
                        return;
                    }
                    aiSpeedMultiplier = Math.min(0.95, aiSpeedMultiplier + 0.05);
                    resetBall(false);
                }

                // Draw background
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw center line
                ctx.setLineDash([canvas.height * 0.03, canvas.height * 0.03]);
                ctx.lineWidth = Math.max(2, canvas.width * 0.004);
                ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw player paddle (left) with rounded corners
                const cornerRadius = Math.min(paddleWidth / 2, 6);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cyan');
                ctx.beginPath();
                ctx.roundRect(5, playerY, paddleWidth, paddleHeight, cornerRadius);
                ctx.fill();

                // Draw AI paddle (right) with rounded corners
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.beginPath();
                ctx.roundRect(canvas.width - paddleWidth - 5, aiY, paddleWidth, paddleHeight, cornerRadius);
                ctx.fill();

                // Draw ball with glow effect
                ctx.shadowBlur = ballRadius * 2;
                ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                ctx.beginPath();
                ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            };

            this.gameLoop = setInterval(gameLoop, 16); // ~60fps for smoother movement

            document.getElementById('game-back').addEventListener('click', () => {
                this.showMenu();
            });
        },

        startTetris() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="tetris-score">0</span></div>
                <canvas id="tetris-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('tetris-canvas');
            const ctx = canvas.getContext('2d');
            const COLS = 10, ROWS = 20;

            const resizeCanvas = () => {
                const scoreHeight = 30, buttonHeight = 45, padding = 20;
                const availableWidth = container.clientWidth - padding;
                const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
                const cellSize = Math.min(availableWidth / COLS, availableHeight / ROWS);
                canvas.width = cellSize * COLS;
                canvas.height = cellSize * ROWS;
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            const PIECES = [
                [[1,1,1,1]], // I
                [[1,1],[1,1]], // O
                [[0,1,0],[1,1,1]], // T
                [[1,0,0],[1,1,1]], // L
                [[0,0,1],[1,1,1]], // J
                [[0,1,1],[1,1,0]], // S
                [[1,1,0],[0,1,1]]  // Z
            ];
            const COLORS = ['#00f5ff', '#ffeb3b', '#e040fb', '#ff9800', '#2196f3', '#4caf50', '#f44336'];

            let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
            let score = 0, gameOver = false;
            let piece, pieceX, pieceY, pieceColor;

            const newPiece = () => {
                const idx = Math.floor(Math.random() * PIECES.length);
                piece = PIECES[idx].map(r => [...r]);
                pieceColor = COLORS[idx];
                pieceX = Math.floor(COLS / 2) - Math.floor(piece[0].length / 2);
                pieceY = 0;
                if (collides()) { gameOver = true; showEnd(); }
            };

            const collides = (px = pieceX, py = pieceY, p = piece) => {
                for (let y = 0; y < p.length; y++) {
                    for (let x = 0; x < p[y].length; x++) {
                        if (p[y][x] && (px + x < 0 || px + x >= COLS || py + y >= ROWS || (py + y >= 0 && board[py + y][px + x]))) return true;
                    }
                }
                return false;
            };

            const merge = () => {
                for (let y = 0; y < piece.length; y++) {
                    for (let x = 0; x < piece[y].length; x++) {
                        if (piece[y][x] && pieceY + y >= 0) board[pieceY + y][pieceX + x] = pieceColor;
                    }
                }
            };

            const clearLines = () => {
                let lines = 0;
                for (let y = ROWS - 1; y >= 0; y--) {
                    if (board[y].every(c => c)) {
                        board.splice(y, 1);
                        board.unshift(Array(COLS).fill(0));
                        lines++; y++;
                    }
                }
                if (lines) score += [0, 100, 300, 500, 800][lines];
                document.getElementById('tetris-score').textContent = score;
            };

            const rotate = () => {
                const rotated = piece[0].map((_, i) => piece.map(r => r[i]).reverse());
                if (!collides(pieceX, pieceY, rotated)) piece = rotated;
            };

            const showEnd = () => {
                clearInterval(this.gameLoop);
                const size = Math.min(canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${size * 0.1}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText('YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.font = `${size * 0.04}px 'Fira Code', monospace`;
                ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + size * 0.15);
            };

            const handleKey = (e) => {
                if (gameOver) return;
                if (e.key === 'ArrowLeft' && !collides(pieceX - 1, pieceY)) pieceX--;
                else if (e.key === 'ArrowRight' && !collides(pieceX + 1, pieceY)) pieceX++;
                else if (e.key === 'ArrowDown' && !collides(pieceX, pieceY + 1)) pieceY++;
                else if (e.key === 'ArrowUp') rotate();
                e.preventDefault();
            };
            document.addEventListener('keydown', handleKey);
            this.keyHandler = handleKey;

            newPiece();
            let dropCounter = 0;
            const gameLoop = () => {
                if (gameOver) return;
                dropCounter++;
                if (dropCounter > 30) {
                    dropCounter = 0;
                    if (!collides(pieceX, pieceY + 1)) pieceY++;
                    else { merge(); clearLines(); newPiece(); if (gameOver) return; }
                }

                const cellW = canvas.width / COLS, cellH = canvas.height / ROWS;
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw board
                for (let y = 0; y < ROWS; y++) {
                    for (let x = 0; x < COLS; x++) {
                        if (board[y][x]) {
                            ctx.fillStyle = board[y][x];
                            ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
                        }
                    }
                }

                // Draw current piece
                ctx.fillStyle = pieceColor;
                for (let y = 0; y < piece.length; y++) {
                    for (let x = 0; x < piece[y].length; x++) {
                        if (piece[y][x]) ctx.fillRect((pieceX + x) * cellW + 1, (pieceY + y) * cellH + 1, cellW - 2, cellH - 2);
                    }
                }

                // Grid lines
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cellW, 0); ctx.lineTo(x * cellW, canvas.height); ctx.stroke(); }
                for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellH); ctx.lineTo(canvas.width, y * cellH); ctx.stroke(); }
            };

            this.gameLoop = setInterval(gameLoop, 16);
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        startBreakout() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="breakout-score">0</span></div>
                <canvas id="breakout-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('breakout-canvas');
            const ctx = canvas.getContext('2d');

            const resizeCanvas = () => {
                const scoreHeight = 30, buttonHeight = 45, padding = 20;
                const availableWidth = container.clientWidth - padding;
                const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
                canvas.width = Math.max(200, availableWidth);
                canvas.height = Math.max(150, availableHeight);
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            const BRICK_ROWS = 5, BRICK_COLS = 8;
            let paddleX = 0.5, ballX = 0.5, ballY = 0.8, ballDX = 0.01, ballDY = -0.012;
            let score = 0, lives = 3, gameOver = false;
            let bricks = [];

            const initBricks = () => {
                bricks = [];
                const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];
                for (let r = 0; r < BRICK_ROWS; r++) {
                    for (let c = 0; c < BRICK_COLS; c++) {
                        bricks.push({ x: c / BRICK_COLS + 0.01, y: r * 0.05 + 0.05, w: 1 / BRICK_COLS - 0.02, h: 0.04, color: colors[r], alive: true });
                    }
                }
            };
            initBricks();

            const keysPressed = { left: false, right: false };

            const handleKeyDown = (e) => {
                if (e.key === 'ArrowLeft') keysPressed.left = true;
                if (e.key === 'ArrowRight') keysPressed.right = true;
                e.preventDefault();
            };
            const handleKeyUp = (e) => {
                if (e.key === 'ArrowLeft') keysPressed.left = false;
                if (e.key === 'ArrowRight') keysPressed.right = false;
            };
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            this.keyHandler = handleKeyDown;
            this.keyUpHandler = handleKeyUp;

            const showEnd = (won) => {
                gameOver = true;
                clearInterval(this.gameLoop);
                const size = Math.min(canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = won ? getComputedStyle(document.documentElement).getPropertyValue('--green') : getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.font = `${size * 0.04}px 'Fira Code', monospace`;
                ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + size * 0.15);
            };

            const gameLoop = () => {
                if (gameOver) return;

                const paddleW = 0.15, paddleH = 0.02, ballR = 0.012;
                const speed = 0.02;

                if (keysPressed.left) paddleX = Math.max(paddleW / 2, paddleX - speed);
                if (keysPressed.right) paddleX = Math.min(1 - paddleW / 2, paddleX + speed);

                ballX += ballDX;
                ballY += ballDY;

                if (ballX < ballR || ballX > 1 - ballR) ballDX = -ballDX;
                if (ballY < ballR) ballDY = -ballDY;

                // Paddle collision
                if (ballY > 0.95 - ballR && ballX > paddleX - paddleW / 2 && ballX < paddleX + paddleW / 2) {
                    ballDY = -Math.abs(ballDY);
                    ballDX = (ballX - paddleX) / (paddleW / 2) * 0.015;
                }

                // Ball out
                if (ballY > 1) {
                    lives--;
                    if (lives <= 0) { gameOver = true; showEnd(false); return; }
                    ballX = 0.5; ballY = 0.8; ballDX = 0.01; ballDY = -0.012;
                }

                // Brick collision
                bricks.forEach(b => {
                    if (b.alive && ballX > b.x && ballX < b.x + b.w && ballY > b.y && ballY < b.y + b.h) {
                        b.alive = false;
                        ballDY = -ballDY;
                        score += 10;
                        document.getElementById('breakout-score').textContent = score;
                    }
                });

                if (bricks.every(b => !b.alive)) { gameOver = true; showEnd(true); return; }

                // Draw
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Bricks
                bricks.forEach(b => {
                    if (b.alive) {
                        ctx.fillStyle = b.color;
                        ctx.fillRect(b.x * canvas.width, b.y * canvas.height, b.w * canvas.width, b.h * canvas.height);
                    }
                });

                // Paddle
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cyan');
                ctx.fillRect((paddleX - paddleW / 2) * canvas.width, 0.95 * canvas.height, paddleW * canvas.width, paddleH * canvas.height);

                // Ball
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                ctx.beginPath();
                ctx.arc(ballX * canvas.width, ballY * canvas.height, ballR * Math.min(canvas.width, canvas.height), 0, Math.PI * 2);
                ctx.fill();

                // Lives
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${canvas.height * 0.04}px 'Fira Code', monospace`;
                ctx.textAlign = 'left';
                ctx.fillText(`Lives: ${lives}`, 10, canvas.height - 10);
            };

            this.gameLoop = setInterval(gameLoop, 16);
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        startInvaders() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="invaders-score">0</span></div>
                <canvas id="invaders-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('invaders-canvas');
            const ctx = canvas.getContext('2d');

            const resizeCanvas = () => {
                const scoreHeight = 30, buttonHeight = 45, padding = 20;
                canvas.width = Math.max(200, container.clientWidth - padding);
                canvas.height = Math.max(150, container.clientHeight - scoreHeight - buttonHeight - padding);
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            let playerX = 0.5, score = 0, gameOver = false;
            let bullets = [], enemyBullets = [];
            let enemies = [], enemyDir = 1, enemySpeed = 0.002;
            const keysPressed = { left: false, right: false, space: false };
            let canShoot = true;

            const initEnemies = () => {
                enemies = [];
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 8; c++) {
                        enemies.push({ x: 0.1 + c * 0.1, y: 0.1 + r * 0.08, alive: true });
                    }
                }
            };
            initEnemies();

            const handleKeyDown = (e) => {
                if (e.key === 'ArrowLeft') keysPressed.left = true;
                if (e.key === 'ArrowRight') keysPressed.right = true;
                if (e.key === ' ') { keysPressed.space = true; e.preventDefault(); }
            };
            const handleKeyUp = (e) => {
                if (e.key === 'ArrowLeft') keysPressed.left = false;
                if (e.key === 'ArrowRight') keysPressed.right = false;
                if (e.key === ' ') keysPressed.space = false;
            };
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            this.keyHandler = handleKeyDown;
            this.keyUpHandler = handleKeyUp;

            const showEnd = (won) => {
                gameOver = true;
                clearInterval(this.gameLoop);
                const size = Math.min(canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = won ? getComputedStyle(document.documentElement).getPropertyValue('--green') : getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.font = `${size * 0.04}px 'Fira Code', monospace`;
                ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + size * 0.15);
            };

            const gameLoop = () => {
                if (gameOver) return;

                if (keysPressed.left) playerX = Math.max(0.05, playerX - 0.015);
                if (keysPressed.right) playerX = Math.min(0.95, playerX + 0.015);
                if (keysPressed.space && canShoot) {
                    bullets.push({ x: playerX, y: 0.88 });
                    canShoot = false;
                    setTimeout(() => canShoot = true, 300);
                }

                // Move bullets
                bullets = bullets.filter(b => { b.y -= 0.02; return b.y > 0; });
                enemyBullets = enemyBullets.filter(b => { b.y += 0.01; return b.y < 1; });

                // Move enemies
                let moveDown = false;
                enemies.forEach(e => { if (e.alive) { e.x += enemyDir * enemySpeed; if (e.x < 0.05 || e.x > 0.95) moveDown = true; } });
                if (moveDown) {
                    enemyDir *= -1;
                    enemies.forEach(e => { if (e.alive) e.y += 0.05; });
                }

                // Enemy shooting
                if (Math.random() < 0.02) {
                    const alive = enemies.filter(e => e.alive);
                    if (alive.length) {
                        const shooter = alive[Math.floor(Math.random() * alive.length)];
                        enemyBullets.push({ x: shooter.x, y: shooter.y });
                    }
                }

                // Collision detection
                bullets.forEach(b => {
                    enemies.forEach(e => {
                        if (e.alive && Math.abs(b.x - e.x) < 0.04 && Math.abs(b.y - e.y) < 0.04) {
                            e.alive = false; b.y = -1; score += 10;
                            document.getElementById('invaders-score').textContent = score;
                        }
                    });
                });

                for (const b of enemyBullets) {
                    if (Math.abs(b.x - playerX) < 0.05 && b.y > 0.85) { showEnd(false); return; }
                }

                if (enemies.some(e => e.alive && e.y > 0.85)) { showEnd(false); return; }
                if (enemies.every(e => !e.alive)) { showEnd(true); return; }

                // Draw
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Player
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cyan');
                ctx.beginPath();
                ctx.moveTo(playerX * canvas.width, 0.92 * canvas.height);
                ctx.lineTo((playerX - 0.03) * canvas.width, 0.98 * canvas.height);
                ctx.lineTo((playerX + 0.03) * canvas.width, 0.98 * canvas.height);
                ctx.fill();

                // Enemies
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--green');
                enemies.forEach(e => {
                    if (e.alive) ctx.fillRect((e.x - 0.03) * canvas.width, e.y * canvas.height, 0.06 * canvas.width, 0.05 * canvas.height);
                });

                // Bullets
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                bullets.forEach(b => ctx.fillRect(b.x * canvas.width - 2, b.y * canvas.height, 4, 10));

                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                enemyBullets.forEach(b => ctx.fillRect(b.x * canvas.width - 2, b.y * canvas.height, 4, 10));
            };

            this.gameLoop = setInterval(gameLoop, 16);
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        startAsteroids() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="asteroids-score">0</span></div>
                <canvas id="asteroids-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('asteroids-canvas');
            const ctx = canvas.getContext('2d');

            const resizeCanvas = () => {
                const scoreHeight = 30, buttonHeight = 45, padding = 20;
                canvas.width = Math.max(200, container.clientWidth - padding);
                canvas.height = Math.max(150, container.clientHeight - scoreHeight - buttonHeight - padding);
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            let ship = { x: 0.5, y: 0.5, angle: -Math.PI / 2, dx: 0, dy: 0 };
            let bullets = [], asteroids = [], score = 0, gameOver = false, lives = 3;
            const keysPressed = { left: false, right: false, up: false, space: false };
            let canShoot = true;

            const spawnAsteroids = (count) => {
                for (let i = 0; i < count; i++) {
                    asteroids.push({
                        x: Math.random(), y: Math.random(),
                        dx: (Math.random() - 0.5) * 0.008,
                        dy: (Math.random() - 0.5) * 0.008,
                        size: 0.06 + Math.random() * 0.04
                    });
                }
            };
            spawnAsteroids(5);

            const handleKeyDown = (e) => {
                if (e.key === 'ArrowLeft') keysPressed.left = true;
                if (e.key === 'ArrowRight') keysPressed.right = true;
                if (e.key === 'ArrowUp') keysPressed.up = true;
                if (e.key === ' ') { keysPressed.space = true; e.preventDefault(); }
            };
            const handleKeyUp = (e) => {
                if (e.key === 'ArrowLeft') keysPressed.left = false;
                if (e.key === 'ArrowRight') keysPressed.right = false;
                if (e.key === 'ArrowUp') keysPressed.up = false;
                if (e.key === ' ') keysPressed.space = false;
            };
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            this.keyHandler = handleKeyDown;
            this.keyUpHandler = handleKeyUp;

            const showEnd = () => {
                gameOver = true;
                clearInterval(this.gameLoop);
                const size = Math.min(canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText('YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.05);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.font = `${size * 0.04}px 'Fira Code', monospace`;
                ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + size * 0.15);
            };

            const gameLoop = () => {
                if (gameOver) return;

                if (keysPressed.left) ship.angle -= 0.08;
                if (keysPressed.right) ship.angle += 0.08;
                if (keysPressed.up) {
                    ship.dx += Math.cos(ship.angle) * 0.0005;
                    ship.dy += Math.sin(ship.angle) * 0.0005;
                }
                if (keysPressed.space && canShoot) {
                    bullets.push({ x: ship.x, y: ship.y, dx: Math.cos(ship.angle) * 0.02, dy: Math.sin(ship.angle) * 0.02, life: 50 });
                    canShoot = false;
                    setTimeout(() => canShoot = true, 200);
                }

                ship.x += ship.dx; ship.y += ship.dy;
                ship.dx *= 0.99; ship.dy *= 0.99;
                if (ship.x < 0) ship.x = 1; if (ship.x > 1) ship.x = 0;
                if (ship.y < 0) ship.y = 1; if (ship.y > 1) ship.y = 0;

                bullets = bullets.filter(b => { b.x += b.dx; b.y += b.dy; b.life--; return b.life > 0 && b.x > 0 && b.x < 1 && b.y > 0 && b.y < 1; });

                asteroids.forEach(a => {
                    a.x += a.dx; a.y += a.dy;
                    if (a.x < 0) a.x = 1; if (a.x > 1) a.x = 0;
                    if (a.y < 0) a.y = 1; if (a.y > 1) a.y = 0;
                });

                // Bullet-asteroid collision
                bullets.forEach(b => {
                    asteroids.forEach((a, i) => {
                        if (Math.hypot(b.x - a.x, b.y - a.y) < a.size) {
                            b.life = 0;
                            if (a.size > 0.04) {
                                asteroids.push({ x: a.x, y: a.y, dx: (Math.random() - 0.5) * 0.01, dy: (Math.random() - 0.5) * 0.01, size: a.size / 2 });
                                asteroids.push({ x: a.x, y: a.y, dx: (Math.random() - 0.5) * 0.01, dy: (Math.random() - 0.5) * 0.01, size: a.size / 2 });
                            }
                            asteroids.splice(i, 1);
                            score += 20;
                            document.getElementById('asteroids-score').textContent = score;
                        }
                    });
                });

                // Ship-asteroid collision
                for (const a of asteroids) {
                    if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.size) {
                        lives--;
                        ship.x = 0.5; ship.y = 0.5; ship.dx = 0; ship.dy = 0;
                        if (lives <= 0) { showEnd(); return; }
                        break;
                    }
                }

                if (asteroids.length === 0) spawnAsteroids(5 + Math.floor(score / 200));

                // Draw
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Ship
                ctx.save();
                ctx.translate(ship.x * canvas.width, ship.y * canvas.height);
                ctx.rotate(ship.angle);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cyan');
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-10, -8);
                ctx.lineTo(-10, 8);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Bullets
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x * canvas.width, b.y * canvas.height, 3, 0, Math.PI * 2); ctx.fill(); });

                // Asteroids
                ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.lineWidth = 2;
                asteroids.forEach(a => { ctx.beginPath(); ctx.arc(a.x * canvas.width, a.y * canvas.height, a.size * Math.min(canvas.width, canvas.height), 0, Math.PI * 2); ctx.stroke(); });

                // Lives
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${canvas.height * 0.04}px 'Fira Code', monospace`;
                ctx.textAlign = 'left';
                ctx.fillText(`Lives: ${lives}`, 10, canvas.height - 10);
            };

            this.gameLoop = setInterval(gameLoop, 16);
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        startDino() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="dino-score">0</span></div>
                <canvas id="dino-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('dino-canvas');
            const ctx = canvas.getContext('2d');

            const resizeCanvas = () => {
                const scoreHeight = 30, buttonHeight = 45, padding = 20;
                canvas.width = Math.max(200, container.clientWidth - padding);
                canvas.height = Math.max(150, container.clientHeight - scoreHeight - buttonHeight - padding);
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            const groundY = () => canvas.height * 0.8;
            const dinoSize = () => canvas.height * 0.12;

            let dinoY = 0, velocityY = 0, isJumping = false;
            let obstacles = [], score = 0, gameOver = false, speed = 5;

            const handleKey = (e) => {
                if ((e.key === ' ' || e.key === 'ArrowUp') && !isJumping && !gameOver) {
                    velocityY = -canvas.height * 0.035;
                    isJumping = true;
                    e.preventDefault();
                }
                if (gameOver && e.key === ' ') {
                    dinoY = 0; velocityY = 0; isJumping = false;
                    obstacles = []; score = 0; gameOver = false; speed = 5;
                }
            };
            document.addEventListener('keydown', handleKey);
            this.keyHandler = handleKey;

            const showEnd = () => {
                gameOver = true;
                const size = Math.min(canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText('YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.08);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
                ctx.fillText(`Score: ${Math.floor(score / 10)}`, canvas.width / 2, canvas.height / 2 + size * 0.02);
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.font = `${size * 0.04}px 'Fira Code', monospace`;
                ctx.fillText('SPACE to restart or Back to return', canvas.width / 2, canvas.height / 2 + size * 0.12);
            };

            const gameLoop = () => {
                if (gameOver) return;

                // Physics
                velocityY += canvas.height * 0.002; // gravity
                dinoY += velocityY;
                if (dinoY >= 0) { dinoY = 0; isJumping = false; velocityY = 0; }

                // Spawn obstacles
                if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width * 0.6) {
                    if (Math.random() < 0.02) {
                        const h = canvas.height * (0.08 + Math.random() * 0.08);
                        obstacles.push({ x: canvas.width, w: canvas.width * 0.05, h: h });
                    }
                }

                // Move obstacles
                obstacles = obstacles.filter(o => {
                    o.x -= speed;
                    return o.x > -o.w;
                });

                // Collision
                const dino = { x: canvas.width * 0.1, y: groundY() + dinoY - dinoSize(), w: dinoSize() * 0.6, h: dinoSize() };
                for (const o of obstacles) {
                    if (dino.x < o.x + o.w && dino.x + dino.w > o.x && dino.y + dino.h > groundY() - o.h) {
                        showEnd();
                        return;
                    }
                }

                // Score
                score++;
                if (score % 100 === 0) speed += 0.5;
                document.getElementById('dino-score').textContent = Math.floor(score / 10);

                // Draw
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Ground
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.fillRect(0, groundY(), canvas.width, 2);

                // Dino
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--green');
                ctx.fillRect(dino.x, dino.y, dino.w, dino.h);

                // Obstacles
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                obstacles.forEach(o => ctx.fillRect(o.x, groundY() - o.h, o.w, o.h));
            };

            this.gameLoop = setInterval(gameLoop, 16);
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        start2048() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="2048-score">0</span></div>
                <canvas id="2048-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('2048-canvas');
            const ctx = canvas.getContext('2d');
            const SIZE = 4;

            const resizeCanvas = () => {
                const scoreHeight = 30, buttonHeight = 45, padding = 20;
                const availableWidth = container.clientWidth - padding;
                const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
                const size = Math.min(availableWidth, availableHeight);
                canvas.width = size;
                canvas.height = size;
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            let grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
            let score = 0, gameOver = false, won = false;

            const colors = {
                0: '#1a1a2e', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
                32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
                512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
            };

            const addTile = () => {
                const empty = [];
                for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) empty.push([r, c]);
                if (empty.length) {
                    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
                    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
                }
            };

            const slide = (row) => {
                let arr = row.filter(x => x);
                for (let i = 0; i < arr.length - 1; i++) {
                    if (arr[i] === arr[i + 1]) {
                        arr[i] *= 2;
                        score += arr[i];
                        if (arr[i] === 2048) won = true;
                        arr.splice(i + 1, 1);
                    }
                }
                while (arr.length < SIZE) arr.push(0);
                return arr;
            };

            const move = (dir) => {
                let moved = false;
                const oldGrid = JSON.stringify(grid);

                if (dir === 'left') {
                    for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r]);
                } else if (dir === 'right') {
                    for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r].reverse()).reverse();
                } else if (dir === 'up') {
                    for (let c = 0; c < SIZE; c++) {
                        let col = grid.map(row => row[c]);
                        col = slide(col);
                        for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
                    }
                } else if (dir === 'down') {
                    for (let c = 0; c < SIZE; c++) {
                        let col = grid.map(row => row[c]).reverse();
                        col = slide(col).reverse();
                        for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
                    }
                }

                if (JSON.stringify(grid) !== oldGrid) { addTile(); moved = true; }
                document.getElementById('2048-score').textContent = score;
                checkGameOver();
                draw();
            };

            const checkGameOver = () => {
                for (let r = 0; r < SIZE; r++) {
                    for (let c = 0; c < SIZE; c++) {
                        if (grid[r][c] === 0) return;
                        if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return;
                        if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return;
                    }
                }
                gameOver = true;
            };

            const draw = () => {
                const cellSize = canvas.width / SIZE;
                const gap = cellSize * 0.05;

                ctx.fillStyle = '#0a0a15';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                for (let r = 0; r < SIZE; r++) {
                    for (let c = 0; c < SIZE; c++) {
                        const val = grid[r][c];
                        ctx.fillStyle = colors[val] || '#3c3a32';
                        ctx.fillRect(c * cellSize + gap, r * cellSize + gap, cellSize - gap * 2, cellSize - gap * 2);

                        if (val) {
                            ctx.fillStyle = val <= 4 ? '#776e65' : '#f9f6f2';
                            ctx.font = `bold ${cellSize * 0.35}px 'Fira Code', monospace`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(val, c * cellSize + cellSize / 2, r * cellSize + cellSize / 2);
                        }
                    }
                }

                if (won || gameOver) {
                    const size = canvas.width;
                    ctx.fillStyle = 'rgba(0,0,0,0.85)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = won ? getComputedStyle(document.documentElement).getPropertyValue('--green') : getComputedStyle(document.documentElement).getPropertyValue('--red');
                    ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.08);
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                    ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
                    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.02);
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                    ctx.font = `${size * 0.04}px 'Fira Code', monospace`;
                    ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + size * 0.12);
                }
            };

            const handleKey = (e) => {
                if (gameOver || won) return;
                if (e.key === 'ArrowLeft') move('left');
                else if (e.key === 'ArrowRight') move('right');
                else if (e.key === 'ArrowUp') move('up');
                else if (e.key === 'ArrowDown') move('down');
                e.preventDefault();
            };
            document.addEventListener('keydown', handleKey);
            this.keyHandler = handleKey;

            addTile();
            addTile();
            draw();

            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        startFlappy() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';
            container.innerHTML = `
                <div class="game-score">Score: <span id="flappy-score">0</span></div>
                <canvas id="flappy-canvas" class="game-canvas"></canvas>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const canvas = document.getElementById('flappy-canvas');
            const ctx = canvas.getContext('2d');

            const resizeCanvas = () => {
                const scoreHeight = 30;
                const buttonHeight = 45;
                const padding = 20;
                const availableWidth = container.clientWidth - padding;
                const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
                canvas.width = Math.max(200, Math.min(availableWidth, 400));
                canvas.height = Math.max(300, Math.min(availableHeight, 500));
            };
            resizeCanvas();

            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(resizeCanvas);
                this.resizeObserver.observe(container);
            }

            const bird = { x: 50, y: 150, velocity: 0, size: 20 };
            const gravity = 0.5;
            const jumpForce = -8;
            const pipes = [];
            const pipeWidth = 50;
            const pipeGap = 120;
            let score = 0;
            let gameOver = false;
            let started = false;

            const jump = () => {
                if (gameOver) return;
                if (!started) started = true;
                bird.velocity = jumpForce;
            };

            const handleKey = (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    jump();
                }
            };

            const handleClick = () => jump();

            document.addEventListener('keydown', handleKey);
            canvas.addEventListener('click', handleClick);
            this.keyHandler = handleKey;

            const spawnPipe = () => {
                const minHeight = 50;
                const maxHeight = canvas.height - pipeGap - minHeight;
                const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
                pipes.push({
                    x: canvas.width,
                    topHeight: topHeight,
                    passed: false
                });
            };

            const showEndScreen = () => {
                gameOver = true;
                clearInterval(this.gameLoop);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.font = 'bold 24px "Fira Code", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                ctx.font = '16px "Fira Code", monospace';
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
            };

            const update = () => {
                if (gameOver || !started) return;

                bird.velocity += gravity;
                bird.y += bird.velocity;

                // Check boundaries
                if (bird.y < 0 || bird.y + bird.size > canvas.height) {
                    showEndScreen();
                    return;
                }

                // Move pipes
                for (let i = pipes.length - 1; i >= 0; i--) {
                    pipes[i].x -= 3;

                    // Check collision
                    if (bird.x + bird.size > pipes[i].x && bird.x < pipes[i].x + pipeWidth) {
                        if (bird.y < pipes[i].topHeight || bird.y + bird.size > pipes[i].topHeight + pipeGap) {
                            showEndScreen();
                            return;
                        }
                    }

                    // Score
                    if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
                        pipes[i].passed = true;
                        score++;
                        document.getElementById('flappy-score').textContent = score;
                    }

                    // Remove off-screen pipes
                    if (pipes[i].x + pipeWidth < 0) {
                        pipes.splice(i, 1);
                    }
                }
            };

            const draw = () => {
                const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--background');
                const pipeColor = getComputedStyle(document.documentElement).getPropertyValue('--green');
                const birdColor = getComputedStyle(document.documentElement).getPropertyValue('--yellow');

                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw pipes
                ctx.fillStyle = pipeColor;
                pipes.forEach(pipe => {
                    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
                    ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height);
                });

                // Draw bird
                ctx.fillStyle = birdColor;
                ctx.beginPath();
                ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2, 0, Math.PI * 2);
                ctx.fill();

                if (!started && !gameOver) {
                    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--foreground');
                    ctx.font = '14px "Fira Code", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('Press SPACE or Click to start', canvas.width / 2, canvas.height / 2);
                }
            };

            let frameCount = 0;
            this.gameLoop = setInterval(() => {
                update();
                draw();
                frameCount++;
                if (started && !gameOver && frameCount % 90 === 0) {
                    spawnPipe();
                }
            }, 1000 / 60);

            document.getElementById('game-back').addEventListener('click', () => {
                canvas.removeEventListener('click', handleClick);
                this.showMenu();
            });
        },

        startMinesweeper() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';

            const gridSize = 8;
            const mineCount = 10;

            container.innerHTML = `
                <div class="game-score">Mines: <span id="mine-count">${mineCount}</span></div>
                <div id="minesweeper-grid" style="display: grid; grid-template-columns: repeat(${gridSize}, 30px); gap: 2px; justify-content: center;"></div>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            const grid = [];
            const revealed = [];
            const flagged = [];
            let gameOver = false;
            let won = false;

            // Initialize grid
            for (let i = 0; i < gridSize; i++) {
                grid[i] = [];
                revealed[i] = [];
                flagged[i] = [];
                for (let j = 0; j < gridSize; j++) {
                    grid[i][j] = 0;
                    revealed[i][j] = false;
                    flagged[i][j] = false;
                }
            }

            // Place mines
            let minesPlaced = 0;
            while (minesPlaced < mineCount) {
                const x = Math.floor(Math.random() * gridSize);
                const y = Math.floor(Math.random() * gridSize);
                if (grid[x][y] !== -1) {
                    grid[x][y] = -1;
                    minesPlaced++;
                }
            }

            // Calculate numbers
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    if (grid[i][j] === -1) continue;
                    let count = 0;
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            const ni = i + di, nj = j + dj;
                            if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize && grid[ni][nj] === -1) {
                                count++;
                            }
                        }
                    }
                    grid[i][j] = count;
                }
            }

            const numberColors = ['', 'blue', 'green', 'red', 'darkblue', 'darkred', 'cyan', 'black', 'gray'];

            const revealCell = (x, y) => {
                if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
                if (revealed[x][y] || flagged[x][y]) return;

                revealed[x][y] = true;

                if (grid[x][y] === 0) {
                    for (let di = -1; di <= 1; di++) {
                        for (let dj = -1; dj <= 1; dj++) {
                            revealCell(x + di, y + dj);
                        }
                    }
                }
            };

            const checkWin = () => {
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        if (grid[i][j] !== -1 && !revealed[i][j]) return false;
                    }
                }
                return true;
            };

            const renderGrid = () => {
                const gridEl = document.getElementById('minesweeper-grid');
                gridEl.innerHTML = '';

                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        const cell = document.createElement('div');
                        cell.style.cssText = `
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 14px;
                            font-weight: bold;
                            cursor: pointer;
                            border-radius: 4px;
                            user-select: none;
                        `;

                        if (revealed[i][j]) {
                            cell.style.backgroundColor = 'var(--background)';
                            cell.style.border = '1px solid var(--comment)';
                            if (grid[i][j] === -1) {
                                cell.textContent = '💣';
                            } else if (grid[i][j] > 0) {
                                cell.textContent = grid[i][j];
                                cell.style.color = `var(--${numberColors[grid[i][j]] || 'foreground'})`;
                            }
                        } else {
                            cell.style.backgroundColor = 'var(--comment)';
                            cell.style.border = '1px solid var(--foreground)';
                            if (flagged[i][j]) {
                                cell.textContent = '🚩';
                            }
                        }

                        const x = i, y = j;
                        cell.addEventListener('click', () => {
                            if (gameOver || won) return;
                            if (flagged[x][y]) return;

                            if (grid[x][y] === -1) {
                                // Game over
                                gameOver = true;
                                for (let a = 0; a < gridSize; a++) {
                                    for (let b = 0; b < gridSize; b++) {
                                        if (grid[a][b] === -1) revealed[a][b] = true;
                                    }
                                }
                                renderGrid();
                                document.getElementById('mine-count').textContent = 'LOST!';
                            } else {
                                revealCell(x, y);
                                renderGrid();
                                if (checkWin()) {
                                    won = true;
                                    document.getElementById('mine-count').textContent = 'WON!';
                                }
                            }
                        });

                        cell.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            if (gameOver || won || revealed[x][y]) return;
                            flagged[x][y] = !flagged[x][y];
                            renderGrid();
                        });

                        gridEl.appendChild(cell);
                    }
                }
            };

            renderGrid();
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        startMemory() {
            const container = document.getElementById('games-content');
            container.className = 'game-canvas-container';

            const symbols = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🥝', '🍒'];
            const pairs = [...symbols, ...symbols];
            const shuffled = pairs.sort(() => Math.random() - 0.5);

            container.innerHTML = `
                <div class="game-score">Moves: <span id="memory-moves">0</span></div>
                <div id="memory-grid" style="display: grid; grid-template-columns: repeat(4, 60px); gap: 8px; justify-content: center;"></div>
                <button class="game-back-btn" id="game-back">Back</button>
            `;

            let flipped = [];
            let matched = [];
            let moves = 0;
            let canFlip = true;

            const renderGrid = () => {
                const gridEl = document.getElementById('memory-grid');
                gridEl.innerHTML = '';

                shuffled.forEach((symbol, index) => {
                    const card = document.createElement('div');
                    card.style.cssText = `
                        width: 60px;
                        height: 60px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 28px;
                        cursor: pointer;
                        border-radius: 8px;
                        transition: transform 0.3s ease;
                        user-select: none;
                    `;

                    const isFlipped = flipped.includes(index) || matched.includes(index);

                    if (isFlipped) {
                        card.style.backgroundColor = 'var(--background)';
                        card.style.border = '2px solid var(--green)';
                        card.textContent = symbol;
                    } else {
                        card.style.backgroundColor = 'var(--comment)';
                        card.style.border = '2px solid var(--foreground)';
                        card.textContent = '?';
                    }

                    if (matched.includes(index)) {
                        card.style.opacity = '0.6';
                    }

                    card.addEventListener('click', () => {
                        if (!canFlip || flipped.includes(index) || matched.includes(index)) return;

                        flipped.push(index);
                        renderGrid();

                        if (flipped.length === 2) {
                            canFlip = false;
                            moves++;
                            document.getElementById('memory-moves').textContent = moves;

                            const [first, second] = flipped;
                            if (shuffled[first] === shuffled[second]) {
                                matched.push(first, second);
                                flipped = [];
                                canFlip = true;
                                renderGrid();

                                if (matched.length === shuffled.length) {
                                    document.getElementById('memory-moves').textContent = `${moves} - WIN!`;
                                }
                            } else {
                                setTimeout(() => {
                                    flipped = [];
                                    canFlip = true;
                                    renderGrid();
                                }, 1000);
                            }
                        }
                    });

                    gridEl.appendChild(card);
                });
            };

            renderGrid();
            document.getElementById('game-back').addEventListener('click', () => this.showMenu());
        },

        cleanup() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
            if (this.keyHandler) {
                document.removeEventListener('keydown', this.keyHandler);
                this.keyHandler = null;
            }
            if (this.keyUpHandler) {
                document.removeEventListener('keyup', this.keyUpHandler);
                this.keyUpHandler = null;
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        }
    };

    // === DESKTOP ICONS HANDLER ===
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const app = icon.dataset.app;
            if (app === 'themes') ThemePickerApp.open();
            else if (app === 'player') ASCIIPlayerApp.open();
            else if (app === 'music') MusicApp.open();
            else if (app === 'games') GamesApp.open();
        });
    });

    // === DRAG FUNCTIONALITY ===
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

    // === RESIZE FUNCTIONALITY ===
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

    // === CURSOR MANAGEMENT ===
    const updateCursorPosition = () => {
        if (isCursorLocked) return;

        const isActive = document.activeElement === commandInput && !commandInput.disabled;
        cursor.classList.toggle('cursor-hidden', !isActive);

        if (!isActive) return;

        const selection = typeof commandInput.selectionStart === 'number'
            ? commandInput.selectionStart
            : commandInput.value.length;
        const textBeforeCaret = commandInput.value.slice(0, selection) || '\u200b';

        inputMirror.textContent = textBeforeCaret.replace(/ /g, '\u00a0');
        cursor.style.left = `${inputMirror.offsetWidth}px`;
    };

    const scheduleCursorUpdate = () => window.requestAnimationFrame(updateCursorPosition);

    const setCursorLock = (shouldLock) => {
        isCursorLocked = shouldLock;
        cursor.classList.toggle('cursor-hidden', shouldLock);
        if (!shouldLock) {
            scheduleCursorUpdate();
        }
    };

    ['input', 'keyup', 'keydown', 'click'].forEach((eventType) => {
        commandInput.addEventListener(eventType, scheduleCursorUpdate);
    });
    commandInput.addEventListener('focus', scheduleCursorUpdate);
    commandInput.addEventListener('blur', scheduleCursorUpdate);
    window.addEventListener('resize', scheduleCursorUpdate);

    // === STATE MANAGEMENT ===
    let commandHistory = [];
    let historyIndex = 0;
    let isMatrixRunning = false;

    // === HELPERS ===
    const escapeHtml = (value = '') => value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return char;
        }
    });

    // === ASCII ART AND WELCOME MESSAGE ===
    const asciiArt = `<span class="ascii-art">
.______    _______ .___  ___.    ____    ____  __  .__   __.  _______   ______
|   _  \\  |   ____||   \\/   |    \\   \\  /   / |  | |  \\ |  | |       \\ /  __  \\
|  |_)  | |  |__   |  \\  /  |     \\   \\/   /  |  | |   \\|  | |  .--.  |  |  |  |
|   _  <  |   __|  |  |\\/|  |      \\      /   |  | |  . \`  | |  |  |  |  |  |  |
|  |_)  | |  |____ |  |  |  |       \\    /    |  | |  |\\   | |  '--'  |  \`--'  |
|______/  |_______||__|  |__|        \\__/     |__| |__| \\__| |_______/ \\______/

</span>`;

    const welcomeMessage = asciiArt + `
  <span class="highlight">Este é o meu Portfólio Interativo!</span>

  Meu nome é Gabriel Mendes Lopes e sou um Desenvolvedor Fullstack.

  Digite '<span class="output-command">help</span>' para ver a lista de comandos disponíveis.
            `;

    // === API INTEGRATIONS ===

    // GitHub API
    const GitHubAPI = {
        username: 'ShybaPsY',
        cache: {
            stats: null,
            timestamp: 0
        },
        cacheTime: 5 * 60 * 1000, // 5 minutes

        async fetchStats() {
            // Check cache first
            const now = Date.now();
            if (this.cache.stats && (now - this.cache.timestamp < this.cacheTime)) {
                return this.cache.stats;
            }

            try {
                // Fetch all repos to calculate statistics
                const reposResponse = await fetch(`https://api.github.com/users/${this.username}/repos?per_page=100`);
                if (!reposResponse.ok) throw new Error('Failed to fetch repos');
                const repos = await reposResponse.json();

                // Calculate total stars
                const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

                // Fetch language data for each repository
                const languages = {};
                let totalBytes = 0;

                for (const repo of repos) {
                    try {
                        // Fetch actual language bytes from GitHub API
                        const langResponse = await fetch(`https://api.github.com/repos/${this.username}/${repo.name}/languages`);
                        if (langResponse.ok) {
                            const langData = await langResponse.json();

                            // Aggregate language bytes
                            for (const [lang, bytes] of Object.entries(langData)) {
                                languages[lang] = (languages[lang] || 0) + bytes;
                                totalBytes += bytes;
                            }
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch languages for ${repo.name}:`, err);
                    }
                }

                // Calculate percentages and sort
                const languageStats = Object.entries(languages)
                    .map(([lang, bytes]) => ({
                        name: lang,
                        percentage: ((bytes / totalBytes) * 100).toFixed(2)
                    }))
                    .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
                    .slice(0, 6); // Top 6 languages

                // Fetch user data for additional stats
                const userResponse = await fetch(`https://api.github.com/users/${this.username}`);
                if (!userResponse.ok) throw new Error('Failed to fetch user');
                const userData = await userResponse.json();

                const stats = {
                    totalStars,
                    totalRepos: userData.public_repos,
                    languages: languageStats
                };

                // Update cache
                this.cache.stats = stats;
                this.cache.timestamp = now;

                return stats;
            } catch (error) {
                console.error('GitHub API error:', error);
                return null;
            }
        },

        formatStats(stats) {
            if (!stats) {
                return '<span class="error">Não foi possível carregar as estatísticas do GitHub.</span>\n\n<span class="comment">Verifique sua conexão com a internet.</span>';
            }

            let output = '<span class="highlight">Estatísticas do GitHub de Gabriel Lopes:</span>\n\n';

            // Statistics section
            output += '<span class="title-blue">📊 Estatísticas:</span>\n';
            output += `  <span class="detail-cyan">⭐ Total de estrelas:</span>       <span class="detail-green">${stats.totalStars}</span>\n`;
            output += `  <span class="detail-cyan">📁 Total de repositórios:</span>   <span class="detail-green">${stats.totalRepos}</span>\n\n`;

            // Technologies section
            output += '<span class="title-blue">💻 Tecnologias:</span>\n';
            stats.languages.forEach(lang => {
                const barLength = Math.round(parseFloat(lang.percentage) / 5); // Scale to fit terminal
                const bar = '█'.repeat(barLength);
                output += `  <span class="detail-cyan">${lang.name}</span> ${lang.percentage}% ${bar}\n`;
            });

            output += `\n<span class="comment">Veja mais em: <a href="https://github.com/${this.username}" target="_blank">github.com/${this.username}</a></span>`;

            return output;
        }
    };

    // Quote API
    const QuoteAPI = {
        cache: {
            quote: null,
            timestamp: 0
        },
        cacheTime: 60 * 1000, // 1 minute

        // Fallback quotes in case API fails
        fallbackQuotes: [
            { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
            { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
            { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
            { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
            { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
            { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
            { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
            { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
            { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
            { text: "It's not a bug – it's an undocumented feature.", author: "Anonymous" }
        ],

        async fetch() {
            // Check cache first
            const now = Date.now();
            if (this.cache.quote && (now - this.cache.timestamp < this.cacheTime)) {
                return this.cache.quote;
            }

            try {
                const response = await fetch('https://api.quotable.io/random?tags=technology,famous-quotes');
                if (!response.ok) {
                    throw new Error('Failed to fetch quote');
                }
                const data = await response.json();

                const quote = {
                    text: data.content,
                    author: data.author
                };

                // Update cache
                this.cache.quote = quote;
                this.cache.timestamp = now;

                return quote;
            } catch (error) {
                console.error('Quote API error:', error);
                // Return random fallback quote
                return this.fallbackQuotes[Math.floor(Math.random() * this.fallbackQuotes.length)];
            }
        },

        format(quote) {
            return `
  <span class="detail-cyan">💭 Quote of the Moment:</span>

  <span class="highlight">"${quote.text}"</span>

  <span class="comment">— ${quote.author}</span>`;
        }
    };

    // === COMMANDS OBJECT ===
    const commands = {
        help: `
  <span class="highlight">Comandos Disponíveis:</span>

  <span class="title-blue">Portfolio:</span>
  <span class="output-command">sobre</span>          - Mostra informações sobre mim.
  <span class="output-command">experiencia</span>    - Exibe minha experiência profissional.
  <span class="output-command">projetos</span>       - Lista meus principais projetos.
  <span class="output-command">skills</span>         - Lista minhas habilidades técnicas e interpessoais.
  <span class="output-command">cursos</span>         - Exibe meus cursos e certificações.
  <span class="output-command">idiomas</span>        - Lista os idiomas que eu falo.
  <span class="output-command">contato</span>        - Exibe minhas informações de contato.
  <span class="output-command">github</span>         - Mostra minhas estatísticas do GitHub.
  <span class="output-command">download cv</span>    - Link para baixar meu currículo.

  <span class="title-blue">Customization:</span>
  <span class="output-command">themes</span>         - Lista os temas disponíveis.
  <span class="output-command">theme [nome]</span>   - Muda o tema do terminal.

  <span class="title-blue">Utilities:</span>
  <span class="output-command">clear</span>          - Limpa a tela.
  <span class="output-command">bemvindo</span>       - Mostra a mensagem de boas-vindas novamente.
  <span class="output-command">quote</span>          - Exibe uma citação inspiradora sobre programação.
  <span class="output-command">conquistas</span>     - Lista suas conquistas desbloqueadas.
  <span class="output-command">crt</span>            - Ativa/desativa efeito CRT no monitor.
  <span class="output-command">extras</span>         - Comandos extras e exploração.`,

        sobre: `
  <span class="highlight">Sobre Mim</span>

  Olá! Sou Gabriel Mendes Lopes, um <span class="title-blue">desenvolvedor fullstack</span> apaixonado por criar soluções eficientes, escaláveis e robustas.
  Atualmente, estou no 5º termo do curso de <span class="title-blue">Sistemas de Informação na FIPP</span> (Faculdade de Informática de Presidente Prudente).
  Resido em Anhumas, SP.

  Sou Bolsista de Iniciação Tecnológica do CNPq na <a href="https://www.fct.unesp.br/" target="_blank">FCT Unesp</a>.

  Tenho interesse em desenvolvimento de aplicações e automações.
  Sou proativo, dedicado e estou sempre em busca de aprendizado contínuo para me tornar um profissional de excelência.`,

        experiencia: `
  <span class="highlight">Experiência Profissional</span>

  <span class="output-command">Bolsista de Iniciação Tecnológica (PIBITI) - Unesp</span>
  <span class="comment">Setembro 2025 - Setembro 2026 (1 ano)</span>

  - Responsável pelo desenvolvimento e automação de equipamentos para medição de propriedades piezoelétricas (d33) em polímeros.

  - Desenvolvimento de software de controle em malha fechada com Arduino para integrar e gerenciar atuadores pneumáticos e sensores de carga.

  - Prototipagem, execução de testes sistemáticos para validação do equipamento e preparação da documentação para registro de patente e software.`,

        projetos: `
  <span class="highlight">Meus Projetos</span>

  1. <span class="title-blue">Sistema de Registro de Novo Colaborador</span>
     - <span class="detail-green">Descrição:</span> Sistema multi-tenant para registro de admissão de funcionários, permitindo que contadores gerenciem formulários únicos e coletem informações de colaboradores de forma segura.
     - <span class="detail-green">Tecnologias:</span> HTML, CSS (TailwindCSS), JavaScript, Supabase (PostgreSQL), Vercel Serverless Functions.

  2. <span class="title-blue">Piezo Peak Analyzer (PPA)</span>
     - <span class="detail-green">Descrição:</span> Aplicação desktop para análise e visualização de medições de sensores piezoelétricos, com detecção de picos, cálculo de potência e gráficos interativos sincronizados.
     - <span class="detail-green">Tecnologias:</span> Java 24, JavaFX, Maven, BigDecimal (alta precisão numérica).

  3. <span class="title-blue">Absorbance Point Analyzer (APA)</span>
     - <span class="detail-green">Descrição:</span> Sistema de análise de dados de espectroscopia de absorbância para detecção de picos e cálculo da proporção de fase beta em análises cristalográficas.
     - <span class="detail-green">Tecnologias:</span> Java 24, JavaFX, Maven, ControlsFX, ValidatorFX.`,

        skills: `
  <span class="highlight">Habilidades Técnicas e Interpessoais</span>

  <span class="title-blue">Hard Skills (Técnicas):</span>
  - <span class="output-command">Linguagens:</span> Java, C, C++, Go, JavaScript, Python.
  - <span class="output-command">Bancos de Dados:</span> PostgreSQL, MongoDB, MySQL.
  - <span class="output-command">DevOps & Ferramentas:</span> Git, CI/CD, Nginx.
  - <span class="output-command">Cloud:</span> Google Cloud, Microsoft Azure (AZ-900).
  - <span class="output-command">Análise de Dados:</span> Power BI.
  - <span class="output-command">Arquitetura:</span> Microsserviços, APIs RESTful.

  <span class="title-blue">Soft Skills (Interpessoais):</span>
  - Comunicação, Resolução de Problemas, Proatividade, Trabalho em Equipe, Negociação.`,

        cursos: `
  <span class="highlight">Cursos e Certificações</span>

  - <span class="title-blue">2024:</span> Curso Completo de Linguagem C e C++ <span class="detail-green">(UDEMY)</span>
  - <span class="title-blue">2024:</span> Power BI <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2024:</span> Python 1 <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2024:</span> Soluções Integradas com IoT <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2023:</span> Implantação de Serviços de IA em Nuvem - Google Cloud AI <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2023:</span> Implantação de Serviços em Nuvem - Microsoft AZ-900 <span class="detail-green">(SENAI)</span>`,

        idiomas: `
  <span class="highlight">Idiomas</span>

  - <span class="title-blue">Português:</span> <span class="detail-green">Nativo</span>
  - <span class="title-blue">Inglês:</span> <span class="detail-green">Avançado (Nível C1)</span>
  - <span class="title-blue">Espanhol:</span> <span class="detail-green">Básico</span>`,

        contato: `
  <span class="highlight">Entre em Contato</span>

  - <span class="title-blue">Email:</span> <a href="mailto:asdgabrielmlopes@gmail.com">asdgabrielmlopes@gmail.com</a>
  - <span class="title-blue">WhatsApp:</span> <a href="https://wa.me/5518996189978?text=Ol%C3%A1%2C%20vim%20pelo%20seu%20portif%C3%B3lio" target="_blank">+55 18 99618-9978</a>
  - <span class="title-blue">LinkedIn:</span> <a href="https://www.linkedin.com/in/gabriel-lopes-18b839270/" target="_blank">linkedin.com/in/gabriel-lopes-18b839270/</a>
  - <span class="title-blue">GitHub:</span> <a href="https://github.com/ShybaPsY" target="_blank">github.com/ShybaPsY</a>`,

        'download cv': `
  <span class="highlight">Download do Currículo</span>

  Clique no link abaixo para baixar meu CV em formato PDF.

  <span class="title-blue">Link:</span> <a href="Currículo - Gabriel Lopes.pdf" target="_blank">Gabriel_Mendes_Lopes_CV.pdf</a>`,

        bemvindo: welcomeMessage,

        extras: `
  <span class="highlight">Comandos Extras:</span>

  <span class="title-blue">Exploração:</span>
  <span class="output-command">ls</span>             - Lista arquivos e diretórios disponíveis.
  <span class="output-command">tree</span>           - Mostra estrutura em árvore do portfolio.
  <span class="output-command">neofetch</span>       - Informações do sistema (estilo Linux).

  <span class="title-blue">Easter Eggs:</span>
  <span class="output-command">secret</span>         - Descubra comandos escondidos.
  <span class="output-command">coffee</span>         - Pegue um café virtual.
  <span class="output-command">sudo</span>           - Tente obter permissões de root.
  <span class="output-command">hack</span>           - Hackeie o mainframe (simulação).
  <span class="output-command">42</span>             - A resposta definitiva.
  <span class="output-command">vim</span>            - Entre no editor Vim.
  <span class="output-command">sl</span>             - Locomotive ASCII.
  <span class="output-command">matrix</span>         - Efeito Matrix no fundo.

  <span class="comment">Digite qualquer comando acima para explorá-lo!</span>`,

        // === File System Style Commands ===
        ls: `
  <span class="highlight">Diretórios e Arquivos Disponíveis:</span>

  <span class="detail-cyan">📁 portfolio/</span>
    <span class="output-command">sobre.txt</span>         - Informações pessoais
    <span class="output-command">experiencia.md</span>   - Histórico profissional
    <span class="output-command">projetos.json</span>    - Portfólio de projetos
    <span class="output-command">skills.yaml</span>      - Competências técnicas
    <span class="output-command">cursos.csv</span>       - Certificações
    <span class="output-command">idiomas.txt</span>      - Fluência linguística

  <span class="detail-cyan">📁 contato/</span>
    <span class="output-command">email.lnk</span>        - Endereço de e-mail
    <span class="output-command">linkedin.url</span>     - Perfil profissional
    <span class="output-command">github.url</span>       - Repositórios

  <span class="detail-cyan">📄 curriculo.pdf</span>      - Currículo completo

  <span class="comment">Use os comandos para "abrir" cada arquivo</span>`,

        tree: `
  <span class="highlight">Estrutura do Portfolio:</span>

  <span class="detail-cyan">.</span>
  ├── <span class="detail-green">README.md</span>
  ├── <span class="detail-cyan">portfolio/</span>
  │   ├── sobre.txt
  │   ├── experiencia.md
  │   ├── projetos.json
  │   ├── skills.yaml
  │   ├── cursos.csv
  │   └── idiomas.txt
  ├── <span class="detail-cyan">contato/</span>
  │   ├── email.lnk
  │   ├── linkedin.url
  │   └── github.url
  ├── <span class="detail-cyan">config/</span>
  │   └── themes.conf
  └── curriculo.pdf

  3 directories, 11 files`,

        neofetch: `
  <span class="detail-cyan">      ___           ___       </span>     <span class="detail-green">gabriel@portfolio</span>
  <span class="detail-cyan">     /  /\\         /__/\\      </span>     <span class="comment">─────────────────</span>
  <span class="detail-cyan">    /  /:/_       |  |::\\     </span>     <span class="title-blue">OS:</span> Portfolio v2.0
  <span class="detail-cyan">   /  /:/ /\\      |  |:|:\\    </span>     <span class="title-blue">Host:</span> GitHub Pages
  <span class="detail-cyan">  /  /:/_/::\\   __|__|:|\\:\\   </span>     <span class="title-blue">Kernel:</span> JavaScript ES6+
  <span class="detail-cyan"> /__/:/__\\/\\:\\ /__/::::| \\:\\  </span>     <span class="title-blue">Uptime:</span> ${Math.floor((Date.now() - performance.timing.navigationStart) / 1000)} seconds
  <span class="detail-cyan"> \\  \\:\\ /~~/:/ \\  \\:\\~~\\__\\/  </span>     <span class="title-blue">Shell:</span> terminal.js
  <span class="detail-cyan">  \\  \\:\\  /:/   \\  \\:\\        </span>     <span class="title-blue">Theme:</span> ${ThemeManager.current}
  <span class="detail-cyan">   \\  \\:\\/:/     \\  \\:\\       </span>     <span class="title-blue">Terminal:</span> Fira Code
  <span class="detail-cyan">    \\  \\::/       \\  \\:\\      </span>     <span class="title-blue">CPU:</span> Full-Stack Developer
  <span class="detail-cyan">     \\__\\/         \\__\\/      </span>     <span class="title-blue">Memory:</span> Infinito
                                    <span class="title-blue">Location:</span> Anhumas, SP
                                    <span class="title-blue">Languages:</span> PT, EN, ES`,

        // === Easter Eggs ===
        sudo: `
  <span class="error">Acesso Negado.</span>

  Usuário não está no arquivo sudoers. Este incidente será reportado. ;)`,

        coffee: function() {
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.check('coffee_lover');
            }
            return `
  <span class="detail-cyan">
      ( (
       ) )
    ........
    |      |]
    \\      /
     \`----'
  </span>
  <span class="highlight">☕ Pegando um café...</span>

  <span class="comment">Programador sem café = erro de compilação!</span>`;
        },

        hack: async function() {
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.check('hacker');
            }
            const lines = [
                '<span class="detail-green">[✓] Inicializando sequência de hack...</span>',
                '<span class="comment">Conectando ao mainframe...</span>',
                '<span class="detail-cyan">Bypassing firewall... █████████░ 90%</span>',
                '<span class="detail-green">[✓] Firewall bypassed</span>',
                '<span class="comment">Descriptografando senha...</span>',
                '<span class="detail-cyan">Cracking password... ████████░░ 80%</span>',
                '<span class="detail-green">[✓] Senha obtida: hunter2</span>',
                '<span class="comment">Acessando banco de dados...</span>',
                '<span class="detail-green">[✓] Acesso concedido!</span>',
                '',
                '<span class="highlight">🎉 Você hackeou o mainframe!</span>',
                '<span class="comment">Brincadeira, isso é só um easter egg 😄</span>'
            ];
            return lines.join('\n');
        },

        '42': `
  <span class="highlight">A Resposta para a Vida, o Universo e Tudo Mais:</span>

  <span class="detail-cyan" style="font-size: 2em;">42</span>

  <span class="comment">"Don't Panic!" - Guia do Mochileiro das Galáxias</span>`,

        vim: `
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~              VIM - Vi IMproved                     </span>
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~             version 8.2.0000                       </span>
  <span class="detail-cyan">~        by Bram Moolenaar et al.                    </span>
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~                                                    </span>

  <span class="comment">Para sair do Vim, digite ':q' (brincadeira, use 'clear')</span>
  <span class="highlight">Você está preso no Vim!</span> 😱`,

        sl: `
  <span class="detail-cyan">
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  |  ______|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/
  </span>
  <span class="comment">Você digitou 'sl' em vez de 'ls'!</span>
  <span class="highlight">🚂 Choo choo!</span>`,

        secret: function() {
            if (typeof AchievementManager !== 'undefined') {
                AchievementManager.check('curious');
            }
            return `
  <span class="highlight">🎉 Você encontrou um comando secreto!</span>

  <span class="comment">Para ver todos os easter eggs e comandos de exploração, digite:</span>

  <span class="output-command">extras</span>

  <span class="comment">Continue explorando para achar mais surpresas! 🔍</span>`;
        },

        // === API Commands ===
        github: async function() {
            const stats = await GitHubAPI.fetchStats();
            return GitHubAPI.formatStats(stats);
        },

        quote: async function() {
            const quote = await QuoteAPI.fetch();
            return QuoteAPI.format(quote);
        },

        // === Desktop Commands ===
        desktop: `
  <span class="highlight">Desktop Apps:</span>

  <span class="title-blue">Applications:</span>
  <span class="output-command">open themes</span>     - Seletor visual de temas
  <span class="output-command">open player</span>     - Player de animações ASCII
  <span class="output-command">open music</span>      - Player de música lo-fi
  <span class="output-command">open games</span>      - Mini jogos (Snake, Pong)

  <span class="comment">Você também pode clicar duas vezes nos ícones à esquerda!</span>`,

        'open themes': function() {
            ThemePickerApp.open();
            return '<span class="detail-green">Abrindo Theme Picker...</span>';
        },

        'open player': function() {
            ASCIIPlayerApp.open();
            return '<span class="detail-green">Abrindo ASCII Video Player...</span>';
        },

        'open music': function() {
            MusicApp.open();
            return '<span class="detail-green">Abrindo Music Player...</span>';
        },

        'open games': function() {
            GamesApp.open();
            return '<span class="detail-green">Abrindo Mini Games...</span>';
        },

        conquistas: function() {
            return AchievementManager.listAchievements();
        },

        crt: function() {
            document.body.classList.toggle('crt-enabled');
            const crtBtn = document.getElementById('taskbar-crt');
            if (crtBtn) crtBtn.classList.toggle('active');
            const enabled = document.body.classList.contains('crt-enabled');
            localStorage.setItem('crt-enabled', enabled);
            return enabled
                ? '<span class="detail-green">Efeito CRT ativado!</span> Aproveite a nostalgia.'
                : '<span class="comment">Efeito CRT desativado.</span>';
        },
    };

    // === COMMAND ALIASES ===
    const aliases = {
        // Clear aliases
        'cls': 'clear',
        'limpar': 'clear',
        // About aliases
        'about': 'sobre',
        'whoami': 'sobre',
        // Experience aliases
        'exp': 'experiencia',
        'experience': 'experiencia',
        'trabalho': 'experiencia',
        // Projects aliases
        'projects': 'projetos',
        'portfolio': 'projetos',
        // Skills aliases
        'habilidades': 'skills',
        'tecnologias': 'skills',
        // Courses aliases
        'courses': 'cursos',
        'certificacoes': 'cursos',
        // Languages aliases
        'languages': 'idiomas',
        'langs': 'idiomas',
        // Contact aliases
        'contact': 'contato',
        'email': 'contato',
        // CV aliases
        'cv': 'download cv',
        'resume': 'download cv',
        'curriculo': 'download cv',
        // Welcome aliases
        'welcome': 'bemvindo',
        'home': 'bemvindo',
        // Help aliases
        'ajuda': 'help',
        'commands': 'help',
        '?': 'help',
        // Theme aliases
        'tema': 'theme',
        'temas': 'themes',
        // Extras aliases
        'easter': 'extras',
        'easteregg': 'extras',
        'fun': 'extras',
        // Desktop aliases
        'apps': 'desktop',
        'aplicativos': 'desktop',
        // Achievements aliases
        'achievements': 'conquistas',
        'badges': 'conquistas',
        'trofeus': 'conquistas',
    };

    // === TAB COMPLETION ===
    const TabCompletion = {
        lastInput: '',
        matches: [],
        matchIndex: 0,
        isThemeCompletion: false,

        getAllCommands() {
            const cmds = Object.keys(commands);
            const als = Object.keys(aliases);
            const special = ['clear', 'matrix', 'theme', 'themes'];
            return [...new Set([...cmds, ...als, ...special])].sort();
        },

        getAllThemes() {
            return Object.keys(ThemeManager.themes).sort();
        },

        getMatches(partial) {
            if (!partial) return [];
            const lower = partial.toLowerCase();
            return this.getAllCommands().filter(cmd => cmd.startsWith(lower));
        },

        getThemeMatches(partial) {
            if (!partial) return this.getAllThemes();
            const lower = partial.toLowerCase();
            return this.getAllThemes().filter(theme => theme.startsWith(lower));
        },

        complete(input) {
            const trimmed = input.trim().toLowerCase();

            // Check if completing theme name (e.g., "theme dra" -> "theme dracula")
            if (trimmed.startsWith('theme ') || trimmed.startsWith('tema ')) {
                const prefix = trimmed.startsWith('theme ') ? 'theme ' : 'tema ';
                const themePartial = trimmed.substring(prefix.length);

                if (trimmed !== this.lastInput) {
                    this.lastInput = trimmed;
                    this.matches = this.getThemeMatches(themePartial);
                    this.matchIndex = 0;
                    this.isThemeCompletion = true;
                } else if (this.matches.length > 0) {
                    this.matchIndex = (this.matchIndex + 1) % this.matches.length;
                }

                if (this.matches.length > 0) {
                    return `theme ${this.matches[this.matchIndex]}`;
                }
                return input;
            }

            // Regular command completion
            this.isThemeCompletion = false;

            if (trimmed !== this.lastInput) {
                this.lastInput = trimmed;
                this.matches = this.getMatches(trimmed);
                this.matchIndex = 0;
            } else if (this.matches.length > 0) {
                this.matchIndex = (this.matchIndex + 1) % this.matches.length;
            }

            if (this.matches.length > 0) {
                return this.matches[this.matchIndex];
            }
            return input;
        },

        reset() {
            this.lastInput = '';
            this.matches = [];
            this.matchIndex = 0;
            this.isThemeCompletion = false;
        }
    };

    // === FUZZY SEARCH ===
    const FuzzySearch = {
        // Calculate Levenshtein distance between two strings
        levenshtein(a, b) {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[b.length][a.length];
        },

        // Find similar commands
        findSimilar(input, maxDistance = 3) {
            const lower = input.toLowerCase();
            const allCommands = TabCompletion.getAllCommands();

            const suggestions = allCommands
                .map(cmd => ({
                    command: cmd,
                    distance: this.levenshtein(lower, cmd)
                }))
                .filter(item => item.distance <= maxDistance && item.distance > 0)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3)
                .map(item => item.command);

            return suggestions;
        },

        // Generate suggestion message
        getSuggestionMessage(input) {
            const suggestions = this.findSimilar(input);
            if (suggestions.length === 0) return null;

            if (suggestions.length === 1) {
                return `Você quis dizer '<span class="output-command">${suggestions[0]}</span>'?`;
            }

            const formatted = suggestions
                .map(s => `'<span class="output-command">${s}</span>'`)
                .join(', ');
            return `Você quis dizer: ${formatted}?`;
        }
    };

    // === TYPING EFFECT FUNCTIONS ===
    function typeText(targetElement, text, speed) {
        return new Promise(resolve => {
            let i = 0;
            const start = performance.now();

            function tick() {
                const now = performance.now();
                const elapsed = now - start;
                const expectedCount = Math.floor(elapsed / speed);

                while (i < Math.min(expectedCount, text.length)) {
                    targetElement.appendChild(document.createTextNode(text[i]));
                    i++;
                }

                terminalBody.scrollTop = terminalBody.scrollHeight;

                if (i < text.length) {
                    setTimeout(tick, speed);
                } else {
                    resolve();
                }
            }

            tick();
        });
    }

    async function typeNodeContents(targetElement, sourceNode, defaultSpeed) {
        const nodes = Array.from(sourceNode.childNodes);
        for (const node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const speed = node.parentElement.classList.contains('ascii-art') ? 5 : defaultSpeed;
                await typeText(targetElement, node.textContent, speed);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const newElement = document.createElement(node.tagName);
                for (const attr of node.attributes) {
                    newElement.setAttribute(attr.name, attr.value);
                }
                targetElement.appendChild(newElement);
                await typeNodeContents(newElement, node, defaultSpeed);
            }
        }
    }

    async function typeMessage(targetElement, htmlString, speed) {
        const sourceElement = document.createElement('div');
        sourceElement.innerHTML = htmlString;
        await typeNodeContents(targetElement, sourceElement, speed);
    }

    // === MATRIX EFFECT ===
    let matrixAnimationId = null;
    let matrixCanvas = null;
    let matrixCleanup = null;

    function startMatrixEffect() {
        if (isMatrixRunning) return false;
        isMatrixRunning = true;

        matrixCanvas = document.createElement('canvas');
        matrixCanvas.classList.add('matrix-canvas-local');
        document.body.appendChild(matrixCanvas);

        const ctx = matrixCanvas.getContext('2d');
        const characters = '\u30a2\u30a1\u30ab\u30b5\u30bf\u30ca\u30cf\u30de\u30e4\u30e3\u30e9\u30ef\u30ac\u30b6\u30c0\u30d0\u30d1\u30a4\u30a3\u30ad\u30b7\u30c1\u30cb\u30d2\u30df\u30ea\u30f0\u30ae\u30b8\u30c2\u30d3\u30d4\u30a6\u30a5\u30af\u30b9\u30c4\u30cc\u30d5\u30e0\u30e6\u30e5\u30eb\u30b0\u30ba\u30d6\u30d7\u30a8\u30a7\u30b1\u30bb\u30c6\u30cd\u30d8\u30e1\u30ec\u30f1\u30b2\u30bc\u30c7\u30d9\u30da\u30aa\u30a9\u30b3\u30bd\u30c8\u30ce\u30db\u30e2\u30e8\u30e7\u30ed\u30f2\u30b4\u30be\u30c9\u30dc\u30dd\u30f4\u30c3\u30f3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const fontSize = 16;
        let columns = 0;
        let drops = [];

        const handleResize = () => {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
            columns = Math.floor(matrixCanvas.width / fontSize);
            drops = Array(columns).fill(1);
        };

        let lastDraw = 0;
        const frameInterval = 40;

        const draw = (timestamp = 0) => {
            if (timestamp - lastDraw < frameInterval) {
                matrixAnimationId = requestAnimationFrame(draw);
                return;
            }
            lastDraw = timestamp;

            ctx.fillStyle = 'rgba(26, 27, 38, 0.06)';
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            matrixAnimationId = requestAnimationFrame(draw);
        };

        handleResize();
        matrixAnimationId = requestAnimationFrame(draw);
        window.addEventListener('resize', handleResize);

        matrixCleanup = () => {
            cancelAnimationFrame(matrixAnimationId);
            window.removeEventListener('resize', handleResize);
            if (matrixCanvas && matrixCanvas.parentNode) matrixCanvas.remove();
            matrixCanvas = null;
            matrixAnimationId = null;
            isMatrixRunning = false;
        };

        return true;
    }

    function stopMatrixEffect() {
        if (!isMatrixRunning) return;
        if (typeof matrixCleanup === 'function') {
            matrixCleanup();
            matrixCleanup = null;
        } else {
            isMatrixRunning = false;
        }
    }

    // === COMMAND EXECUTION LOGIC ===
    async function executeCommand(command) {
        commandInput.disabled = true;
        setCursorLock(true);
        TabCompletion.reset();

        const commandLine = document.createElement('div');
        const sanitizedCommand = escapeHtml(command);
        let normalizedCommand = command.toLowerCase().trim();
        commandLine.innerHTML = `<span class="prompt">$&gt;</span><span class="output-command">${sanitizedCommand}</span>`;
        output.appendChild(commandLine);

        if (command) commandHistory.push(command);
        historyIndex = commandHistory.length;
        commandInput.value = '';

        // Track first command achievement
        if (command && typeof AchievementManager !== 'undefined') {
            AchievementManager.check('first_command');
        }

        // Resolve alias if exists
        if (aliases[normalizedCommand]) {
            normalizedCommand = aliases[normalizedCommand];
        }

        // Handle matrix command
        if (normalizedCommand === 'matrix') {
            const matrixStarted = startMatrixEffect();
            const infoLine = document.createElement('div');
            infoLine.classList.add('line', 'output-text');
            infoLine.innerHTML = matrixStarted
                ? "<span class=\"highlight\">Efeito Matrix ativado.</span> Digite '<span class=\"output-command\">clear</span>' para desativar."
                : "<span class=\"comment\">Efeito Matrix já está ativo. Use '<span class=\"output-command\">clear</span>' para desativar.</span>";
            output.appendChild(infoLine);

            // Track matrix achievement
            if (matrixStarted && typeof AchievementManager !== 'undefined') {
                AchievementManager.check('matrix_fan');
            }

            commandInput.disabled = false;
            commandInput.focus();
            setCursorLock(false);
            scheduleCursorUpdate();
            terminalBody.scrollTop = terminalBody.scrollHeight;
            return;
        }

        const responseLine = document.createElement('div');
        responseLine.classList.add('line', 'output-text');

        let responseText;
        let speed = 10;

        // Handle clear command
        if (normalizedCommand === 'clear') {
            const matrixWasRunning = isMatrixRunning;
            if (matrixWasRunning) {
                stopMatrixEffect();
            }

            output.innerHTML = '';
            responseText = "Digite '<span class=\"output-command\">help</span>' para ver a lista de comandos disponíveis.";
            if (matrixWasRunning) {
                responseText += "<br><span class=\"comment\">Efeito Matrix desativado.</span>";
            }
        }
        // Handle themes command
        else if (normalizedCommand === 'themes') {
            responseText = ThemeManager.list();
        }
        // Handle theme command with argument
        else if (normalizedCommand.startsWith('theme ')) {
            const themeName = normalizedCommand.substring(6).trim();
            responseText = ThemeManager.apply(themeName);
        }
        // Handle theme command without argument
        else if (normalizedCommand === 'theme') {
            responseText = `Current theme: <span class="highlight">${ThemeManager.current}</span>\n\nUse '<span class="output-command">themes</span>' to see available themes.`;
        }
        // Handle regular commands
        else if (commands[normalizedCommand]) {
            const commandValue = commands[normalizedCommand];
            // Check if command is a function (for async commands like 'hack')
            if (typeof commandValue === 'function') {
                responseText = await commandValue();
            } else {
                responseText = commandValue;
            }
            if (normalizedCommand === 'help' || normalizedCommand === 'bemvindo') {
                speed = 5;
            }
        }
        // Command not found - try fuzzy search
        else {
            const suggestion = FuzzySearch.getSuggestionMessage(normalizedCommand);
            responseText = `Comando não encontrado: <span class="highlight">${sanitizedCommand}</span>.`;
            if (suggestion) {
                responseText += `\n\n${suggestion}`;
            }
            responseText += `\n\nDigite '<span class="output-command">help</span>' para ver a lista de comandos.`;
        }

        if (responseText) {
            output.appendChild(responseLine);
            await typeMessage(responseLine, responseText, speed);
        }

        commandInput.disabled = false;
        commandInput.focus();
        setCursorLock(false);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // === EVENT LISTENERS ===
    commandInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !commandInput.disabled) {
            await executeCommand(commandInput.value);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (commandInput.value.trim()) {
                const completed = TabCompletion.complete(commandInput.value);
                commandInput.value = completed;
                commandInput.setSelectionRange(completed.length, completed.length);
                scheduleCursorUpdate();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
                commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
                scheduleCursorUpdate();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
                scheduleCursorUpdate();
            } else {
                historyIndex = commandHistory.length;
                commandInput.value = '';
                scheduleCursorUpdate();
            }
        } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
            // Reset tab completion on any other key press
            TabCompletion.reset();
        }
    });

    // === BOOT SEQUENCE ===
    const BootSequence = {
        overlay: document.getElementById('boot-overlay'),
        content: document.getElementById('boot-content'),

        async run() {
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

    // === TASKBAR ===
    const Taskbar = {
        clockInterval: null,

        init() {
            this.updateClock();
            this.clockInterval = setInterval(() => this.updateClock(), 1000);

            // CRT toggle button
            const crtBtn = document.getElementById('taskbar-crt');
            if (crtBtn) {
                const crtEnabled = localStorage.getItem('crt-enabled') === 'true';
                if (crtEnabled) {
                    document.body.classList.add('crt-enabled');
                    crtBtn.classList.add('active');
                }

                crtBtn.addEventListener('click', () => {
                    document.body.classList.toggle('crt-enabled');
                    crtBtn.classList.toggle('active');
                    localStorage.setItem('crt-enabled', document.body.classList.contains('crt-enabled'));
                });
            }

            // Start button opens terminal focus
            const startBtn = document.getElementById('taskbar-start');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    commandInput.focus();
                    terminal.style.zIndex = ++WindowManager.highestZIndex;
                });
            }
        },

        updateClock() {
            const clock = document.getElementById('taskbar-clock');
            if (clock) {
                const now = new Date();
                clock.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }
        },

        addWindow(appId, title) {
            const container = document.getElementById('taskbar-windows');
            if (!container) return;

            const btn = document.createElement('button');
            btn.className = 'taskbar-window-btn active';
            btn.dataset.app = appId;
            btn.textContent = title;
            btn.addEventListener('click', () => this.handleWindowClick(appId));
            container.appendChild(btn);
        },

        removeWindow(appId) {
            const btn = document.querySelector(`.taskbar-window-btn[data-app="${appId}"]`);
            if (btn) btn.remove();
        },

        updateWindow(appId, isMinimized) {
            const btn = document.querySelector(`.taskbar-window-btn[data-app="${appId}"]`);
            if (btn) {
                btn.classList.toggle('minimized', isMinimized);
                btn.classList.toggle('active', !isMinimized);
            }
        },

        handleWindowClick(appId) {
            const win = WindowManager.windows[appId];
            if (!win) return;

            if (win.classList.contains('minimized')) {
                WindowManager.restoreWindow(appId);
            } else {
                WindowManager.focusWindow(appId);
            }
        }
    };

    // === PARTICLE BACKGROUND ===
    const ParticleBackground = {
        canvas: null,
        ctx: null,
        particles: [],
        animationId: null,

        init() {
            this.canvas = document.getElementById('particle-canvas');
            if (!this.canvas) return;

            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this.createParticles(40);
            this.animate();

            window.addEventListener('resize', () => this.resize());
        },

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        },

        createParticles(count) {
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        },

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const color = getComputedStyle(document.documentElement).getPropertyValue('--comment').trim() || '#565f89';

            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;

                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = color;
                this.ctx.globalAlpha = p.opacity;
                this.ctx.fill();
            });

            this.ctx.globalAlpha = 1;
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    };

    // === CONTEXT MENU ===
    const ContextMenu = {
        element: null,

        init() {
            this.element = document.getElementById('context-menu');
            if (!this.element) return;

            document.addEventListener('contextmenu', (e) => this.show(e));
            document.addEventListener('click', () => this.hide());
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.hide();
            });
        },

        show(e) {
            // Only show on desktop area
            const isDesktop = e.target.id === 'desktop' ||
                             e.target.closest('#desktop') ||
                             e.target.id === 'particle-canvas';

            if (!isDesktop) return;

            e.preventDefault();

            const options = [
                { label: '🎨 Abrir Themes', action: () => ThemePickerApp.open() },
                { label: '🎮 Abrir Games', action: () => GamesApp.open() },
                { label: '🎵 Abrir Music', action: () => MusicApp.open() },
                { label: '🎬 Abrir ASCII Player', action: () => ASCIIPlayerApp.open() },
                { separator: true },
                { label: '📺 Alternar CRT', action: () => {
                    document.body.classList.toggle('crt-enabled');
                    const crtBtn = document.getElementById('taskbar-crt');
                    if (crtBtn) crtBtn.classList.toggle('active');
                    localStorage.setItem('crt-enabled', document.body.classList.contains('crt-enabled'));
                }},
                { separator: true },
                { label: 'ℹ️ Sobre', action: () => executeCommand('sobre') }
            ];

            this.element.innerHTML = options.map(opt =>
                opt.separator
                    ? '<div class="context-separator"></div>'
                    : `<div class="context-item">${opt.label}</div>`
            ).join('');

            let left = e.clientX;
            let top = e.clientY;

            // Prevent overflow
            this.element.classList.add('visible');
            const rect = this.element.getBoundingClientRect();
            if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
            if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 10;

            this.element.style.left = `${left}px`;
            this.element.style.top = `${top}px`;

            this.element.querySelectorAll('.context-item').forEach((item, i) => {
                const opt = options.filter(o => !o.separator)[i];
                if (opt) {
                    item.addEventListener('click', () => {
                        opt.action();
                        this.hide();
                    });
                }
            });
        },

        hide() {
            if (this.element) this.element.classList.remove('visible');
        }
    };

    // === KEYBOARD SHORTCUTS ===
    const KeyboardShortcuts = {
        shortcuts: {
            'Alt+1': () => ThemePickerApp.open(),
            'Alt+2': () => ASCIIPlayerApp.open(),
            'Alt+3': () => MusicApp.open(),
            'Alt+4': () => GamesApp.open()
        },

        init() {
            document.addEventListener('keydown', (e) => {
                if (e.target === commandInput) return; // Don't interfere with terminal

                const key = `${e.altKey ? 'Alt+' : ''}${e.key}`;

                if (this.shortcuts[key]) {
                    e.preventDefault();
                    this.shortcuts[key]();
                }

                // Escape closes topmost window
                if (e.key === 'Escape') {
                    const windows = Object.entries(WindowManager.windows);
                    if (windows.length > 0) {
                        const [appId] = windows.sort((a, b) =>
                            parseInt(b[1].style.zIndex) - parseInt(a[1].style.zIndex)
                        )[0];
                        WindowManager.closeWindow(appId);
                    }
                }
            });
        }
    };

    // === ACHIEVEMENT MANAGER ===
    const AchievementManager = {
        achievements: {
            'first_command': { name: 'Primeiro Passo', desc: 'Execute seu primeiro comando', icon: '🎯' },
            'theme_master': { name: 'Estilista', desc: 'Experimente 3 temas diferentes', icon: '🎨' },
            'matrix_fan': { name: 'Neo', desc: 'Ative o efeito Matrix', icon: '💊' },
            'coffee_lover': { name: 'Cafeínado', desc: 'Pegue um café virtual', icon: '☕' },
            'gamer': { name: 'Gamer', desc: 'Jogue um mini-game', icon: '🎮' },
            'music_lover': { name: 'Melômano', desc: 'Ouça música lofi', icon: '🎵' },
            'hacker': { name: 'Hacker', desc: 'Execute o comando hack', icon: '💻' },
            'curious': { name: 'Curioso', desc: 'Encontre um easter egg', icon: '🥚' },
            'explorer': { name: 'Explorador', desc: 'Use todos os apps', icon: '🧭' }
        },

        unlocked: new Set(JSON.parse(localStorage.getItem('achievements') || '[]')),
        themesUsed: new Set(JSON.parse(localStorage.getItem('themes-used') || '[]')),
        appsUsed: new Set(JSON.parse(localStorage.getItem('apps-used') || '[]')),

        check(id) {
            if (this.unlocked.has(id)) return false;

            this.unlocked.add(id);
            localStorage.setItem('achievements', JSON.stringify([...this.unlocked]));
            this.showToast(id);
            return true;
        },

        trackTheme(themeName) {
            this.themesUsed.add(themeName);
            localStorage.setItem('themes-used', JSON.stringify([...this.themesUsed]));
            if (this.themesUsed.size >= 3) {
                this.check('theme_master');
            }
        },

        trackApp(appName) {
            this.appsUsed.add(appName);
            localStorage.setItem('apps-used', JSON.stringify([...this.appsUsed]));
            if (this.appsUsed.size >= 4) {
                this.check('explorer');
            }
        },

        showToast(id) {
            const ach = this.achievements[id];
            if (!ach) return;

            const toast = document.createElement('div');
            toast.className = 'achievement-toast';
            toast.innerHTML = `
                <span class="achievement-icon">${ach.icon}</span>
                <div>
                    <div class="achievement-title">Conquista Desbloqueada!</div>
                    <div class="achievement-name">${ach.name}</div>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        },

        listAchievements() {
            let output = '<span class="highlight">Conquistas:</span>\n\n';
            for (const [id, ach] of Object.entries(this.achievements)) {
                const status = this.unlocked.has(id)
                    ? '<span class="detail-green">✓</span>'
                    : '<span class="comment">○</span>';
                output += `${status} ${ach.icon} <span class="output-command">${ach.name}</span>\n   ${ach.desc}\n\n`;
            }
            output += `<span class="comment">Desbloqueadas: ${this.unlocked.size}/${Object.keys(this.achievements).length}</span>`;
            return output;
        }
    };

    // === INITIALIZATION ===
    async function init() {
        commandInput.disabled = true;
        setCursorLock(true);

        const initialLine = document.createElement('div');
        initialLine.classList.add('line', 'output-text');
        output.appendChild(initialLine);
        await typeMessage(initialLine, welcomeMessage, 10);

        commandInput.disabled = false;
        commandInput.focus();
        setCursorLock(false);
    }

    // === STARTUP ===
    async function startup() {
        // Run boot sequence first
        await BootSequence.run();

        // Initialize all systems
        Taskbar.init();
        ParticleBackground.init();
        ContextMenu.init();
        KeyboardShortcuts.init();

        // Start main terminal
        await init();
    }

    startup();
});
