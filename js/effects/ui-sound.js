// ================================================
// UI SOUND
//
// Estalos curtos sintetizados na hora, sem nenhum arquivo de áudio: são
// dois osciladores com envelope de 45ms, o que soa como bloco encaixando
// e pesa zero no carregamento da página.
//
// Duas regras que valem para tudo aqui:
//
//   1. O AudioContext só nasce depois de um gesto do usuário. Navegador
//      nenhum deixa tocar antes disso, e o boot já tem o gesto certo: a
//      escolha do idioma.
//   2. Som em site é coisa que irrita fácil. O volume é baixo de
//      propósito, os estalos duram menos de 50ms, e existe um botão de
//      mudo na bandeja que fica guardado entre visitas.
// ================================================

export const UiSound = {
    STORAGE_KEY: 'ui-sound',
    ctx: null,
    master: null,
    enabled: true,

    init() {
        try {
            this.enabled = localStorage.getItem(this.STORAGE_KEY) !== 'off';
        } catch (err) { /* localStorage indisponível */ }

        // Não usa { once: true }: se a aba perder o foco o contexto é
        // suspenso, e o próximo gesto precisa poder retomá-lo.
        const unlock = () => this.ensure();
        document.addEventListener('pointerdown', unlock, { capture: true });
        document.addEventListener('keydown', unlock, { capture: true });
    },

    ensure() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
            return this.ctx;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;

        try {
            this.ctx = new AC();
        } catch (err) {
            return null;
        }

        this.master = this.ctx.createGain();
        this.master.gain.value = 0.045;   // baixo: é ruído de interface, não trilha
        this.master.connect(this.ctx.destination);
        return this.ctx;
    },

    setEnabled(on) {
        this.enabled = !!on;
        try {
            localStorage.setItem(this.STORAGE_KEY, on ? 'on' : 'off');
        } catch (err) { /* localStorage indisponível */ }
        return this.enabled;
    },

    toggle() {
        return this.setEnabled(!this.enabled);
    },

    // Um estalo. `pitch` desloca a frequência (variar um pouco entre as
    // chamadas evita o efeito de metralhadora), `gain` é o volume relativo.
    click(pitch = 1, gain = 1) {
        if (!this.enabled) return;
        const ctx = this.ensure();
        if (!ctx || ctx.state !== 'running') return;

        const t = ctx.currentTime;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(Math.min(1, gain), t + 0.002);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        env.connect(this.master);

        // O corpo do estalo: queda rápida de tom é o que dá a sensação de
        // algo sólido batendo, em vez de um bipe.
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500 * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(430 * pitch, t + 0.03);
        osc.connect(env);
        osc.start(t);
        osc.stop(t + 0.06);

        // Uma quinta acima, bem mais baixa: dá o "tec" do encaixe.
        const top = ctx.createOscillator();
        const topEnv = ctx.createGain();
        top.type = 'square';
        top.frequency.setValueAtTime(2600 * pitch, t);
        topEnv.gain.setValueAtTime(0.22 * Math.min(1, gain), t);
        topEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
        top.connect(topEnv).connect(this.master);
        top.start(t);
        top.stop(t + 0.02);
    }
};
