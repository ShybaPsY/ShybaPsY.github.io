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
                    <span class="app-window-title">${title}</span>
                    <div class="app-window-close"></div>
                </div>
                <div class="app-window-body">${content}</div>
            `;

            document.getElementById('app-windows').appendChild(windowEl);
            this.setupWindowDrag(windowEl);
            if (resizable) this.setupWindowResize(windowEl);

            windowEl.querySelector('.app-window-close').addEventListener('click', () => {
                this.closeWindow(appId);
            });

            windowEl.addEventListener('mousedown', () => {
                this.focusWindow(appId);
            });

            this.windows[appId] = windowEl;
            this.focusWindow(appId);
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

            windowEl.remove();
            delete this.windows[appId];
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
            WindowManager.createWindow('games', 'Mini Games', 350, 400, content);
            this.showMenu();
        },

        showMenu() {
            this.cleanup();
            const container = document.getElementById('games-content');
            if (!container) return;

            container.className = 'games-menu';
            container.innerHTML = `
                <div class="game-option" data-game="snake">
                    <div class="game-option-title">🐍 Snake</div>
                    <div class="game-option-desc">Arrow keys to move • Fill the grid to win!</div>
                </div>
                <div class="game-option" data-game="pong">
                    <div class="game-option-title">🏓 Pong vs AI</div>
                    <div class="game-option-desc">W/S or Arrow keys • First to 5 wins!</div>
                </div>
            `;

            container.querySelectorAll('.game-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    if (opt.dataset.game === 'snake') this.startSnake();
                    else if (opt.dataset.game === 'pong') this.startPong();
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
                ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

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

            const paddleHeight = 60;
            const paddleWidth = 10;
            const ballRadius = 6;
            const winScore = 5;

            let playerY = canvas.height / 2 - paddleHeight / 2;
            let aiY = canvas.height / 2 - paddleHeight / 2;
            let ballX, ballY, ballDX, ballDY;
            let playerScore = 0;
            let aiScore = 0;
            let gameOver = false;
            let ballSpeed = 4;
            let aiSpeed = 3;

            const resetBall = (towardsPlayer = Math.random() > 0.5) => {
                ballX = canvas.width / 2;
                ballY = canvas.height / 2;
                const angle = (Math.random() - 0.5) * Math.PI / 2;
                ballDX = Math.cos(angle) * ballSpeed * (towardsPlayer ? -1 : 1);
                ballDY = Math.sin(angle) * ballSpeed;
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

            const handleKey = (e) => {
                if (gameOver) return;
                const step = canvas.height / 8;
                if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                    playerY = Math.max(0, playerY - step);
                }
                if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                    playerY = Math.min(canvas.height - paddleHeight, playerY + step);
                }
            };

            document.addEventListener('keydown', handleKey);
            this.keyHandler = handleKey;

            const gameLoop = () => {
                if (gameOver) return;

                // Move ball
                ballX += ballDX;
                ballY += ballDY;

                // Ball collision with top/bottom walls
                if (ballY - ballRadius <= 0 || ballY + ballRadius >= canvas.height) {
                    ballDY = -ballDY;
                    ballY = ballY - ballRadius <= 0 ? ballRadius : canvas.height - ballRadius;
                }

                // AI movement (follows ball with some delay)
                const aiCenter = aiY + paddleHeight / 2;
                const aiTarget = ballY;
                if (aiCenter < aiTarget - 10) {
                    aiY = Math.min(canvas.height - paddleHeight, aiY + aiSpeed);
                } else if (aiCenter > aiTarget + 10) {
                    aiY = Math.max(0, aiY - aiSpeed);
                }

                // Player paddle collision
                if (ballX - ballRadius <= paddleWidth + 5 &&
                    ballY >= playerY && ballY <= playerY + paddleHeight &&
                    ballDX < 0) {
                    const hitPos = (ballY - playerY) / paddleHeight;
                    const angle = (hitPos - 0.5) * Math.PI / 3;
                    ballSpeed = Math.min(8, ballSpeed + 0.2);
                    ballDX = Math.cos(angle) * ballSpeed;
                    ballDY = Math.sin(angle) * ballSpeed;
                    ballX = paddleWidth + 5 + ballRadius;
                }

                // AI paddle collision
                if (ballX + ballRadius >= canvas.width - paddleWidth - 5 &&
                    ballY >= aiY && ballY <= aiY + paddleHeight &&
                    ballDX > 0) {
                    const hitPos = (ballY - aiY) / paddleHeight;
                    const angle = (hitPos - 0.5) * Math.PI / 3;
                    ballSpeed = Math.min(8, ballSpeed + 0.2);
                    ballDX = -Math.cos(angle) * ballSpeed;
                    ballDY = Math.sin(angle) * ballSpeed;
                    ballX = canvas.width - paddleWidth - 5 - ballRadius;
                }

                // Scoring
                if (ballX - ballRadius <= 0) {
                    aiScore++;
                    document.getElementById('ai-score').textContent = aiScore;
                    if (aiScore >= winScore) {
                        showEndScreen(false);
                        return;
                    }
                    ballSpeed = 4;
                    resetBall(true);
                }

                if (ballX + ballRadius >= canvas.width) {
                    playerScore++;
                    document.getElementById('player-score').textContent = playerScore;
                    if (playerScore >= winScore) {
                        showEndScreen(true);
                        return;
                    }
                    ballSpeed = 4;
                    aiSpeed = Math.min(5, aiSpeed + 0.3);
                    resetBall(false);
                }

                // Draw background
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw center line
                ctx.setLineDash([10, 10]);
                ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--comment');
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2, 0);
                ctx.lineTo(canvas.width / 2, canvas.height);
                ctx.stroke();
                ctx.setLineDash([]);

                // Draw player paddle (left)
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--cyan');
                ctx.fillRect(5, playerY, paddleWidth, paddleHeight);

                // Draw AI paddle (right)
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--red');
                ctx.fillRect(canvas.width - paddleWidth - 5, aiY, paddleWidth, paddleHeight);

                // Draw ball with glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--yellow');
                ctx.beginPath();
                ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            };

            this.gameLoop = setInterval(gameLoop, 30);

            document.getElementById('game-back').addEventListener('click', () => {
                this.showMenu();
            });
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

        coffee: `
  <span class="detail-cyan">
      ( (
       ) )
    ........
    |      |]
    \\      /
     \`----'
  </span>
  <span class="highlight">☕ Pegando um café...</span>

  <span class="comment">Programador sem café = erro de compilação!</span>`,

        hack: async function() {
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

        secret: `
  <span class="highlight">🎉 Você encontrou um comando secreto!</span>

  <span class="comment">Para ver todos os easter eggs e comandos de exploração, digite:</span>

  <span class="output-command">extras</span>

  <span class="comment">Continue explorando para achar mais surpresas! 🔍</span>`,

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

    init();
});
