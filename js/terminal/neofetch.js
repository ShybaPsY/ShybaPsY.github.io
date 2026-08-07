// ================================================
// NEOFETCH
//
// O sistema inteiro converte imagem em texto — o ASCII Mirror com a
// webcam, a intro com a foto, o desktop com luz. Então o logo do
// neofetch não é um desenho genérico: é o próprio retrato, amostrado
// na mesma rampa de luminância na hora em que o comando roda.
//
// Se a imagem não carregar, cai no logo estático do i18n.
// ================================================

const RAMP = ' .:-=+*#%@';
const COLS = 42;

// Célula de caractere: 0.6em de avanço por 1.15em de linha. Sem essa
// correção o retrato sai achatado na vertical.
const CELL_RATIO = 0.6 / 1.15;

// A foto é quadrada e o terço de baixo é só camisa. Cortando em 77% da
// altura sobra cabeça e ombros, que é o que se reconhece nessa resolução.
const CROP = 0.775;

let cachedRows = null;

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Amostra a imagem numa grade de caracteres e devolve, por linha, uma
// lista de trechos { text, tier } — trechos em vez de um span por
// caractere para não gerar 600 nós à toa.
function sample(img) {
    const srcH = img.height * CROP;
    const rows = Math.round(COLS * (srcH / img.width) * CELL_RATIO);

    const c = document.createElement('canvas');
    c.width = COLS;
    c.height = rows;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, img.width, srcH, 0, 0, COLS, rows);
    const data = ctx.getImageData(0, 0, COLS, rows).data;

    const lum = new Float32Array(COLS * rows);
    for (let p = 0; p < lum.length; p++) {
        const i = p * 4;
        lum[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    }

    // Auto-contraste: a foto ocupa uma faixa estreita de brilho e, sem
    // esticá-la, quase tudo cai no mesmo caractere da rampa.
    const sorted = Float32Array.from(lum).sort();
    const lo = sorted[Math.floor(sorted.length * 0.02)];
    const hi = sorted[Math.floor(sorted.length * 0.98)];
    const span = Math.max(0.001, hi - lo);

    const last = RAMP.length - 1;
    const out = [];
    for (let y = 0; y < rows; y++) {
        const runs = [];
        for (let x = 0; x < COLS; x++) {
            const norm = Math.max(0, Math.min(1, (lum[y * COLS + x] - lo) / span));
            // A foto é contraluz: o fundo é claro e o sujeito, escuro. Sem
            // inverter, o fundo vira a massa densa e o rosto some no vazio.
            const v = 1 - norm;
            const ch = RAMP[Math.round(v * last)];
            const tier = v > 0.66 ? 'hi' : v > 0.33 ? 'mid' : 'lo';
            const prev = runs[runs.length - 1];
            if (prev && prev.tier === tier) prev.text += ch;
            else runs.push({ text: ch, tier });
        }
        out.push(runs);
    }
    return out;
}

// Uma família de tons só: sombra, meio-tom, luz. Três cores diferentes
// picotariam o retrato em manchas. O meio-tom herda a cor do texto — sem
// classe, porque .output-text traria white-space: pre-wrap e quebraria a
// grade de caracteres.
const TIER_CLASS = { hi: 'detail-green', mid: '', lo: 'comment' };

function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function renderArt(rows) {
    return rows.map(runs =>
        runs.map(r => {
            const cls = TIER_CLASS[r.tier];
            const text = escapeHtml(r.text);
            return cls ? `<span class="${cls}">${text}</span>` : text;
        }).join('')
    );
}

// Junta retrato e informações lado a lado, alinhados numa grade só.
function compose(artLines, info) {
    const gap = '   ';
    const height = Math.max(artLines.length, info.length);
    const blank = ' '.repeat(COLS);
    const out = [];

    for (let i = 0; i < height; i++) {
        const art = artLines[i] !== undefined ? artLines[i] : blank;
        out.push(art + gap + (info[i] || ''));
    }
    return out.join('\n');
}

function buildInfo({ uptime, theme, windows }) {
    const pad = (k) => k.padEnd(11, ' ');
    const row = (k, v) =>
        `<span class="detail-green">${pad(k)}</span><span class="comment">${escapeHtml(v)}</span>`;

    const mm = Math.floor(uptime / 60);
    const ss = uptime % 60;
    const upStr = mm > 0 ? `${mm}m ${ss}s` : `${ss}s`;

    return [
        `<span class="highlight">gabriel</span><span class="comment">@</span><span class="highlight">portfolio</span>`,
        `<span class="comment">${'─'.repeat(30)}</span>`,
        row('os', 'Portfolio OS 2.0'),
        row('host', 'GitHub Pages'),
        row('kernel', 'JavaScript ES2022'),
        row('shell', 'terminal.js'),
        row('uptime', upStr),
        row('theme', theme),
        row('windows', String(windows)),
        row('resolution', `${window.innerWidth}x${window.innerHeight}`),
        '',
        row('role', 'Desenvolvedor Fullstack'),
        row('stack', 'React · TS · Java · Python'),
        row('location', 'Anhumas, SP · BR'),
        row('langs', 'PT · EN · ES'),
        row('contact', 'asdgabrielmlopes@gmail.com')
    ];
}

export async function buildNeofetch({ ThemeManager, WindowManager } = {}) {
    const uptime = Math.floor((Date.now() - performance.timeOrigin) / 1000);
    const theme = ThemeManager?.current || 'tokyo-night';
    const windows = Object.keys(WindowManager?.windows || {}).length + 1; // +1: o terminal

    if (!cachedRows) {
        try {
            cachedRows = sample(await loadImage('assets/img/profile.jpg'));
        } catch (err) {
            return null; // quem chama cai no logo estático
        }
    }

    const body = compose(renderArt(cachedRows), buildInfo({ uptime, theme, windows }));
    return `<span class="neofetch">${body}</span>`;
}
