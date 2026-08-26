// ================================================
// WINDOW SHATTER
//
// Ao fechar, uma onda varre a janela das quatro bordas em direção ao
// centro. Onde a onda ainda não passou, a janela continua inteira e
// real; onde já passou, sobrou o texto de que ela era feita. Os dois
// lados são separados por uma crista de '@' — a frente de onda.
//
// Isso é literal, não uma sobreposição: a janela de verdade é recortada
// por um clip-path que encolhe na mesma velocidade da frente. Por isso
// as duas metades nunca se contradizem — e por isso o recorte e o canvas
// precisam partilhar o MESMO relógio (FRONT_MS). Se derivarem, aparece
// a costura.
//
// Depois de atingido, cada caractere é puxado para o centro em espiral e
// decai pela rampa de luminância enquanto viaja: '@' vira '%', '#', '*',
// '+', '=', até nada. É o alfabeto do próprio sistema colapsando, e não
// um fade genérico.
//
// Não há como fotografar o conteúdo real da janela (html2canvas não
// renderiza backdrop-filter e foreignObject contamina o canvas), então a
// grade reconstrói a ESTRUTURA da janela — moldura, barra de título,
// corpo — que é o que o olho reconhece nesse meio segundo.
// ================================================

const RAMP = ' ·:-=+*#%@';
const TOP = RAMP.length - 1;

