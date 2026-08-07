// ================================================
// PROJETOS — NAVEGADOR DE DOIS PAINÉIS
//
// A versão anterior era um grid de cartões 3D que viravam no hover, com
// um carrossel de destaques em cima e um modal por baixo. Três camadas
// para chegar no texto, e três problemas:
//
//   1. Os nove projetos estão marcados featured: true, então o carrossel
//      de "destaques" era o portfólio inteiro, repetido no grid logo
//      abaixo. Nada era destaque de nada.
//   2. A mesma `description` aparecia na frente do cartão, no verso do
//      cartão e de novo no modal. O texto bom — `fullDescription`, que é
//      onde ele conta o que construiu — ficava escondido a dois cliques.
//   3. Virar o cartão trocava a miniatura por um botão. Movimento que
//      tirava informação da tela.
//
// Agora são dois painéis: à esquerda o portfólio inteiro, visível de uma
// vez e agrupado por área; à direita o projeto selecionado, por completo.
// É a gramática de um gerenciador de arquivos — que é o idioma deste
// sistema — e resolve o problema de fato: dá para varrer nove projetos
// sem rolar e ler um a fundo sem abrir nada.
// ================================================

import { i18n, t } from '../i18n/i18n.js';

export const ProjetosApp = {
    WindowManager: null,
    AchievementManager: null,
    projects: [],
    groups: [],
    selectedId: null,
    shotIndex: 0,
    filter: '',
    keyHandler: null,

    // Áreas derivadas da stack de cada projeto. Ordem importa: o primeiro
    // que casar vence. Fica em código, e não no JSON, para continuar
    // valendo quando um projeto novo for adicionado.
    CATEGORIES: [
        { id: 'saas', test: p => /saas/i.test(p.title) || p.stackHas(/supabase|mercadopago|twilio/) },
        { id: 'fullstack', test: p => p.stackHas(/spring/) },
        { id: 'dados', test: p => p.stackHas(/scikit|pandas|numpy|matplotlib|seaborn/) },
        { id: 'sistemas', test: p => p.stackHas(/arduino|c\+\+|pyqt/) },
        { id: 'web', test: () => true }
    ],

    // O mesmo produto aparecia escrito de duas formas, o que quebrava
    // qualquer tentativa de filtrar por tecnologia.
    TECH_ALIAS: {
        'tailwindcss': 'Tailwind CSS',
        'lucide react': 'Lucide',
        'bootstrap 5': 'Bootstrap',
        'google gemini ai': 'Gemini AI'
    },

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;

        if (WindowManager) {
            WindowManager.registerCleanup('projetos', () => this.cleanup());
        }
    },

    open() {
        if (!this.WindowManager) return;

        this.loadProjects();
        this.filter = '';
        this.selectedId = this.projects[0]?.id || null;
        this.shotIndex = 0;

        const content = `<div class="pj" id="pj-root"></div>`;
        this.WindowManager.createWindow('projetos', t('projetos.title'), 880, 620, content);
        this.render();

        if (this.AchievementManager) {
            this.AchievementManager.trackApp('projetos');
        }
    },

    // ================================================
    // DADOS
    // ================================================

    normalizeTech(tech) {
        return this.TECH_ALIAS[String(tech).toLowerCase().trim()] || tech;
    },

    loadProjects() {
        const raw = i18n.getProjects() || [];

        this.projects = raw.map(p => {
            const stack = [...new Set((p.techStack || []).map(t => this.normalizeTech(t)))];
            const item = {
                ...p,
                stack,
                year: (p.date || '').slice(0, 4),
                images: p.images?.length ? p.images : (p.thumbnail ? [p.thumbnail] : []),
                stackHas: (re) => stack.some(t => re.test(t.toLowerCase()))
            };
            item.category = this.CATEGORIES.find(c => c.test(item)).id;
            return item;
        });

        this.buildGroups();
    },

    // Agrupa os projetos visíveis pelas áreas, preservando a ordem de
    // CATEGORIES para a lista não dançar entre filtros.
    buildGroups() {
        const term = this.filter.trim().toLowerCase();
        const matches = (p) => !term ||
            p.title.toLowerCase().includes(term) ||
            p.id.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            p.stack.some(s => s.toLowerCase().includes(term));

        const visible = this.projects.filter(matches);

        this.groups = this.CATEGORIES
            .map(c => ({ id: c.id, items: visible.filter(p => p.category === c.id) }))
            .filter(g => g.items.length);
    },

    visibleProjects() {
        return this.groups.flatMap(g => g.items);
    },

    selected() {
        return this.projects.find(p => p.id === this.selectedId) || null;
    },

    // ================================================
    // RENDER
    // ================================================

    escape(str) {
        return String(str ?? '').replace(/[&<>"]/g,
            m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
    },

    render() {
        const root = document.getElementById('pj-root');
        if (!root) return;

        root.innerHTML = `
            <div class="pj-bar">
                <span class="pj-prompt">$</span>
                <input type="text" class="pj-search" id="pj-search"
                       placeholder="${this.escape(t('projetos.search_placeholder'))}"
                       value="${this.escape(this.filter)}" autocomplete="off">
                <span class="pj-count">${this.visibleProjects().length}/${this.projects.length}</span>
            </div>
            <div class="pj-body">
                <nav class="pj-list" id="pj-list" role="listbox"
                     aria-label="${this.escape(t('projetos.title'))}">
                    ${this.renderList()}
                </nav>
                <section class="pj-detail" id="pj-detail">
                    ${this.renderDetail()}
                </section>
            </div>
        `;

        this.bindEvents();
    },

    renderList() {
        if (!this.groups.length) {
            return `<p class="pj-empty">${this.escape(t('projetos.no_results'))}</p>`;
        }

        return this.groups.map(g => `
            <div class="pj-group">${g.id}/</div>
            ${g.items.map(p => `
                <button type="button" class="pj-item${p.id === this.selectedId ? ' is-on' : ''}"
                        role="option" aria-selected="${p.id === this.selectedId}" data-id="${this.escape(p.id)}">
                    <span class="pj-item-name">${this.escape(p.id)}</span>
                    <span class="pj-item-year">${this.escape(p.year)}</span>
                </button>
            `).join('')}
        `).join('');
    },

    renderDetail() {
        const p = this.selected();
        if (!p) return `<p class="pj-empty">${this.escape(t('projetos.no_results'))}</p>`;

        // O título traz "Nome - Subtítulo"; separar dá uma hierarquia real
        // em vez de uma linha longa só.
        const [name, ...rest] = p.title.split(/\s+[-–—]\s+/);
        const sub = rest.join(' — ');
        const shots = p.images;
        const shot = shots[Math.min(this.shotIndex, shots.length - 1)];

        return `
            <header class="pj-head">
                <h2 class="pj-title">${this.escape(name)}</h2>
                ${sub ? `<p class="pj-sub">${this.escape(sub)}</p>` : ''}
            </header>

            ${shot ? `
                <figure class="pj-shot">
                    <img src="${this.escape(shot)}" alt="${this.escape(name)}" loading="lazy" decoding="async">
                    ${shots.length > 1 ? `
                        <button type="button" class="pj-shot-nav pj-prev" data-step="-1" aria-label="anterior">‹</button>
                        <button type="button" class="pj-shot-nav pj-next" data-step="1" aria-label="próxima">›</button>
                        <figcaption class="pj-shot-count">${this.shotIndex + 1}/${shots.length}</figcaption>
                    ` : ''}
                </figure>
            ` : ''}

            <p class="pj-desc">${this.escape(p.fullDescription || p.description)}</p>

            <dl class="pj-spec">
                <dt>stack</dt>
                <dd class="pj-stack">
                    ${p.stack.map(s => `
                        <button type="button" class="pj-tech" data-tech="${this.escape(s)}">${this.escape(s)}</button>
                    `).join('')}
                </dd>
                ${p.year ? `<dt>ano</dt><dd>${this.escape(p.year)}</dd>` : ''}
                <dt>área</dt><dd>${this.escape(p.category)}</dd>
            </dl>
        `;
    },

    // Redesenha só o painel que mudou: trocar de projeto não deve recriar
    // o campo de busca e roubar o foco de quem está digitando.
    refreshDetail() {
        const el = document.getElementById('pj-detail');
        if (el) {
            el.innerHTML = this.renderDetail();
            el.scrollTop = 0;
        }
        document.querySelectorAll('#pj-list .pj-item').forEach(b => {
            const on = b.dataset.id === this.selectedId;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-selected', String(on));
        });
    },

    refreshList() {
        const list = document.getElementById('pj-list');
        const count = document.querySelector('#pj-root .pj-count');
        if (list) list.innerHTML = this.renderList();
        if (count) count.textContent = `${this.visibleProjects().length}/${this.projects.length}`;
    },

    // ================================================
    // INTERAÇÃO
    // ================================================

    select(id, { scroll = false } = {}) {
        if (!id || id === this.selectedId) return;
        this.selectedId = id;
        this.shotIndex = 0;
        this.refreshDetail();

        if (scroll) {
            document.querySelector(`#pj-list .pj-item[data-id="${CSS.escape(id)}"]`)
                ?.scrollIntoView({ block: 'nearest' });
        }
    },

    // ↑/↓ e j/k percorrem a lista sem tirar a mão do teclado — que é como
    // se navega em qualquer coisa parecida com isto.
    step(delta) {
        const list = this.visibleProjects();
        if (!list.length) return;
        const i = list.findIndex(p => p.id === this.selectedId);
        const next = list[Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i + delta)))];
        this.select(next.id, { scroll: true });
    },

    stepShot(delta) {
        const p = this.selected();
        if (!p || p.images.length < 2) return;
        const n = p.images.length;
        this.shotIndex = (this.shotIndex + delta + n) % n;
        this.refreshDetail();
    },

    applyFilter(term) {
        this.filter = term;
        this.buildGroups();

        // Se o projeto aberto sumiu do filtro, abre o primeiro que sobrou.
        const visible = this.visibleProjects();
        if (visible.length && !visible.some(p => p.id === this.selectedId)) {
            this.selectedId = visible[0].id;
            this.shotIndex = 0;
            this.refreshDetail();
        }
        this.refreshList();
    },

    bindEvents() {
        const root = document.getElementById('pj-root');
        if (!root) return;

        // render() pode rodar mais de uma vez na vida da janela; sem isto,
        // cada passada empilharia mais um listener global de teclado.
        this.cleanup();

        const search = document.getElementById('pj-search');
        search?.addEventListener('input', (e) => this.applyFilter(e.target.value));

        root.addEventListener('click', (e) => {
            const item = e.target.closest('.pj-item');
            if (item) { this.select(item.dataset.id); return; }

            const nav = e.target.closest('.pj-shot-nav');
            if (nav) { this.stepShot(Number(nav.dataset.step)); return; }

            // Clicar numa tecnologia filtra por ela: o estado vai para a
            // busca, então dá para ver e desfazer o que foi aplicado.
            const tech = e.target.closest('.pj-tech');
            if (tech && search) {
                search.value = tech.dataset.tech;
                this.applyFilter(tech.dataset.tech);
                search.focus();
            }
        });

        this.keyHandler = (e) => {
            if (!document.getElementById('pj-root')) return;
            if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;

            const typing = document.activeElement === search;

            if (e.key === 'ArrowDown' || (!typing && e.key === 'j')) { e.preventDefault(); this.step(1); }
            else if (e.key === 'ArrowUp' || (!typing && e.key === 'k')) { e.preventDefault(); this.step(-1); }
            else if (e.key === 'ArrowLeft' && !typing) { this.stepShot(-1); }
            else if (e.key === 'ArrowRight' && !typing) { this.stepShot(1); }
            else if (e.key === 'Escape' && typing && search.value) {
                search.value = '';
                this.applyFilter('');
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    },

    cleanup() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }
};
