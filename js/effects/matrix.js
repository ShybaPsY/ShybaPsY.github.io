// ================================================
// MATRIX EFFECT MODULE
// ================================================

export const MatrixEffect = {
    isRunning: false,
    animationId: null,
    canvas: null,
    cleanup: null,

    start() {
        if (this.isRunning) return false;
        this.isRunning = true;

        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('matrix-canvas-local');
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.insertBefore(this.canvas, desktop.firstChild);
        } else {
            document.body.appendChild(this.canvas);
        }

        const ctx = this.canvas.getContext('2d');
        const characters = '\u30a2\u30a1\u30ab\u30b5\u30bf\u30ca\u30cf\u30de\u30e4\u30e3\u30e9\u30ef\u30ac\u30b6\u30c0\u30d0\u30d1\u30a4\u30a3\u30ad\u30b7\u30c1\u30cb\u30d2\u30df\u30ea\u30f0\u30ae\u30b8\u30c2\u30d3\u30d4\u30a6\u30a5\u30af\u30b9\u30c4\u30cc\u30d5\u30e0\u30e6\u30e5\u30eb\u30b0\u30ba\u30d6\u30d7\u30a8\u30a7\u30b1\u30bb\u30c6\u30cd\u30d8\u30e1\u30ec\u30f1\u30b2\u30bc\u30c7\u30d9\u30da\u30aa\u30a9\u30b3\u30bd\u30c8\u30ce\u30db\u30e2\u30e8\u30e7\u30ed\u30f2\u30b4\u30be\u30c9\u30dc\u30dd\u30f4\u30c3\u30f3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const fontSize = 16;
        let columns = 0;
        let drops = [];

        const handleResize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            columns = Math.floor(this.canvas.width / fontSize);
            drops = Array(columns).fill(1);
        };

        let lastDraw = 0;
        const frameInterval = 40;

        const draw = (timestamp = 0) => {
            if (timestamp - lastDraw < frameInterval) {
                this.animationId = requestAnimationFrame(draw);
                return;
            }
            lastDraw = timestamp;

            ctx.fillStyle = 'rgba(26, 27, 38, 0.06)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > this.canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            this.animationId = requestAnimationFrame(draw);
        };

        handleResize();
        this.animationId = requestAnimationFrame(draw);
        window.addEventListener('resize', handleResize);

        this.cleanup = () => {
            cancelAnimationFrame(this.animationId);
            window.removeEventListener('resize', handleResize);
            if (this.canvas && this.canvas.parentNode) this.canvas.remove();
            this.canvas = null;
            this.animationId = null;
            this.isRunning = false;
        };

        return true;
    },

    stop() {
        if (!this.isRunning) return;
        if (typeof this.cleanup === 'function') {
            this.cleanup();
            this.cleanup = null;
        } else {
            this.isRunning = false;
        }
    }
};