export const WindowShatter = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    currentRun: null,
    colors: { dim: '#565f89', accent: '#9ece6a' },

    CELL_W: 11,
    CELL_H: 17,
    FONT: 14,

    // A frente leva sempre este tempo para ir da borda ao centro, seja a
    // janela grande ou pequena. Tempo fixo em vez de velocidade fixa: uma
    // janela maximizada não deve demorar o dobro para fechar.
    FRONT_MS: 300,
    // Vida de cada caractere depois de a onda passar por ele.
    TRAVEL_MS: 420,
    // Espessura da crista brilhante, em milissegundos de onda.
    CREST_MS: 70,
    // Quanto do caminho até o centro cada caractere chega a percorrer.
    PULL: 0.95,
    // Giro acumulado na viagem, em radianos. Pouco: o suficiente para o
    // colapso não parecer uma sucção perfeitamente radial.
    SWIRL: 0.55,

    MAX_PARTICLES: 1700,

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
    // estrutura: moldura e barra de título sólidas, corpo esparso.
    //
    // hitAt é absoluto, e não relativo ao início desta janela: assim duas
    // janelas fechadas ao mesmo tempo convivem no mesmo laço, cada uma
    // com a sua onda.
    build(rect, headerH, startTime) {
        const cols = Math.max(1, Math.round(rect.width / this.CELL_W));
        const rows = Math.max(1, Math.round(rect.height / this.CELL_H));
        const cw = rect.width / cols;
        const ch = rect.height / rows;
        const headerRows = Math.max(1, Math.round(headerH / ch));

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxDepth = Math.max(1, Math.min(rect.width, rect.height) / 2);

        const parts = [];
        // Janela enorme rareia a grade em vez de estourar o número de
        // partículas e derrubar a taxa de quadros.
        const stride = Math.max(1, Math.ceil(Math.sqrt((cols * rows) / this.MAX_PARTICLES)));

        for (let r = 0; r < rows; r += stride) {
            for (let c = 0; c < cols; c += stride) {
                const edge = r === 0 || c === 0 || r >= rows - stride || c >= cols - stride;
                const header = r < headerRows;

                let level;
                if (edge) level = TOP;                                // moldura
                else if (header) level = TOP - 1 - ((c + r) % 2);     // barra de título
                else {
                    const n = Math.random();
                    if (n < 0.15) continue;
                    level = 3 + Math.floor(n * 5);
                }

                const x = rect.left + c * cw + cw / 2;
                const y = rect.top + r * ch + ch / 2;

                // Distância até a borda MAIS PRÓXIMA. É o que faz a frente
                // ser retangular, acompanhando o formato da janela, em vez
                // de um círculo que ignoraria a geometria dela.
                const depth = Math.min(
                    x - rect.left, rect.right - x,
                    y - rect.top, rect.bottom - y
                );

                const dx = x - cx;
                const dy = y - cy;

                parts.push({
                    cx, cy,
                    angle: Math.atan2(dy, dx),
                    radius: Math.hypot(dx, dy),
                    level0: level,
                    hitAt: startTime + (Math.max(0, depth) / maxDepth) * this.FRONT_MS
                });
            }
        }
        return parts;
    },

    // Recorta a janela real na mesma velocidade da frente de onda. É o que
    // faz a janela ser consumida, em vez de apenas sumir por baixo.
    consume(el, rect) {
        const inset = Math.min(rect.width, rect.height) / 2;
        const radius = getComputedStyle(el).borderTopLeftRadius || '0px';

        return el.animate([
            { clipPath: 'inset(0px round ' + radius + ')' },
            { clipPath: 'inset(' + inset + 'px round ' + radius + ')' }
        ], { duration: this.FRONT_MS, easing: 'linear', fill: 'both' });
    },

    // Recebe o ELEMENTO, e não só o retângulo: o recorte da janela e a
    // onda no canvas precisam nascer do mesmo instante.
    play(el, headerH = 36) {
        const rect = el?.getBoundingClientRect();
        if (this.reducedMotion() || !rect?.width || !rect?.height) return Promise.resolve();

        this.ensureCanvas();
        this.readColors();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const ctx = this.ctx;
        ctx.font = this.FONT + "px 'Fira Code', ui-monospace, monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const t0 = performance.now();
        const clip = this.consume(el, rect);

        // A promessa devolvida termina quando o RECORTE fecha, não quando o
        // último caractere apaga. Quem fechou a janela espera 300ms, não
        // 720 — senão o botão na taskbar ficaria meio segundo de fantasma
        // depois de a janela já ter sumido da tela. O colapso dos
        // caracteres segue sozinho no canvas, que se limpa ao terminar.
        //
        // Some com a janela ANTES de soltar o recorte: na ordem inversa ela
        // reapareceria por um quadro, inteira, por trás dos caracteres.
        // fromRect() limpa esta opacidade ao reabrir.
        const consumed = clip.finished.then(() => {
            el.style.opacity = '0';
            clip.cancel();
        }).catch(() => { /* elemento removido antes do fim */ });

        // Fechar outra janela no meio da animação não apaga esta: as
        // partículas novas entram na cena que já está rodando.
        this.particles = this.particles.concat(this.build(rect, headerH, t0));

        if (!this.animationId) this.animationId = requestAnimationFrame((n) => this.frame(n));

        this.currentRun = consumed;
        return consumed;
    },

    frame(now) {
        const ctx = this.ctx;
        if (!ctx) { this.animationId = null; return; }

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let alive = false;
        for (const p of this.particles) {
            const age = now - p.hitAt;

            // A onda ainda não chegou: aqui a janela real continua inteira,
            // então não se desenha nada por cima dela.
            if (age < 0) { alive = true; continue; }

            const t = age / this.TRAVEL_MS;
            if (t >= 1) continue;
            alive = true;

            // Espiral para dentro, acelerando.
            const e = t * t;
            const r = p.radius * (1 - e * this.PULL);
            const a = p.angle + t * this.SWIRL;

            // Crista: no instante em que é atingido, o caractere sobe ao
            // topo da rampa e volta. É a frente de onda.
            const crest = Math.max(0, 1 - age / this.CREST_MS);

            // A morte acontece só na segunda metade da viagem. Antes disso
            // o caractere mantém a forma enquanto converge — é o que faz o
            // centro virar um nó denso em vez de tudo se diluir no caminho.
            const decay = t < 0.5 ? 0 : (t - 0.5) * 2;
            const level = (p.level0 + (TOP - p.level0) * crest) * (1 - decay * decay);

            this.draw(
                p.cx + Math.cos(a) * r,
                p.cy + Math.sin(a) * r,
                level,
                (1 - decay * decay * decay) * (0.62 + crest * 0.38)
            );
        }

        if (alive) {
            this.animationId = requestAnimationFrame((n) => this.frame(n));
        } else {
            this.stop();
        }
    },

    draw(x, y, level, alpha) {
        const i = Math.max(0, Math.min(TOP, Math.round(level)));
        if (i === 0 || alpha <= 0) return;
        const ctx = this.ctx;
        ctx.globalAlpha = Math.min(1, alpha) * (0.35 + (i / TOP) * 0.65);
        ctx.fillStyle = i >= TOP - 1 ? this.colors.accent : this.colors.dim;
        ctx.fillText(RAMP[i], x, y);
    },

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        this.currentRun = null;
        this.particles = [];
        if (this.ctx) this.ctx.globalAlpha = 1;
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
            this.ctx = null;
        }
    }
};
