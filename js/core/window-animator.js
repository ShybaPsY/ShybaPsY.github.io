// ================================================
// WINDOW ANIMATOR
//
// Antes, minimizar / maximizar / encaixar animavam left, top, width e
// height por transição CSS. Isso obriga o navegador a refazer o layout
// da janela inteira a cada frame — e numa janela de vidro, com
// backdrop-filter, cada frame também repinta o desfoque. O texto
// refluía durante a animação e o movimento engasgava.
//
// Aqui a técnica é FLIP: mede onde a janela está (First), aplica a
// geometria final de uma vez (Last), inverte com transform para ela
// parecer que não saiu do lugar (Invert) e então anima o transform de
// volta para zero (Play). O layout acontece uma vez só; o resto roda
// no compositor.
//
// Todas as funções devolvem Promise e respeitam prefers-reduced-motion,
// o que também elimina os setTimeout com duração chutada espalhados
// pelo código — quem chama espera o fim de verdade.
// ================================================

import { WindowShatter } from '../effects/window-shatter.js';

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';   // expo-out: pousa devagar
const EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)';

export const WindowAnimator = {
    reducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Uma janela por vez pode estar animando; um segundo clique cancela o
    // anterior em vez de sobrepor duas animações.
    cancel(el) {
        el.getAnimations?.().forEach(a => a.cancel());
    },

    // Durante a animação o desfoque sai de cena: ele é o que mais custa
    // por frame, e ninguém percebe sua ausência em 260ms.
    async run(el, keyframes, options) {
        this.cancel(el);
        el.classList.add('animating');
        try {
            const anim = el.animate(keyframes, { fill: 'both', ...options });
            await anim.finished;
            anim.cancel();
        } catch (err) {
            /* cancelada por outra interação — o estado final já foi aplicado */
        } finally {
            el.classList.remove('animating');
        }
    },

    // FLIP. `mutate` aplica a geometria final; a animação é só transform.
    async flip(el, mutate, { duration = 280, easing = EASE_OUT } = {}) {
        if (this.reducedMotion()) { mutate(); return; }

        const first = el.getBoundingClientRect();
        mutate();
        const last = el.getBoundingClientRect();

        const dx = first.left - last.left;
        const dy = first.top - last.top;
        const sx = last.width ? first.width / last.width : 1;
        const sy = last.height ? first.height / last.height : 1;

        // Nada mudou de fato: não vale gastar um frame com isso.
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 &&
            Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;

        await this.run(el, [
            { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
            { transformOrigin: 'top left', transform: 'translate(0, 0) scale(1, 1)' }
        ], { duration, easing });
    },

    // Voa da posição atual até um retângulo (o botão da taskbar) e some.
    // É o que faz o "minimizar" apontar para onde a janela foi parar, em
    // vez de simplesmente cair para fora da tela.
    async toRect(el, rect, { duration = 300, easing = EASE_IN } = {}) {
        if (this.reducedMotion() || !rect) return;

        const from = el.getBoundingClientRect();
        if (!from.width || !from.height) return;

        const sx = rect.width / from.width;
        const sy = rect.height / from.height;
        const dx = rect.left - from.left;
        const dy = rect.top - from.top;

        await this.run(el, [
            { transformOrigin: 'top left', transform: 'none', opacity: 1 },
            {
                transformOrigin: 'top left',
                transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
                opacity: 0
            }
        ], { duration, easing });
    },

    // O caminho inverso: nasce no botão da taskbar e cresce até a janela.
    async fromRect(el, rect, { duration = 320, easing = EASE_OUT } = {}) {
        // O terminal, ao fechar, fica com opacity 0 inline (ver close()).
        // Reabrir precisa desfazer isso, senão ele volta invisível.
        el.style.opacity = '';

        if (this.reducedMotion() || !rect) return;

        const to = el.getBoundingClientRect();
        if (!to.width || !to.height) return;

        const sx = rect.width / to.width;
        const sy = rect.height / to.height;
        const dx = rect.left - to.left;
        const dy = rect.top - to.top;

        await this.run(el, [
            {
                transformOrigin: 'top left',
                transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
                opacity: 0
            },
            { transformOrigin: 'top left', transform: 'none', opacity: 1 }
        ], { duration, easing });
    },

    // Fechar: uma onda varre a janela das bordas ao centro. Ela não é
    // desenhada por cima da janela — a janela real vai sendo recortada na
    // mesma velocidade, então à frente da onda ela está inteira e atrás
    // dela só sobrou o texto de que era feita.
    //
    // O WindowShatter cuida de esconder o elemento no instante em que o
    // recorte fecha, e fromRect() limpa isso ao reabrir.
    async close(el) {
        if (this.reducedMotion()) return;

        const header = el.querySelector('.app-window-header, #terminal-header');
        await WindowShatter.play(el, header?.offsetHeight || 36);
    },

    // Retângulo do botão desta janela na taskbar, quando existe.
    taskbarRect(appId) {
        const btn = document.querySelector(`.taskbar-window-btn[data-app="${appId}"]`);
        if (!btn) return null;
        const r = btn.getBoundingClientRect();
        return r.width ? r : null;
    },

    // Pequeno impulso no botão quando a janela chega ou sai dele: fecha o
    // laço entre os dois elementos.
    pulseTaskbar(appId) {
        if (this.reducedMotion()) return;
        const btn = document.querySelector(`.taskbar-window-btn[data-app="${appId}"]`);
        if (!btn) return;
        btn.classList.remove('receiving');
        void btn.offsetWidth;
        btn.classList.add('receiving');
        setTimeout(() => btn.classList.remove('receiving'), 420);
    }
};
