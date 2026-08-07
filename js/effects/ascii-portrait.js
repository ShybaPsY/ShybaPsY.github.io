// ================================================
// ASCII PORTRAIT MODULE
// Intro pós-boot: milhares de caracteres voam pela tela
// e se montam formando o retrato (profile.jpg) em ASCII
// art, com shimmer e repulsão ao mouse, e então se
// dispersam. Qualquer tecla ou clique pula a animação.
// ================================================

export const AsciiPortrait = {
    IMAGE_SRC: 'assets/img/profile.jpg',
    CHARS: ' .:-=+*#%@',
    NAME_LINE: 'GABRIEL MENDES LOPES',
    SUB_LINE: '< fullstack developer />',

    canvas: null,
    ctx: null,
    particles: [],
    mouse: { x: -99999, y: -99999 },
    phase: 'idle', // assemble -> hold -> disperse
    phaseStart: 0,
    skipRequested: false,
    isPlaying: false,

    DURATIONS: { assemble: 1600, hold: 2600, disperse: 1500 },

    async play() {
        if (this.isPlaying) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        let img;
        try {
            img = await this.loadImage(this.IMAGE_SRC);
        } catch (err) {
            console.warn('AsciiPortrait: imagem não carregou, pulando intro', err);
            return;
        }

        this.isPlaying = true;
        this.skipRequested = false;
        this.createCanvas();
        this.buildParticles(img);

        const onSkip = () => { this.skipRequested = true; };
        document.addEventListener('keydown', onSkip);
        document.addEventListener('mousedown', onSkip);
        const onMove = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
        document.addEventListener('mousemove', onMove);

        await this.runAnimation();

        document.removeEventListener('keydown', onSkip);
        document.removeEventListener('mousedown', onSkip);
        document.removeEventListener('mousemove', onMove);
        this.canvas.remove();
        this.canvas = null;
        this.particles = [];
        this.isPlaying = false;
    },

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'ascii-portrait-canvas';
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.cssText =
            'position:fixed;inset:0;z-index:9000;pointer-events:none;background:transparent;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    },

    buildParticles(img) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        // tamanho da célula proporcional à tela (retrato ocupa ~62% da altura)
        const cellH = Math.max(7, Math.round(H / 110));
        const cellW = Math.round(cellH * 0.62);
        const fontSize = cellH;

        const portraitH = Math.floor(H * 0.62 / cellH);
        const portraitW = Math.floor(portraitH * (img.width / img.height) * (cellH / cellW));

        // amostra o brilho da imagem numa grade pequena
        const off = document.createElement('canvas');
        off.width = portraitW;
        off.height = portraitH;
        const offCtx = off.getContext('2d', { willReadFrequently: true });
        offCtx.drawImage(img, 0, 0, portraitW, portraitH);
        const data = offCtx.getImageData(0, 0, portraitW, portraitH).data;

        const style = getComputedStyle(document.documentElement);
        const colors = {
            dim: style.getPropertyValue('--comment').trim() || '#565f89',
            mid: style.getPropertyValue('--foreground').trim() || '#c0caf5',
            hi: style.getPropertyValue('--green').trim() || '#9ece6a'
        };

        const originX = (W - portraitW * cellW) / 2;
        const originY = (H * 0.84 - portraitH * cellH) / 2; // levemente acima do centro

        this.particles = [];
        for (let y = 0; y < portraitH; y++) {
            for (let x = 0; x < portraitW; x++) {
                const i = (y * portraitW + x) * 4;
                const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
                if (brightness < 0.16) continue;

                const charIdx = Math.min(this.CHARS.length - 1, Math.floor(brightness * this.CHARS.length));
                // nasce em um ponto aleatório na borda da tela
                const edge = Math.floor(Math.random() * 4);
                const sx = edge === 0 ? -40 : edge === 1 ? W + 40 : Math.random() * W;
                const sy = edge === 2 ? -40 : edge === 3 ? H + 40 : Math.random() * H;

                this.particles.push({
                    tx: originX + x * cellW + cellW / 2,
                    ty: originY + y * cellH + cellH / 2,
                    sx, sy,
                    charIdx,
                    brightness,
                    color: brightness > 0.72 ? colors.hi : brightness > 0.4 ? colors.mid : colors.dim,
                    delay: Math.random() * 500,
                    shimmerSeed: Math.random() * 1000
                });
            }
        }

        this.fontSize = fontSize;
        this.nameY = originY + portraitH * cellH + Math.max(34, H * 0.05);
        this.colors = colors;
        this.centerX = W / 2;
        this.centerY = originY + (portraitH * cellH) / 2;
    },

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    runAnimation() {
        return new Promise(resolve => {
            const ctx = this.ctx;
            this.phase = 'assemble';
            this.phaseStart = performance.now();

            const frame = (now) => {
                if (!this.canvas) { resolve(); return; }

                // pular: corta direto para a dispersão
                if (this.skipRequested && this.phase !== 'disperse') {
                    this.phase = 'disperse';
                    this.phaseStart = now;
                    this.skipRequested = false;
                }

                let elapsed = now - this.phaseStart;
                if (this.phase === 'assemble' && elapsed > this.DURATIONS.assemble + 500) {
                    this.phase = 'hold';
                    this.phaseStart = now;
                    elapsed = 0; // sem isso, o 1º frame da nova fase desenha com o tempo da fase antiga (pisque)
                } else if (this.phase === 'hold' && elapsed > this.DURATIONS.hold) {
                    this.phase = 'disperse';
                    this.phaseStart = now;
                    elapsed = 0;
                } else if (this.phase === 'disperse' && elapsed > this.DURATIONS.disperse) {
                    // garante que o último frame visível é 100% transparente,
                    // assim a remoção do canvas não causa nenhum salto
                    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    resolve();
                    return;
                }

                this.drawFrame(now, elapsed);
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
        });
    },

    drawFrame(now, elapsed) {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        ctx.clearRect(0, 0, W, H);

        // véu escuro para destacar o retrato (some na dispersão)
        const VEIL_MAX = 0.86;
        let veil = VEIL_MAX;
        if (this.phase === 'assemble') veil = Math.min(VEIL_MAX, (elapsed / 600) * VEIL_MAX);
        if (this.phase === 'disperse') {
            const t = Math.min(1, elapsed / this.DURATIONS.disperse);
            veil = VEIL_MAX * (1 - this.easeInOutQuad(t));
        }
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, veil)})`;
        ctx.fillRect(0, 0, W, H);

        ctx.font = `${this.fontSize}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const mx = this.mouse.x, my = this.mouse.y;
        const chars = this.CHARS;

        for (const p of this.particles) {
            let x = p.tx, y = p.ty, alpha = 1, charIdx = p.charIdx;

            if (this.phase === 'assemble') {
                const t = Math.max(0, Math.min(1, (elapsed - p.delay) / this.DURATIONS.assemble));
                const e = this.easeOutCubic(t);
                x = p.sx + (p.tx - p.sx) * e;
                y = p.sy + (p.ty - p.sy) * e;
                alpha = 0.25 + 0.75 * e;
            } else if (this.phase === 'hold') {
                // shimmer: alguns caracteres oscilam um nível na rampa
                const sh = Math.sin(now / 280 + p.shimmerSeed);
                if (sh > 0.92) charIdx = Math.min(chars.length - 1, charIdx + 1);
                else if (sh < -0.92) charIdx = Math.max(1, charIdx - 1);

                // repulsão do mouse
                const dx = p.tx - mx, dy = p.ty - my;
                const d2 = dx * dx + dy * dy;
                if (d2 < 19600) { // raio 140px
                    const d = Math.sqrt(d2) || 1;
                    const force = (1 - d / 140) * 46;
                    x = p.tx + (dx / d) * force;
                    y = p.ty + (dy / d) * force;
                }
            } else { // disperse
                const t = Math.min(1, elapsed / this.DURATIONS.disperse);
                const e = t * t;
                const dx = p.tx - this.centerX, dy = p.ty - this.centerY;
                x = p.tx + dx * e * 2.5 + (p.sx - p.tx) * e * 0.3;
                y = p.ty + dy * e * 2.5 + (p.sy - p.ty) * e * 0.3;
                // fade suave que chega de fato a zero antes do canvas sumir
                alpha = Math.pow(1 - t, 1.6);
            }

            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * (0.45 + p.brightness * 0.55);
            ctx.fillText(chars[charIdx], x, y);
        }

        // nome digitado abaixo do retrato (a partir do meio da montagem);
        // na dispersão ele desvanece junto, em vez de sumir de um frame pro outro
        const totalElapsed = this.phase === 'assemble' ? elapsed
            : this.DURATIONS.assemble + 500 + (this.phase === 'hold' ? elapsed : this.DURATIONS.hold);
        const nameAlpha = this.phase === 'disperse'
            ? Math.pow(1 - Math.min(1, elapsed / this.DURATIONS.disperse), 1.6)
            : 1;

        if (nameAlpha > 0.01) {
            const nameProgress = Math.max(0, (totalElapsed - 1100) / 14);
            const nameShown = this.NAME_LINE.slice(0, Math.floor(nameProgress));
            const subShown = this.SUB_LINE.slice(0, Math.max(0, Math.floor(nameProgress - this.NAME_LINE.length - 6)));

            // O nome é o único texto de sistema desta cena: sai na face
            // do sistema operacional (IBM Plex Mono), entreletrado e com
            // um halo da cor de acento, como um título de janela ampliado.
            const nameSize = Math.max(20, this.canvas.height * 0.032);
            ctx.globalAlpha = nameAlpha;
            ctx.fillStyle = this.colors.hi;
            ctx.font = `600 ${nameSize}px 'IBM Plex Mono', 'Fira Code', monospace`;
            ctx.letterSpacing = `${(nameSize * 0.1).toFixed(1)}px`;
            ctx.shadowColor = this.colors.hi;
            ctx.shadowBlur = nameSize * 0.9;
            ctx.fillText(nameShown + (nameShown.length < this.NAME_LINE.length ? '█' : ''), this.canvas.width / 2, this.nameY);
            ctx.shadowBlur = 0;

            if (subShown) {
                const subSize = Math.max(12, this.canvas.height * 0.0155);
                ctx.fillStyle = this.colors.mid;
                ctx.font = `500 ${subSize}px 'IBM Plex Mono', 'Fira Code', monospace`;
                ctx.letterSpacing = `${(subSize * 0.22).toFixed(1)}px`;
                ctx.globalAlpha = nameAlpha * 0.8;
                ctx.fillText(subShown, this.canvas.width / 2, this.nameY + Math.max(30, this.canvas.height * 0.042));
            }
            ctx.letterSpacing = '0px';
        }

        ctx.globalAlpha = 1;
    }
};
