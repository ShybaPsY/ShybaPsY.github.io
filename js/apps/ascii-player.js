// ================================================
// ASCII PLAYER APP MODULE
// ================================================

export const ASCIIPlayerApp = {
    WindowManager: null,
    AchievementManager: null,
    animationInterval: null,
    frameIndex: 0,
    currentAnimation: null,
    resizeObserver: null,
    resizeTimeout: null,
    cols: 40,
    rows: 15,

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;

        // Register cleanup handler
        if (WindowManager) {
            WindowManager.registerCleanup('player', () => this.stop());
        }
    },

    getGridSize() {
        const display = document.getElementById('ascii-display');
        if (!display) return { cols: 40, rows: 15 };

        const charWidth = 8.4;
        const charHeight = 15.4;

        const availableWidth = display.clientWidth - 24;
        const availableHeight = display.clientHeight - 24;

        const cols = Math.max(20, Math.floor(availableWidth / charWidth));
        const rows = Math.max(8, Math.floor(availableHeight / charHeight));

        return { cols, rows };
    },

    generate3DWaveFrames(cols, rows) {
        const frames = [];
        const totalFrames = 30;
        const chars = ' .:-=+*#%@';

        for (let frame = 0; frame < totalFrames; frame++) {
            const t = (frame / totalFrames) * Math.PI * 2;
            let frameStr = '';

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const dx = (x - cols/2) / (cols/4);
                    const dy = (y - rows/2) / (rows/4);
                    const dist = dx*dx + dy*dy; // Skip sqrt for performance
                    const wave = Math.sin(dist * 0.5 - t * 2);
                    frameStr += chars[Math.floor((wave + 1) * 4.5)];
                }
                frameStr += '\n';
            }
            frames.push(frameStr);
        }
        return frames;
    },

    generateWaveFrames(cols, rows) {
        const frames = [];
        const totalFrames = 24;

        for (let frame = 0; frame < totalFrames; frame++) {
            const t = (frame / totalFrames) * Math.PI * 2;
            let frameStr = '';

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const wave = Math.sin(x * 0.2 + t) * (rows/2 - 1) + rows/2;
                    frameStr += y > wave ? '~' : ' ';
                }
                frameStr += '\n';
            }
            frames.push(frameStr);
        }
        return frames;
    },

    generateFireFrames(cols, rows) {
        const frames = [];
        const chars = ' .,:;*%#@';
        const totalFrames = 20;

        // Create fire buffer
        let buffer = [];
        for (let y = 0; y < rows + 2; y++) {
            buffer[y] = new Array(cols).fill(0);
        }

        // Warm up (reduced)
        for (let warmup = 0; warmup < 8; warmup++) {
            for (let x = 0; x < cols; x++) {
                buffer[rows + 1][x] = Math.random() > 0.4 ? 8 : (Math.random() * 4) | 0;
            }
            for (let y = 0; y < rows + 1; y++) {
                for (let x = 0; x < cols; x++) {
                    const avg = (buffer[y + 1][(x - 1 + cols) % cols] + buffer[y + 1][x] + buffer[y + 1][(x + 1) % cols] + buffer[y + 1][x]) / 4;
                    buffer[y][x] = Math.max(0, (avg - Math.random() * 1.5) | 0);
                }
            }
        }

        // Generate frames
        for (let f = 0; f < totalFrames; f++) {
            for (let x = 0; x < cols; x++) {
                buffer[rows + 1][x] = Math.random() > 0.4 ? 8 : (Math.random() * 4) | 0;
            }
            for (let y = 0; y < rows + 1; y++) {
                for (let x = 0; x < cols; x++) {
                    const avg = (buffer[y + 1][(x - 1 + cols) % cols] + buffer[y + 1][x] + buffer[y + 1][(x + 1) % cols] + buffer[y + 1][x]) / 4;
                    buffer[y][x] = Math.max(0, (avg - Math.random() * 1.5) | 0);
                }
            }

            let frame = '';
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    frame += chars[Math.min(buffer[y][x], 8)];
                }
                frame += '\n';
            }
            frames.push(frame);
        }
        return frames;
    },

    generateDonutFrames(cols, rows) {
        const frames = [];
        const chars = '.,-~:;=!*#$@';

        // Reduced frames for better performance
        const totalFrames = 40;
        const rotationSpeed = (2 * Math.PI) / totalFrames;

        for (let frame = 0; frame < totalFrames; frame++) {
            const A = frame * rotationSpeed;
            const B = frame * rotationSpeed * 0.5;

            // Create buffers
            const b = new Array(cols * rows).fill(' ');
            const z = new Array(cols * rows).fill(0);

            // Render donut - increased step values for performance
            for (let j = 0; j < 6.28; j += 0.12) {
                for (let i = 0; i < 6.28; i += 0.04) {
                    const c = Math.sin(i);
                    const d = Math.cos(j);
                    const e = Math.sin(A);
                    const f = Math.sin(j);
                    const g = Math.cos(A);
                    const h = d + 2;
                    const D = 1 / (c * h * e + f * g + 5);
                    const l = Math.cos(i);
                    const m = Math.cos(B);
                    const n = Math.sin(B);
                    const t = c * h * g - f * e;

                    // Scale to fit dynamic size
                    const scaleX = cols / 80;
                    const scaleY = rows / 22;
                    const x = Math.floor(cols / 2 + 30 * scaleX * D * (l * h * m - t * n));
                    const y = Math.floor(rows / 2 + 15 * scaleY * D * (l * h * n + t * m));
                    const o = x + cols * y;
                    const N = Math.floor(8 * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n));

                    if (y > 0 && y < rows && x > 0 && x < cols && D > z[o]) {
                        z[o] = D;
                        b[o] = chars[Math.max(0, Math.min(N, chars.length - 1))];
                    }
                }
            }

            // Build frame string
            let frameStr = '';
            for (let k = 0; k < cols * rows; k++) {
                if (k > 0 && k % cols === 0) frameStr += '\n';
                frameStr += b[k];
            }
            frames.push(frameStr);
        }

        return frames;
    },

    generateBallFrames(cols, rows) {
        const frames = [];
        const totalFrames = 40;
        const ballRadius = 2;

        for (let frame = 0; frame < totalFrames; frame++) {
            // Use sine waves for seamless looping motion
            const t = (frame / totalFrames) * Math.PI * 2;

            // Ball position using sine waves (seamless loop)
            const ballX = cols / 2 + Math.sin(t) * (cols / 2 - ballRadius - 2);
            const ballY = rows / 2 + Math.sin(t * 2) * (rows / 2 - ballRadius - 2);

            // Render frame
            let frameStr = '';
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const dx = col - ballX;
                    const dy = (row - ballY) * 2; // Compensate for character aspect ratio
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < ballRadius) {
                        frameStr += '@';
                    } else if (dist < ballRadius + 1) {
                        frameStr += 'o';
                    } else if (row === rows - 1) {
                        frameStr += '=';
                    } else {
                        frameStr += ' ';
                    }
                }
                frameStr += '\n';
            }
            frames.push(frameStr);
        }
        return frames;
    },

    generateFrames(animName) {
        const { cols, rows } = this.getGridSize();
        this.cols = cols;
        this.rows = rows;

        switch(animName) {
            case '3dwave': return this.generate3DWaveFrames(cols, rows);
            case 'donut': return this.generateDonutFrames(cols, rows);
            case 'wave': return this.generateWaveFrames(cols, rows);
            case 'fire': return this.generateFireFrames(cols, rows);
            case 'ball': return this.generateBallFrames(cols, rows);
            default: return [];
        }
    },

    open() {
        if (!this.WindowManager) return;

        const content = `
            <div class="ascii-player">
                <div class="ascii-display" id="ascii-display">Select an animation</div>
                <div class="ascii-controls">
                    <button class="ascii-btn" data-anim="donut">3D Donut</button>
                    <button class="ascii-btn" data-anim="3dwave">3D Wave</button>
                    <button class="ascii-btn" data-anim="wave">Wave</button>
                    <button class="ascii-btn" data-anim="fire">Fire</button>
                    <button class="ascii-btn" data-anim="ball">Ball</button>
                    <button class="ascii-btn" data-anim="stop">Stop</button>
                </div>
            </div>
        `;

        const windowEl = this.WindowManager.createWindow('player', 'ASCII Video Player', 400, 350, content);

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

        // Setup resize observer with debounce
        const display = document.getElementById('ascii-display');
        if (display && window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                if (this.currentAnimation && this.animationInterval) {
                    clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(() => {
                        this.play(this.currentAnimation);
                    }, 200);
                }
            });
            this.resizeObserver.observe(display);
        }

        // Track app usage
        if (this.AchievementManager) {
            this.AchievementManager.trackApp('player');
        }
    },

    play(animName) {
        this.stop(true);
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
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
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
