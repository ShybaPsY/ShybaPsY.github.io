// ================================================
// INVADERS — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startInvaders() {
    this.adjustWindowSize('invaders');
    const container = document.getElementById('games-content');
    container.className = 'game-canvas-container';
    container.innerHTML = `
        <div class="game-score">Score: <span id="invaders-score">0</span></div>
        <canvas id="invaders-canvas" class="game-canvas"></canvas>
        <button class="game-back-btn" id="game-back">Back</button>
    `;

    const canvas = document.getElementById('invaders-canvas');
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

    if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }

    let playerX = 0.5, score = 0, gameOver = false;
    let bullets = [], enemyBullets = [], enemies = [], enemyDir = 1, enemySpeed = 0.002;
    const keysPressed = { left: false, right: false, space: false };
    let canShoot = true;

    const initEnemies = () => { enemies = []; for (let r = 0; r < 4; r++) { for (let c = 0; c < 8; c++) { enemies.push({ x: 0.1 + c * 0.1, y: 0.1 + r * 0.08, alive: true }); } } };
    initEnemies();

    const handleKeyDown = (e) => { if (e.key === 'ArrowLeft') keysPressed.left = true; if (e.key === 'ArrowRight') keysPressed.right = true; if (e.key === ' ') { keysPressed.space = true; e.preventDefault(); } };
    const handleKeyUp = (e) => { if (e.key === 'ArrowLeft') keysPressed.left = false; if (e.key === 'ArrowRight') keysPressed.right = false; if (e.key === ' ') keysPressed.space = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    this.keyHandler = handleKeyDown;
    this.keyUpHandler = handleKeyUp;

    const showEnd = (won) => {
        gameOver = true; clearInterval(this.gameLoop);
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = won ? this.getColor('--green') : this.getColor('--red');
        ctx.font = `bold ${Math.min(canvas.width, canvas.height) * 0.12}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - 20);
    };

    const gameLoop = () => {
        if (gameOver) return;
        if (keysPressed.left) playerX = Math.max(0.05, playerX - 0.015);
        if (keysPressed.right) playerX = Math.min(0.95, playerX + 0.015);
        if (keysPressed.space && canShoot) { bullets.push({ x: playerX, y: 0.88 }); canShoot = false; setTimeout(() => canShoot = true, 300); }

        bullets = bullets.filter(b => { b.y -= 0.02; return b.y > 0; });
        enemyBullets = enemyBullets.filter(b => { b.y += 0.01; return b.y < 1; });

        let moveDown = false;
        enemies.forEach(e => { if (e.alive) { e.x += enemyDir * enemySpeed; if (e.x < 0.05 || e.x > 0.95) moveDown = true; } });
        if (moveDown) { enemyDir *= -1; enemies.forEach(e => { if (e.alive) e.y += 0.05; }); }

        if (Math.random() < 0.02) { const alive = enemies.filter(e => e.alive); if (alive.length) { const shooter = alive[Math.floor(Math.random() * alive.length)]; enemyBullets.push({ x: shooter.x, y: shooter.y }); } }

        bullets.forEach(b => { enemies.forEach(e => { if (e.alive && Math.abs(b.x - e.x) < 0.04 && Math.abs(b.y - e.y) < 0.04) { e.alive = false; b.y = -1; score += 10; document.getElementById('invaders-score').textContent = score; } }); });
        for (const b of enemyBullets) { if (Math.abs(b.x - playerX) < 0.05 && b.y > 0.85) { showEnd(false); return; } }
        if (enemies.some(e => e.alive && e.y > 0.85)) { showEnd(false); return; }
        if (enemies.every(e => !e.alive)) { showEnd(true); return; }

        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.getColor('--cyan'); ctx.beginPath(); ctx.moveTo(playerX * canvas.width, 0.92 * canvas.height); ctx.lineTo((playerX - 0.03) * canvas.width, 0.98 * canvas.height); ctx.lineTo((playerX + 0.03) * canvas.width, 0.98 * canvas.height); ctx.fill();
        ctx.fillStyle = this.getColor('--green'); enemies.forEach(e => { if (e.alive) ctx.fillRect((e.x - 0.03) * canvas.width, e.y * canvas.height, 0.06 * canvas.width, 0.05 * canvas.height); });
        ctx.fillStyle = this.getColor('--yellow'); bullets.forEach(b => ctx.fillRect(b.x * canvas.width - 2, b.y * canvas.height, 4, 10));
        ctx.fillStyle = this.getColor('--red'); enemyBullets.forEach(b => ctx.fillRect(b.x * canvas.width - 2, b.y * canvas.height, 4, 10));
    };

    this.gameLoop = setInterval(gameLoop, 16);
    document.getElementById('game-back').addEventListener('click', () => this.showMenu());
}
