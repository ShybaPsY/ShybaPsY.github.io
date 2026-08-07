// ================================================
// SYSTEM MONITOR
//
// O único app cujo conteúdo o sistema gera sobre si mesmo, em tempo
// real. Todos os outros mostram texto que alguém escreveu; este mede.
//
// Regra: nenhum número inventado. FPS vem do requestAnimationFrame, o
// heap do performance.memory, os nós são contados no DOM, e o custo do
// campo ASCII é medido dentro do próprio drawFrame. O que o navegador
// não expõe aparece como "indisponível" — um monitor com CPU% falso
// seria decoração, e a graça dele é ser evidência.
//
// Os medidores saem em Fira Code, e não na fonte do sistema: em IBM
// Plex Mono os glifos de bloco não respeitam a grade monoespaçada
// (▇▆▅▃▂ medem 1.667x da largura de avanço) e as barras sairiam tortas.
// ================================================

import { t } from '../i18n/i18n.js';
import { SystemMetrics } from '../features/system-metrics.js';

const FULL = '█';
const EMPTY = '▁';
const SPARK = '▁▂▃▄▅▆▇█';

export const SystemMonitorApp = {
    WindowManager: null,
    AchievementManager: null,
    timer: null,
    fpsHistory: [],
    HISTORY: 44,

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;

        if (WindowManager) {
            WindowManager.registerCleanup('monitor', () => this.cleanup());
        }
    },

    open() {
        if (!this.WindowManager) return;
        if (this.WindowManager.windows['monitor']) {
            this.WindowManager.focusWindow('monitor');
            return;
        }

        this.fpsHistory = [];
        SystemMetrics.acquire();

        const content = `<div class="mon" id="mon-root"></div>`;
        this.WindowManager.createWindow('monitor', t('monitor.title'), 520, 560, content);

        this.tick();
        this.timer = setInterval(() => this.tick(), 250);

        if (this.AchievementManager) {
            this.AchievementManager.trackApp('monitor');
        }
    },

    // ---- desenho de medidores -------------------------------------

    bar(value, max, width = 18) {
        if (value == null || !isFinite(value) || max <= 0) return EMPTY.repeat(width);
        const n = Math.max(0, Math.min(width, Math.round((value / max) * width)));
        return FULL.repeat(n) + EMPTY.repeat(width - n);
    },

    sparkline(values, width) {
        if (!values.length) return EMPTY.repeat(width);
        const slice = values.slice(-width);
        const max = Math.max(...slice, 1);
        const line = slice.map(v =>
            SPARK[Math.max(0, Math.min(SPARK.length - 1, Math.round((v / max) * (SPARK.length - 1))))]
        ).join('');
        return line.padStart(width, ' ');
    },

    mb(bytes) {
        return (bytes / 1048576).toFixed(1);
    },

    duration(seconds) {
        const s = Math.floor(seconds);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
    },

    escape(str) {
        return String(str ?? '').replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    },

    // Uma linha de medidor: rótulo, valor, barra, teto.
    gauge(label, value, unit, bar, limit) {
        const shown = value == null
            ? `<span class="mon-na">${this.escape(t('monitor.unavailable'))}</span>`
            : `${this.escape(value)}<span class="mon-unit">${this.escape(unit)}</span>`;
        return `
            <div class="mon-gauge">
                <span class="mon-label">${this.escape(label)}</span>
                <span class="mon-value">${shown}</span>
                <span class="mon-bar">${bar}</span>
                <span class="mon-limit">${this.escape(limit)}</span>
            </div>`;
    },

    // ---- atualização ------------------------------------------------

    tick() {
        const root = document.getElementById('mon-root');
        if (!root) return this.cleanup();

        const fps = SystemMetrics.fps();
        if (fps != null) {
            this.fpsHistory.push(fps);
            if (this.fpsHistory.length > this.HISTORY) this.fpsHistory.shift();
        }

        const heap = SystemMetrics.heap();
        const field = SystemMetrics.modules['ascii-field'];
        const net = SystemMetrics.network();
        const p95 = SystemMetrics.frameP95();

        root.innerHTML = `
            <div class="mon-spark">${this.sparkline(this.fpsHistory, this.HISTORY)}</div>

            <div class="mon-gauges">
                ${this.gauge('fps', fps == null ? null : fps.toFixed(0), '', this.bar(fps, 60), '60')}
                ${this.gauge('quadro p95', p95 == null ? null : p95.toFixed(1), 'ms', this.bar(p95, 33.3), '33ms')}
                ${field ? this.gauge('campo ascii', field.ema.toFixed(1), 'ms',
                    this.bar(field.ema, 33.3), '33ms') : ''}
                ${heap
                ? this.gauge('heap js', this.mb(heap.used), 'MB',
                    this.bar(heap.used, heap.limit), this.mb(heap.limit) + 'MB')
                : this.gauge('heap js', null, '', EMPTY.repeat(18), '')}
            </div>

            <dl class="mon-facts">
                <dt>uptime</dt><dd>${this.escape(this.duration(SystemMetrics.uptime()))}</dd>
                <dt>nós no dom</dt><dd>${SystemMetrics.domNodes().toLocaleString('pt-BR')}</dd>
                <dt>requisições</dt><dd>${net.requests}</dd>
                <dt>transferido</dt><dd>${this.mb(net.bytes)} MB</dd>
                <dt>tarefas longas</dt><dd>${SystemMetrics.longTasks}</dd>
            </dl>

            <div class="mon-sec">${this.escape(t('monitor.processes'))}</div>
            ${this.renderProcesses()}
        `;
    },

    renderProcesses() {
        const list = SystemMetrics.processes(this.WindowManager);
        const dash = '<span class="mon-na">–</span>';

        const rows = list.map((p, i) => `
            <tr>
                <td class="mon-pid">${String(i + 1).padStart(3, '0')}</td>
                <td class="mon-name">${this.escape(p.name)}</td>
                <td class="mon-num">${p.nodes == null ? dash : p.nodes}</td>
                <td class="mon-num">${p.canvas == null ? dash : p.canvas}</td>
                <td class="mon-num">${p.ms == null ? dash : p.ms.toFixed(1) + 'ms'}</td>
                <td class="mon-state mon-${p.state}">${p.state}</td>
            </tr>`).join('');

        return `
            <table class="mon-proc">
                <thead>
                    <tr>
                        <th>pid</th><th>app</th><th>nós</th><th>cnv</th><th>ms</th><th></th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`;
    },

    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            SystemMetrics.release();
        }
    }
};
