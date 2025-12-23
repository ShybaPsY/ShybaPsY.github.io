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
        if (!this.WindowManager) return;

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

        // Setup resize observer
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
