// ================================================
// WINDOW SHATTER
//
// Ao fechar, a janela não some: ela revela que sempre foi feita de
// texto. Uma grade de caracteres toma o lugar dela — moldura e barra de
// título nos glifos mais densos da rampa, corpo com textura — e então se
// espalha para fora.
//
// O detalhe que importa: cada caractere não desaparece por opacidade,
// ele DECAI pela rampa de luminância enquanto voa. Um '@' vira '%',
// depois '#', '*', '+', '=', '-', ':', '·' e só então nada. É o alfabeto
// do próprio sistema morrendo, e não um fade genérico.
//
// Não há como fotografar o conteúdo real da janela (html2canvas não
// renderiza backdrop-filter, e foreignObject contamina o canvas), então
// a grade não copia os pixels — ela reconstrói a ESTRUTURA da janela,
// que é o que o olho reconhece nesse meio segundo.
// ================================================

const RAMP = ' ·:-=+*#%@';
const TOP = RAMP.length - 1;

export const WindowShatter = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    colors: { dim: '#565f89', accent: '#9ece6a' },

    CELL_W: 11,
    CELL_H: 17,
    FONT: 14,
    DURATION: 620,
    MAX_PARTICLES: 1600,

    reducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    ensureCanvas() {
        if (this.canvas) return;
        const c = document.createElement('canvas');
        c.id = 'window-shatter-canvas';
        // acima das janelas, abaixo da taskbar
        c.style.cssText = 'position:fixed;inset:0;z-index:9000;pointer-events:none;';
        document.body.appendChild(c);
        this.canvas = c;
        this.ctx = c.getContext('2d');
    },

    readColors() {
        const s = getComputedStyle(document.documentElement);
        this.colors.dim = s.getPropertyValue('--comment').trim() || '#565f89';
        this.colors.accent = s.getPropertyValue('--green').trim() || '#9ece6a';
    },

    // Reconstrói a janela como grade de caracteres. A densidade descreve a
    // estrutura: borda e barra de título sólidas, corpo esparso.
    build(rect, headerH) {
        const cols = Math.max(1, Math.round(rect.width / this.CELL_W));
        const rows = Math.max(1, Math.round(rect.height / this.CELL_H));
        const cw = rect.width / cols;
        const ch = rect.height / rows;
        const headerRows = Math.max(1, Math.round(headerH / ch));

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const parts = [];

        // Se a janela for enorme, rareia a grade em vez de estourar o
        // número de partículas e derrubar a taxa de quadros.
        const stride = Math.max(1, Math.ceil(Math.sqrt((cols * rows) / this.MAX_PARTICLES)));

        for (let r = 0; r < rows; r += stride) {
            for (let c = 0; c < cols; c += stride) {
                const edge = r === 0 || c === 0 || r >= rows - stride || c >= cols - stride;
                const header = r < headerRows;

                let level;
                if (edge) level = TOP;                                 // moldura
                else if (header) level = TOP - 1 - ((c + r) % 2);       // barra de título
                else {
                    // corpo: textura irregular, com buracos. Denso o
                    // bastante para o retângulo da janela ainda se ler
                    // como uma superfície no primeiro quadro.
                    const n = Math.random();
                    if (n < 0.24) continue;
                    level = 3 + Math.floor(n * 5);
                }

                const x = rect.left + c * cw + cw / 2;
                const y = rect.top + r * ch + ch / 2;

                // Empurrão para fora do centro: as bordas saem mais rápido,
                // então a janela parece se abrir antes de se desfazer.
                const dx = x - cx;
                const dy = y - cy;
                const d = Math.hypot(dx, dy) || 1;
                const push = 0.6 + (d / Math.max(rect.width, rect.height)) * 2.4;

                parts.push({
                    x, y,
                    vx: (dx / d) * push * 46 + (Math.random() - 0.5) * 40,
                    vy: (dy / d) * push * 34 + (Math.random() - 0.5) * 40 - 30,
                    level,
                    level0: level,
                    // escalona quando cada caractere começa a se soltar
                    delay: (1 - d / (Math.max(rect.width, rect.height) * 0.75)) * 90,
                    spin: (Math.random() - 0.5) * 3
                });
            }
        }
        return parts;
    },

    play(rect, headerH = 36) {
        if (this.reducedMotion() || !rect?.width || !rect?.height) return Promise.resolve();

        this.ensureCanvas();
        this.readColors();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const ctx = this.ctx;
        ctx.font = `${this.FONT}px 'Fira Code', ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Fechar outra janela no meio da animação não deve apagar esta:
        // as partículas novas entram na mesma cena.
        this.particles = this.particles.concat(this.build(rect, headerH));

        if (this.animationId) return this.currentRun;

        const t0 = performance.now();
        this.currentRun = new Promise(resolve => {
            const frame = (now) => {
                const dt = Math.min(48, now - (this.lastFrame || now)) / 1000;
                this.lastFrame = now;
                const elapsed = now - t0;

                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                let alive = 0;
                for (const p of this.particles) {
                    if (elapsed < p.delay) {
                        // ainda parado: desenha a janela "virando texto"
                        this.draw(p, 1);
                        alive++;
                        continue;
                    }

                    const t = (elapsed - p.delay) / this.DURATION;
                    if (t >= 1) continue;
                    alive++;

                    p.x += p.vx * dt + p.spin;
                    p.y += p.vy * dt;
                    p.vy += 220 * dt;   // gravidade leve
                    p.vx *= 0.985;

                    // o glifo desce a rampa conforme se apaga
                    p.level = p.level0 * (1 - t);
                    this.draw(p, 1 - t * t);
                }

                if (alive) {
                    this.animationId = requestAnimationFrame(frame);
                } else {
                    this.stop();
                    resolve();
                }
            };
            this.lastFrame = 0;
            this.animationId = requestAnimationFrame(frame);
        });

        return this.currentRun;
    },

    draw(p, alpha) {
        const i = Math.max(0, Math.min(TOP, Math.round(p.level)));
        if (i === 0) return;
        const ctx = this.ctx;
        ctx.globalAlpha = Math.max(0, alpha) * (0.35 + (i / TOP) * 0.65);
        ctx.fillStyle = i >= TOP - 1 ? this.colors.accent : this.colors.dim;
        ctx.fillText(RAMP[i], p.x, p.y);
    },

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.currentRun = null;
        this.particles = [];
        this.lastFrame = 0;
        if (this.ctx) this.ctx.globalAlpha = 1;
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
    }
};
