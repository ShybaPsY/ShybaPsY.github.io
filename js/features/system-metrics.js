// ================================================
// SYSTEM METRICS
//
// Coletor de telemetria real do próprio portfólio. A regra desta camada
// é simples e vale para tudo que ela expõe: nenhum número inventado. Se
// um dado não é obtenível no navegador, ele não aparece — devolve null e
// quem consome mostra "indisponível" em vez de enfeite.
//
// O amostrador de quadros só roda enquanto alguém está olhando, senão o
// monitor viraria parte da carga que ele mede.
// ================================================

export const SystemMetrics = {
    t0: performance.now(),

    // Custo por quadro reportado pelos próprios módulos. Quem desenha
    // chama report() com o tempo que levou; nada aqui é estimado.
    modules: Object.create(null),

    frameDeltas: [],
    HISTORY: 48,
    rafId: null,
    lastFrame: 0,
    longTasks: 0,
    observer: null,
    watchers: 0,

    report(name, ms) {
        const m = this.modules[name] || (this.modules[name] = { ms: 0, ema: 0 });
        m.ms = ms;
        // média móvel exponencial: o número para de tremer sem mentir
        m.ema = m.ema ? m.ema * 0.86 + ms * 0.14 : ms;
    },

    // Contagem de referências: dois monitores abertos compartilham um
    // amostrador só, e ele para quando o último fecha.
    acquire() {
        if (++this.watchers > 1) return;

        this.frameDeltas.length = 0;
        this.lastFrame = 0;

        const tick = (now) => {
            if (this.lastFrame) {
                const d = now - this.lastFrame;
                this.frameDeltas.push(d);
                if (this.frameDeltas.length > this.HISTORY) this.frameDeltas.shift();
            }
            this.lastFrame = now;
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);

        // Tarefas longas travam a interface; o navegador sabe quais são.
        if ('PerformanceObserver' in window) {
            try {
                this.observer = new PerformanceObserver(list => {
                    this.longTasks += list.getEntries().length;
                });
                this.observer.observe({ entryTypes: ['longtask'] });
            } catch (err) { /* longtask não suportado neste navegador */ }
        }
    },

    release() {
        if (--this.watchers > 0) return;
        this.watchers = 0;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.observer?.disconnect();
        this.observer = null;
    },

    fps() {
        if (this.frameDeltas.length < 4) return null;
        const avg = this.frameDeltas.reduce((a, b) => a + b, 0) / this.frameDeltas.length;
        return avg > 0 ? 1000 / avg : null;
    },

    frameP95() {
        if (this.frameDeltas.length < 4) return null;
        const s = [...this.frameDeltas].sort((a, b) => a - b);
        return s[Math.floor(s.length * 0.95)];
    },

    // Só existe em navegadores baseados em Chromium.
    heap() {
        const m = performance.memory;
        if (!m || !m.usedJSHeapSize) return null;
        return { used: m.usedJSHeapSize, limit: m.jsHeapSizeLimit };
    },

    uptime() {
        return (performance.now() - this.t0) / 1000;
    },

    domNodes(root = document) {
        return root.getElementsByTagName('*').length;
    },

    // Peso real da página, pelo Resource Timing. transferSize vem zerado
    // quando o recurso veio do cache, então o total é o que trafegou de
    // fato nesta visita.
    network() {
        const entries = performance.getEntriesByType('resource');
        let bytes = 0;
        for (const e of entries) bytes += e.transferSize || 0;
        return { requests: entries.length, bytes };
    },

    // Uma "tabela de processos" só com o que dá para medir: nós no DOM e
    // canvas por janela. Sem CPU% falso.
    processes(WindowManager) {
        const list = [];

        const terminal = document.getElementById('terminal');
        if (terminal) {
            list.push({
                name: 'terminal',
                nodes: this.domNodes(terminal),
                canvas: terminal.querySelectorAll('canvas').length,
                state: terminal.classList.contains('minimized') ? 'susp' : 'run'
            });
        }

        for (const [id, el] of Object.entries(WindowManager?.windows || {})) {
            list.push({
                name: id,
                nodes: this.domNodes(el),
                canvas: el.querySelectorAll('canvas').length,
                state: el.classList.contains('minimized') ? 'susp' : 'run'
            });
        }

        // Processos de sistema: só entram os que se instrumentam de fato.
        for (const [name, m] of Object.entries(this.modules)) {
            list.push({ name, nodes: null, canvas: null, state: 'run', ms: m.ema });
        }

        return list;
    }
};
