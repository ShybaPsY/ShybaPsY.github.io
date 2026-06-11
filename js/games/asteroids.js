// ================================================
// ASTEROIDS — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startAsteroids() {
    this.adjustWindowSize('asteroids');
    const container = document.getElementById('games-content');
    container.className = 'game-canvas-container';
    container.innerHTML = `<div class="game-score">Score: <span id="asteroids-score">0</span></div><canvas id="asteroids-canvas" class="game-canvas"></canvas><button class="game-back-btn" id="game-back">Back</button>`;
    const canvas = document.getElementById('asteroids-canvas');
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => { const scoreHeight = 30, buttonHeight = 45, padding = 20; const w = container.clientWidth - padding; const h = container.clientHeight - scoreHeight - buttonHeight - padding; if (w > 0 && h > 0) { canvas.width = Math.max(200, w); canvas.height = Math.max(150, h); } };
    resizeCanvas();
    if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }
    let ship = { x: 0.5, y: 0.5, angle: -Math.PI / 2, dx: 0, dy: 0 };
    let bullets = [], asteroids = [], score = 0, gameOver = false, lives = 3;
    const keysPressed = { left: false, right: false, up: false, space: false };
    let canShoot = true;
    const spawnAsteroids = (count) => { for (let i = 0; i < count; i++) { asteroids.push({ x: Math.random(), y: Math.random(), dx: (Math.random() - 0.5) * 0.008, dy: (Math.random() - 0.5) * 0.008, size: 0.06 + Math.random() * 0.04 }); } };
    spawnAsteroids(5);
    const handleKeyDown = (e) => { if (e.key === 'ArrowLeft') keysPressed.left = true; if (e.key === 'ArrowRight') keysPressed.right = true; if (e.key === 'ArrowUp') keysPressed.up = true; if (e.key === ' ') { keysPressed.space = true; e.preventDefault(); } };
    const handleKeyUp = (e) => { if (e.key === 'ArrowLeft') keysPressed.left = false; if (e.key === 'ArrowRight') keysPressed.right = false; if (e.key === 'ArrowUp') keysPressed.up = false; if (e.key === ' ') keysPressed.space = false; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    this.keyHandler = handleKeyDown; this.keyUpHandler = handleKeyUp;
    const showEnd = () => { gameOver = true; clearInterval(this.gameLoop); ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = this.getColor('--red'); ctx.font = `bold ${Math.min(canvas.width, canvas.height) * 0.12}px 'Fira Code', monospace`; ctx.textAlign = 'center'; ctx.fillText('YOU LOSE', canvas.width / 2, canvas.height / 2 - 20); ctx.fillStyle = this.getColor('--foreground'); ctx.font = `${Math.min(canvas.width, canvas.height) * 0.06}px 'Fira Code', monospace`; ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20); };
    const gameLoop = () => {
        if (gameOver) return;
        if (keysPressed.left) ship.angle -= 0.08; if (keysPressed.right) ship.angle += 0.08;
        if (keysPressed.up) { ship.dx += Math.cos(ship.angle) * 0.0005; ship.dy += Math.sin(ship.angle) * 0.0005; }
        if (keysPressed.space && canShoot) { bullets.push({ x: ship.x, y: ship.y, dx: Math.cos(ship.angle) * 0.02, dy: Math.sin(ship.angle) * 0.02, life: 50 }); canShoot = false; setTimeout(() => canShoot = true, 200); }
        ship.x += ship.dx; ship.y += ship.dy; ship.dx *= 0.99; ship.dy *= 0.99;
        if (ship.x < 0) ship.x = 1; if (ship.x > 1) ship.x = 0; if (ship.y < 0) ship.y = 1; if (ship.y > 1) ship.y = 0;
        bullets = bullets.filter(b => { b.x += b.dx; b.y += b.dy; b.life--; return b.life > 0 && b.x > 0 && b.x < 1 && b.y > 0 && b.y < 1; });
        asteroids.forEach(a => { a.x += a.dx; a.y += a.dy; if (a.x < 0) a.x = 1; if (a.x > 1) a.x = 0; if (a.y < 0) a.y = 1; if (a.y > 1) a.y = 0; });
        bullets.forEach(b => { asteroids.forEach((a, i) => { if (Math.hypot(b.x - a.x, b.y - a.y) < a.size) { b.life = 0; if (a.size > 0.04) { asteroids.push({ x: a.x, y: a.y, dx: (Math.random() - 0.5) * 0.01, dy: (Math.random() - 0.5) * 0.01, size: a.size / 2 }); asteroids.push({ x: a.x, y: a.y, dx: (Math.random() - 0.5) * 0.01, dy: (Math.random() - 0.5) * 0.01, size: a.size / 2 }); } asteroids.splice(i, 1); score += 20; document.getElementById('asteroids-score').textContent = score; } }); });
        for (const a of asteroids) { if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.size) { lives--; ship.x = 0.5; ship.y = 0.5; ship.dx = 0; ship.dy = 0; if (lives <= 0) { showEnd(); return; } break; } }
        if (asteroids.length === 0) spawnAsteroids(5 + Math.floor(score / 200));
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.translate(ship.x * canvas.width, ship.y * canvas.height); ctx.rotate(ship.angle); ctx.fillStyle = this.getColor('--cyan'); ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.fillStyle = this.getColor('--yellow'); bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x * canvas.width, b.y * canvas.height, 3, 0, Math.PI * 2); ctx.fill(); });
        ctx.strokeStyle = this.getColor('--foreground'); ctx.lineWidth = 2; asteroids.forEach(a => { ctx.beginPath(); ctx.arc(a.x * canvas.width, a.y * canvas.height, a.size * Math.min(canvas.width, canvas.height), 0, Math.PI * 2); ctx.stroke(); });
        ctx.fillStyle = this.getColor('--foreground'); ctx.font = `${canvas.height * 0.04}px 'Fira Code', monospace`; ctx.textAlign = 'left'; ctx.fillText(`Lives: ${lives}`, 10, canvas.height - 10);
    };
    this.gameLoop = setInterval(gameLoop, 16);
    document.getElementById('game-back').addEventListener('click', () => this.showMenu());
}
