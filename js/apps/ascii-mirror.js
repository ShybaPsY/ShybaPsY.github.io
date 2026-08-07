// ================================================
// ASCII MIRROR APP MODULE
// Espelho que transforma a webcam do visitante em
// ASCII art ao vivo, com modo colorido ou no tema,
// e snapshot para download.
// ================================================

import { t } from '../i18n/i18n.js';

export const AsciiMirrorApp = {
    WindowManager: null,
    AchievementManager: null,
    stream: null,
    video: null,
    animationId: null,
    lastFrame: 0,
    frameInterval: 1000 / 24,
    colorMode: 'color', // 'color' (cores reais) | 'theme' (verde do tema)
    CHARS: ' .:-=+*#%@',
    COLS: 96,

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;

        if (WindowManager) {
            WindowManager.registerCleanup('mirror', () => this.stop());
        }
    },

    open() {
        if (!this.WindowManager) return;
        if (this.WindowManager.windows['mirror']) {
            this.WindowManager.focusWindow('mirror');
            return;
        }

        const content = `
            <div class="ascii-mirror">
                <div class="ascii-mirror-stage">
                    <canvas id="mirror-canvas"></canvas>
                    <div class="ascii-mirror-message" id="mirror-message">${t('mirror.intro')}</div>
                </div>
                <div class="ascii-controls">
                    <button class="ascii-btn" id="mirror-start">📷 ${t('mirror.start')}</button>
                    <button class="ascii-btn" id="mirror-color">🎨 ${t('mirror.mode_color')}</button>
                    <button class="ascii-btn" id="mirror-snapshot" disabled>📸 ${t('mirror.snapshot')}</button>
                </div>
            </div>
        `;

        const windowEl = this.WindowManager.createWindow('mirror', t('mirror.title'), 640, 540, content);

        windowEl.querySelector('#mirror-start').addEventListener('click', () => {
            if (this.stream) this.stop();
            else this.start(windowEl);
        });
        windowEl.querySelector('#mirror-color').addEventListener('click', (e) => {
            this.colorMode = this.colorMode === 'color' ? 'theme' : 'color';
            e.target.textContent = this.colorMode === 'color'
                ? `🎨 ${t('mirror.mode_color')}`
                : `🟢 ${t('mirror.mode_theme')}`;
        });
        windowEl.querySelector('#mirror-snapshot').addEventListener('click', () => this.snapshot());

        this.AchievementManager?.trackApp('mirror');
    },

    async start(windowEl) {
        const message = document.getElementById('mirror-message');
        const startBtn = document.getElementById('mirror-start');
        message.textContent = t('mirror.requesting');

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false
            });
        } catch (err) {
            message.textContent = t('mirror.denied');
            return;
        }

        this.video = document.createElement('video');
        this.video.srcObject = this.stream;
        this.video.playsInline = true;
        this.video.muted = true;
        await this.video.play();

        message.style.display = 'none';
        startBtn.textContent = `⏹ ${t('mirror.stop')}`;
        document.getElementById('mirror-snapshot').disabled = false;

        // offscreen pequeno: cada pixel vira um caractere
        this.off = document.createElement('canvas');
        this.offCtx = this.off.getContext('2d', { willReadFrequently: true });

        this.render(0);
    },

    render(now) {
        this.animationId = requestAnimationFrame((ts) => this.render(ts));
        if (now - this.lastFrame < this.frameInterval) return;
        this.lastFrame = now;

        const canvas = document.getElementById('mirror-canvas');
        if (!canvas || !this.video || this.video.readyState < 2) return;

        const stage = canvas.parentElement;
        if (canvas.width !== stage.clientWidth || canvas.height !== stage.clientHeight) {
            canvas.width = stage.clientWidth;
            canvas.height = stage.clientHeight;
        }

        const videoAspect = this.video.videoWidth / this.video.videoHeight;
        const cols = this.COLS;
        // célula de caractere é mais alta que larga (~0.6), compensa na grade
        const rows = Math.round(cols / videoAspect * 0.55);

        this.off.width = cols;
        this.off.height = rows;
        // espelha horizontalmente, como um espelho de verdade
        this.offCtx.save();
        this.offCtx.scale(-1, 1);
        this.offCtx.drawImage(this.video, -cols, 0, cols, rows);
        this.offCtx.restore();
        const data = this.offCtx.getImageData(0, 0, cols, rows).data;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cellW = canvas.width / cols;
        const cellH = canvas.height / rows;
        const fontSize = Math.ceil(cellH);
        ctx.font = `${fontSize}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#9ece6a';
        const chars = this.CHARS;

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = (y * cols + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                const charIdx = Math.min(chars.length - 1, Math.floor(brightness * chars.length));
                if (charIdx === 0) continue;

                ctx.fillStyle = this.colorMode === 'color' ? `rgb(${r},${g},${b})` : themeColor;
                if (this.colorMode === 'theme') ctx.globalAlpha = 0.25 + brightness * 0.75;
                ctx.fillText(chars[charIdx], x * cellW + cellW / 2, y * cellH + cellH / 2);
            }
        }
        ctx.globalAlpha = 1;
    },

    snapshot() {
        const canvas = document.getElementById('mirror-canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'ascii-selfie.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.AchievementManager?.unlock('ascii_selfie');
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.video = null;

        // restaura a UI se a janela ainda existir
        const message = document.getElementById('mirror-message');
        const startBtn = document.getElementById('mirror-start');
        const snapBtn = document.getElementById('mirror-snapshot');
        if (message) { message.style.display = ''; message.textContent = t('mirror.intro'); }
        if (startBtn) startBtn.textContent = `📷 ${t('mirror.start')}`;
        if (snapBtn) snapBtn.disabled = true;
        const canvas = document.getElementById('mirror-canvas');
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
};
