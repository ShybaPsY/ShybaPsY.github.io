// ================================================
// BREAKOUT — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startBreakout() {
    this.adjustWindowSize('breakout');
    const container = document.getElementById('games-content');
    container.className = 'game-canvas-container';
    container.innerHTML = `
        <div class="game-score">Score: <span id="breakout-score">0</span></div>
        <canvas id="breakout-canvas" class="game-canvas"></canvas>
        <button class="game-back-btn" id="game-back">Back</button>
    `;

    const canvas = document.getElementById('breakout-canvas');
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
        const scoreHeight = 30, buttonHeight = 45, padding = 20;
        const w = container.clientWidth - padding;
        const h = container.clientHeight - scoreHeight - buttonHeight - padding;
        if (w > 0 && h > 0) {
            canvas.width = Math.max(200, w);
            canvas.height = Math.max(150, h);
        }
    };
    resizeCanvas();

    if (window.ResizeObserver) {
        const debouncedResize = this.debounce(resizeCanvas);
        this.resizeObserver = new ResizeObserver(debouncedResize);
        this.resizeObserver.observe(container);
    }

    const BRICK_ROWS = 5, BRICK_COLS = 8;
    let paddleX = 0.5, ballX = 0.5, ballY = 0.8, ballDX = 0.01, ballDY = -0.012;
    let score = 0, lives = 3, gameOver = false;
    let bricks = [];

    const initBricks = () => {
        bricks = [];
        const colors = ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3'];
        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                bricks.push({ x: c / BRICK_COLS + 0.01, y: r * 0.05 + 0.05, w: 1 / BRICK_COLS - 0.02, h: 0.04, color: colors[r], alive: true });
            }
        }
    };
    initBricks();

    const keysPressed = { left: false, right: false };

    const handleKeyDown = (e) => { if (e.key === 'ArrowLeft') keysPressed.left = true; if (e.key === 'ArrowRight') keysPressed.right = true; e.preventDefault(); };
    const handleKeyUp = (e) => { if (e.key === 'ArrowLeft') keysPressed.left = false; if (e.key === 'ArrowRight') keysPressed.right = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    this.keyHandler = handleKeyDown;
    this.keyUpHandler = handleKeyUp;

    const showEnd = (won) => {
        gameOver = true;
        clearInterval(this.gameLoop);
        const size = Math.min(canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = won ? this.getColor('--green') : this.getColor('--red');
        ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.05);
    };

    const gameLoop = () => {
        if (gameOver) return;

        const paddleW = 0.15, paddleH = 0.02, ballR = 0.012;
        const speed = 0.02;

        if (keysPressed.left) paddleX = Math.max(paddleW / 2, paddleX - speed);
        if (keysPressed.right) paddleX = Math.min(1 - paddleW / 2, paddleX + speed);

        ballX += ballDX; ballY += ballDY;

        if (ballX < ballR || ballX > 1 - ballR) ballDX = -ballDX;
        if (ballY < ballR) ballDY = -ballDY;

        if (ballY > 0.95 - ballR && ballX > paddleX - paddleW / 2 && ballX < paddleX + paddleW / 2) {
            ballDY = -Math.abs(ballDY);
            ballDX = (ballX - paddleX) / (paddleW / 2) * 0.015;
        }

        if (ballY > 1) {
            lives--;
            if (lives <= 0) { showEnd(false); return; }
            ballX = 0.5; ballY = 0.8; ballDX = 0.01; ballDY = -0.012;
        }

        bricks.forEach(b => {
            if (b.alive && ballX > b.x && ballX < b.x + b.w && ballY > b.y && ballY < b.y + b.h) {
                b.alive = false; ballDY = -ballDY; score += 10;
                document.getElementById('breakout-score').textContent = score;
            }
        });

        if (bricks.every(b => !b.alive)) { showEnd(true); return; }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        bricks.forEach(b => { if (b.alive) { ctx.fillStyle = b.color; ctx.fillRect(b.x * canvas.width, b.y * canvas.height, b.w * canvas.width, b.h * canvas.height); } });

        ctx.fillStyle = this.getColor('--cyan');
        ctx.fillRect((paddleX - paddleW / 2) * canvas.width, 0.95 * canvas.height, paddleW * canvas.width, paddleH * canvas.height);

        ctx.fillStyle = this.getColor('--yellow');
        ctx.beginPath();
        ctx.arc(ballX * canvas.width, ballY * canvas.height, ballR * Math.min(canvas.width, canvas.height), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.getColor('--foreground');
        ctx.font = `${canvas.height * 0.04}px 'Fira Code', monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`Lives: ${lives}`, 10, canvas.height - 10);
    };

    this.gameLoop = setInterval(gameLoop, 16);
    document.getElementById('game-back').addEventListener('click', () => this.showMenu());
}
