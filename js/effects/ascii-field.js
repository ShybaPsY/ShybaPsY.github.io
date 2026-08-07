// ================================================
// ASCII FIELD BACKGROUND MODULE
//
// O sistema inteiro converte imagem em texto: o ASCII Mirror
// faz isso com a webcam, o retrato de abertura faz com uma foto.
// O desktop faz com luz. Este campo é uma superfície de ondas
// renderizada pela mesma rampa de luminância, e o cursor do
// usuário é a fonte de luz que ilumina o relevo.
//
// Cada linha é desenhada como UMA string por faixa de brilho, em
// vez de um fillText por caractere: ~5 chamadas por linha no lugar
// de ~160, o que deixa a grade fina o bastante para parecer uma
// superfície e não pontos soltos.
// ================================================

import { SystemMetrics } from '../features/system-metrics.js';

export const AsciiField = {
    canvas: null,
    ctx: null,
    cols: 0,
    rows: 0,
    cellW: 9,
    cellH: 16,
    fontSize: 15,
    // rampa de luminância: do vazio ao sólido
    DEFAULT_RAMP: ' .·:-=+*#%@',
    chars: ' .·:-=+*#%@',
    mouse: { x: -99999, y: -99999 },
    ripples: [],
    animationId: null,
    lastFrame: 0,
    frameInterval: 1000 / 30, // 30fps é suficiente para um fundo
    frameCount: 0,
    reducedMotion: false,
    fadeStart: 0,
    FADE_IN_MS: 2200,

    // Faixas de brilho: cada uma vira uma passada de fillText. A cor de
    // cada faixa sai da rampa de três paradas da paleta ativa; aqui ficam
    // só as opacidades, que não mudam entre paletas.
    TIERS: [0.07, 0.13, 0.22, 0.20, 0.44],

    // Paleta ativa. O papel de parede escolhido no menu de contexto define
    // esses valores; sem paleta, tudo é derivado do tema.
    //   stops   três paradas do vale à crista
    //   drift   quanto a rampa escorrega de cima para baixo da tela
    //           (0 = cor uniforme, 1 = degradê vertical cheio)
    //   density multiplica a quantidade de tinta
    palette: null,
    stops: [[86, 95, 137], [130, 160, 130], [158, 206, 106]],
    drift: 0,

    // Tabela [faixa vertical][nível de brilho] -> 'rgb(...)'. A cor de uma
    // célula só depende da linha e da paleta, nunca do tempo — então ela é
    // calculada na troca de paleta, e não a cada frame. A opacidade, essa
    // sim varia com o fade-in, e vai por globalAlpha (número, sem string).
    COLOR_BANDS: 24,
    colorTable: null,
    // Abaixo disso a célula fica vazia. O vale precisa ser vazio para
    // a crista significar alguma coisa. A paleta pode adensar ou rarefazer
    // o campo mexendo neste limiar.
    BASE_THRESHOLD: 0.34,
    INK_THRESHOLD: 0.34,

    // Oclusão: se o cursor é a luz, uma janela é um objeto opaco. O campo
    // se apaga sob ela e acende num anel rente à borda, como a sombra e o
    // contorno de algo pousado sobre a superfície. Além de fechar a física
    // da cena, isso acalma o fundo exatamente onde há texto para ler.
    // A janela é de vidro: ela atenua a luz em vez de bloquear. Uma sombra
    // total apagaria o campo e faria a janela parecer opaca — o valor abaixo
    // derruba duas faixas de brilho, o suficiente para o texto respirar e
    // ainda restar textura visível através do vidro.
    OCC_SOFT: 62,    // px de rampa para dentro da janela até a sombra cheia
    OCC_DIM: 1.85,   // quanto a sombra rebaixa o relevo
    OCC_RIM: 46,     // px de anel de luz do lado de fora
    OCC_GAIN: 1.15,  // quanto o anel levanta o relevo
    occluders: [],

    init() {
        this.canvas = document.getElementById('particle-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.resize();
        this.refreshColors();

        window.addEventListener('resize', () => this.resize());
        document.addEventListener('pointermove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        document.addEventListener('mouseleave', () => {
            this.mouse.x = -99999;
            this.mouse.y = -99999;
        });
        // Ondas de choque apenas em cliques no desktop (fora de janelas/taskbar)
        document.addEventListener('mousedown', (e) => {
            if (e.target.closest('.app-window') || e.target.closest('#terminal') ||
                e.target.closest('#taskbar') || e.target.closest('.context-menu')) return;
            this.ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
            if (this.ripples.length > 5) this.ripples.shift();
        });

        if (this.reducedMotion) {
            this.drawFrame(0);
            return;
        }
        this.fadeStart = performance.now();
        this.animate(0);
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Num celular a grade fina não compensa: quase sempre há uma janela
        // de tela cheia por cima dela, e o custo por frame é o mesmo.
        const compact = window.innerWidth < 760;
        this.fontSize = compact ? 19 : 15;
        this.cellH = compact ? 20 : 16;

        this.ctx.font = `${this.fontSize}px 'Fira Code', ui-monospace, monospace`;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        // A largura da célula precisa ser o avanço real da fonte, senão as
        // linhas desenhadas de uma vez saem fora da grade.
        this.cellW = this.ctx.measureText('M').width || this.fontSize * 0.6;
        this.cols = Math.ceil(this.canvas.width / this.cellW) + 1;
        this.rows = Math.ceil(this.canvas.height / this.cellH) + 1;

        // Buffers de linha reaproveitados entre frames
        this.rowBuf = this.TIERS.map(() => new Array(this.cols));
        this.buildTables();
    },

    // As três senóides do campo são separáveis em x e y. Guardando
    // sen/cos de cada coluna aqui, o laço interno vira só multiplicação
    // e soma: ~1200 chamadas trigonométricas por redimensionamento no
    // lugar de ~75 mil por frame.
    buildTables() {
        const n = this.cols;
        const F = (fn, k) => {
            const a = new Float32Array(n);
            for (let i = 0; i < n; i++) a[i] = fn(i * k);
            return a;
        };
        this.k1s = F(Math.sin, 0.075);
        this.k1c = F(Math.cos, 0.075);
        this.k2s = F(Math.sin, 0.045);
        this.k2c = F(Math.cos, 0.045);
        this.k3s = F(Math.sin, 0.21);
        this.k3c = F(Math.cos, 0.21);
        this.wave1 = new Float32Array(n);
    },

    // Aceita '#rgb', '#rrggbb' ou 'rgb(...)' — que é o que getComputedStyle
    // devolve para as variáveis de tema.
    parseColor(str, fallback = [128, 128, 128]) {
        if (!str) return fallback;
        const s = str.trim();
        if (s[0] === '#') {
            const h = s.slice(1);
            if (h.length === 3) {
                return [h[0] + h[0], h[1] + h[1], h[2] + h[2]].map(v => parseInt(v, 16));
            }
            if (h.length >= 6) {
                return [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)].map(v => parseInt(v, 16));
            }
            return fallback;
        }
        const m = s.match(/-?\d+(\.\d+)?/g);
        return m && m.length >= 3 ? m.slice(0, 3).map(Number) : fallback;
    },

    lerp3(a, b, t) {
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t
        ];
    },

    // Amostra a rampa de três paradas na posição p (0 = vale, 1 = crista).
    sampleRamp(p) {
        const t = p < 0 ? 0 : p > 1 ? 1 : p;
        return t < 0.5
            ? this.lerp3(this.stops[0], this.stops[1], t * 2)
            : this.lerp3(this.stops[1], this.stops[2], (t - 0.5) * 2);
    },

    // Troca a paleta do campo. Chamado pelo WallpaperManager: no lugar de
    // desenhar uma imagem atrás do campo, o papel de parede passa a dizer
    // de que cores o campo é feito.
    applyPreset(field) {
        this.palette = field || null;
        // Sempre volta ao padrão antes de aplicar: sem isso, sair de um
        // preset de textura para um sem `ramp` mantinha o alfabeto antigo.
        this.chars = field?.ramp || this.DEFAULT_RAMP;
        this.drift = field?.drift || 0;
        this.INK_THRESHOLD = this.BASE_THRESHOLD / (field?.density || 1);
        this.refreshColors();
    },

    refreshColors() {
        const style = getComputedStyle(document.documentElement);
        const themeLow = style.getPropertyValue('--comment').trim() || '#565f89';
        const themeHigh = style.getPropertyValue('--green').trim() || '#9ece6a';
        const p = this.palette;

        // Sem paleta própria, a rampa vai da cor de comentário à de acento
        // do tema — que é o comportamento original.
        const low = this.parseColor(p?.low || themeLow);
        const high = this.parseColor(p?.high || themeHigh);
        const mid = p?.mid ? this.parseColor(p.mid) : this.lerp3(low, high, 0.5);

        this.stops = [low, mid, high];
        this.buildColorTable();
    },

    buildColorTable() {
        const bands = this.COLOR_BANDS;
        const nTiers = this.TIERS.length;
        const table = new Array(bands);

        for (let b = 0; b < bands; b++) {
            // Sem drift, todas as faixas verticais têm a mesma cor.
            const shift = this.drift ? this.drift * (b / (bands - 1) - 0.5) : 0;
            const row = new Array(nTiers);
            for (let k = 0; k < nTiers; k++) {
                const [r, g, bl] = this.sampleRamp(k / (nTiers - 1) + shift);
                row[k] = `rgb(${r | 0},${g | 0},${bl | 0})`;
            }
            table[b] = row;
        }
        this.colorTable = table;
    },

    // Retângulos das janelas visíveis. Lido uma vez por frame, fora do laço
    // de células: são poucos elementos, e ler dentro do laço custaria caro.
    collectOccluders() {
        const els = document.querySelectorAll('#terminal, .app-window');
        this.occluders.length = 0;
        for (const el of els) {
            if (el.classList.contains('minimized') || el.offsetParent === null) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 40 || r.height < 40) continue;
            this.occluders.push(r);
        }
    },

    // Três oitavas: a grande dá a onda, as menores dão o grão.
    // Mantida para inspeção e testes; o desenho usa a versão tabelada.
    fieldHeight(x, y, t) {
        return Math.sin(x * 0.075 + t * 0.5) * Math.cos(y * 0.115 - t * 0.37)
            + Math.sin((x + y * 0.6) * 0.045 + t * 0.68) * 0.85
            + Math.sin((x * 0.21 - y * 0.17) + t * 0.9) * 0.32;
    },

    drawFrame(now) {
        const ctx = this.ctx;
        const t = now / 1000;
        const { width, height } = this.canvas;
        ctx.clearRect(0, 0, width, height);

        // expira ondas de choque com mais de 2.5s
        this.ripples = this.ripples.filter(r => now - r.t0 < 2500);

        const chars = this.chars;
        const lastChar = chars.length - 1;
        const tiers = this.TIERS;
        const nTiers = tiers.length;
        const cols = this.cols;
        const drift = this.drift;
        const rowsMax = Math.max(1, this.rows - 1);
        if (!this.colorTable) this.buildColorTable();
        const colorTable = this.colorTable;
        const lastBand = colorTable.length - 1;
        const mx = this.mouse.x, my = this.mouse.y;
        const fadeIn = this.reducedMotion ? 1
            : Math.min(1, Math.max(0, (now - this.fadeStart) / this.FADE_IN_MS));

        const { k1s, k1c, k2s, k2c, k3s, k3c, wave1 } = this;

        // Primeira oitava: a parte que depende do tempo sai do laço.
        const t1s = Math.sin(t * 0.5), t1c = Math.cos(t * 0.5);
        for (let gx = 0; gx < cols; gx++) {
            wave1[gx] = k1s[gx] * t1c + k1c[gx] * t1s;
        }

        // Raio e amplitude de cada onda de choque não mudam dentro do frame
        const rings = this.ripples.map(r => {
            const age = (now - r.t0) / 1000;
            return { x: r.x, y: r.y, radius: age * 420, amp: 2.6 * (1 - age / 2.5) };
        });
        const nRings = rings.length;

        this.collectOccluders();
        const occ = this.occluders;
        const nOcc = occ.length;
        const { OCC_SOFT, OCC_DIM, OCC_RIM, OCC_GAIN } = this;

        for (let gy = 0; gy < this.rows; gy++) {
            const py = gy * this.cellH + this.cellH / 2;

            // Cores desta linha, vindas da tabela. Com drift > 0 a rampa
            // escorrega conforme se desce na tela: é isso que faz o
            // "Arctic" ir de azul profundo no topo a gelo no pé, sem
            // nenhuma imagem por trás.
            const bandRow = colorTable[drift ? ((gy / rowsMax) * lastBand) | 0 : 0];

            // Fase da linha para cada oitava
            const cy = Math.cos(gy * 0.115 - t * 0.37);
            const b2 = gy * 0.027 + t * 0.68;
            const s2 = Math.sin(b2), c2 = Math.cos(b2);
            const b3 = t * 0.9 - gy * 0.17;
            const s3 = Math.sin(b3), c3 = Math.cos(b3);

            for (let k = 0; k < nTiers; k++) this.rowBuf[k].fill(' ');
            let rowHasInk = false;

            for (let gx = 0; gx < cols; gx++) {
                const px = gx * this.cellW;

                let h = wave1[gx] * cy
                    + (k2s[gx] * c2 + k2c[gx] * s2) * 0.85
                    + (k3s[gx] * c3 + k3c[gx] * s3) * 0.32;

                // O cursor é a luz: ele levanta o relevo em vez de afundá-lo,
                // então a rampa fica mais densa e mais quente ao redor dele.
                const dxm = px - mx, dym = py - my;
                const distM2 = dxm * dxm + dym * dym;
                if (distM2 < 90000) { // raio ~300px
                    h += Math.exp(-distM2 / 15000) * 3.4;
                }

                // ondas de choque dos cliques
                for (let i = 0; i < nRings; i++) {
                    const r = rings[i];
                    const dxr = px - r.x, dyr = py - r.y;
                    const ringDist = Math.abs(Math.sqrt(dxr * dxr + dyr * dyr) - r.radius);
                    if (ringDist < 90) {
                        h += (1 - ringDist / 90) * r.amp;
                    }
                }

                // sombra e contorno das janelas
                if (nOcc) {
                    let dim = 0, rim = 0;
                    for (let i = 0; i < nOcc; i++) {
                        const r = occ[i];
                        // positivo = dentro (distância até a borda mais próxima),
                        // negativo = fora
                        const depth = Math.min(px - r.left, r.right - px,
                            py - r.top, r.bottom - py);
                        if (depth > 0) {
                            const d = depth < OCC_SOFT ? depth / OCC_SOFT : 1;
                            if (d > dim) dim = d;
                        } else if (-depth < OCC_RIM) {
                            const g = 1 + depth / OCC_RIM;
                            if (g > rim) rim = g;
                        }
                    }
                    if (dim) h -= dim * OCC_DIM;
                    else if (rim) h += rim * OCC_GAIN;
                }

                // altura normalizada -> caractere + faixa de brilho
                const n = h < -2.2 ? 0 : h > 2.6 ? 1 : (h + 2.2) / 4.8;
                if (n < this.INK_THRESHOLD) continue;

                const tier = Math.min(nTiers - 1, Math.floor(n * nTiers));
                this.rowBuf[tier][gx] = chars[Math.min(lastChar, Math.round(n * lastChar))];
                rowHasInk = true;
            }

            if (!rowHasInk) continue;

            for (let k = 0; k < nTiers; k++) {
                const line = this.rowBuf[k].join('');
                if (!line.trim()) continue;
                ctx.fillStyle = bandRow[k];
                ctx.globalAlpha = tiers[k] * fadeIn;
                ctx.fillText(line, 0, py);
            }
        }
        ctx.globalAlpha = 1;
    },

    animate(now) {
        this.animationId = requestAnimationFrame((ts) => this.animate(ts));

        if (now - this.lastFrame < this.frameInterval) return;
        this.lastFrame = now;

        // re-lê as cores do tema de tempos em tempos (troca de tema ao vivo)
        if (++this.frameCount % 90 === 0) this.refreshColors();

        // O monitor de sistema mostra este número. Medir aqui é o que o
        // torna um dado real em vez de uma estimativa.
        const t0 = performance.now();
        this.drawFrame(now);
        SystemMetrics.report('ascii-field', performance.now() - t0);
    },

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};
