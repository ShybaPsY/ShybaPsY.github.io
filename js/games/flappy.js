// ================================================
// FLAPPY — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startFlappy() {
    this.adjustWindowSize('flappy');
    const container = document.getElementById('games-content');
    container.className = 'game-canvas-container';
    container.innerHTML = `<div class="game-score">Score: <span id="flappy-score">0</span></div><canvas id="flappy-canvas" class="game-canvas"></canvas><button class="game-back-btn" id="game-back">Back</button>`;
    const canvas = document.getElementById('flappy-canvas');
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
        const scoreHeight = 50, buttonHeight = 55, padding = 16;
        const availableWidth = container.clientWidth - padding;
        const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
        if (availableWidth > 0 && availableHeight > 0) {
            canvas.width = Math.max(250, Math.min(availableWidth, 450));
            canvas.height = Math.max(350, Math.min(availableHeight, 550));
        }
    };
    resizeCanvas();
    if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }

    const bird = { x: 60, y: 0, velocity: 0, size: 28 };
    const gravity = 0.45, jumpForce = -7.5;
    const pipes = [], pipeWidth = 55, pipeGap = 130;
    const groundHeight = 40;
    let score = 0, gameOver = false, started = false;
    let wingAngle = 0, clouds = [];

    // Initialize bird Y and clouds
    bird.y = canvas.height / 2;
    for (let i = 0; i < 4; i++) {
        clouds.push({ x: Math.random() * canvas.width, y: 30 + Math.random() * 80, size: 20 + Math.random() * 30 });
    }

    const drawBird = (x, y, size, vel) => {
        // Wing flap animation based on velocity
        wingAngle = Math.sin(Date.now() / 80) * 0.4;
        if (vel < -2) wingAngle = 0.6;  // Wings up when jumping
        if (vel > 3) wingAngle = -0.3; // Wings down when falling

        const rotation = Math.min(Math.max(vel * 0.05, -0.5), 0.7);

        ctx.save();
        ctx.translate(x + size / 2, y + size / 2);
        ctx.rotate(rotation);

        // Body
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#FFA500';
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.beginPath();
        ctx.ellipse(-size * 0.1, size * 0.1, size * 0.35, size * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Tail
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(-size * 0.45, -size * 0.1);
        ctx.lineTo(-size * 0.7, -size * 0.25);
        ctx.lineTo(-size * 0.7, size * 0.15);
        ctx.lineTo(-size * 0.45, size * 0.05);
        ctx.fill();

        // Eye white
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(size * 0.2, -size * 0.1, size * 0.18, 0, Math.PI * 2);
        ctx.fill();

        // Eye pupil
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(size * 0.25, -size * 0.1, size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlight
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(size * 0.22, -size * 0.14, size * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FF6347';
        ctx.beginPath();
        ctx.moveTo(size * 0.4, -size * 0.05);
        ctx.lineTo(size * 0.7, size * 0.05);
        ctx.lineTo(size * 0.4, size * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    };

    const drawPipe = (x, topHeight) => {
        const capHeight = 25;
        const capOverhang = 8;

        // Top pipe
        const gradient1 = ctx.createLinearGradient(x, 0, x + pipeWidth, 0);
        gradient1.addColorStop(0, '#228B22');
        gradient1.addColorStop(0.5, '#32CD32');
        gradient1.addColorStop(1, '#228B22');
        ctx.fillStyle = gradient1;
        ctx.fillRect(x, 0, pipeWidth, topHeight - capHeight);

        // Top pipe cap
        ctx.fillStyle = '#2E8B2E';
        ctx.fillRect(x - capOverhang, topHeight - capHeight, pipeWidth + capOverhang * 2, capHeight);
        ctx.fillStyle = '#3CB371';
        ctx.fillRect(x - capOverhang, topHeight - capHeight, pipeWidth + capOverhang * 2, 5);

        // Bottom pipe
        const bottomY = topHeight + pipeGap;
        ctx.fillStyle = gradient1;
        ctx.fillRect(x, bottomY + capHeight, pipeWidth, canvas.height - bottomY - groundHeight);

        // Bottom pipe cap
        ctx.fillStyle = '#2E8B2E';
        ctx.fillRect(x - capOverhang, bottomY, pipeWidth + capOverhang * 2, capHeight);
        ctx.fillStyle = '#3CB371';
        ctx.fillRect(x - capOverhang, bottomY + capHeight - 5, pipeWidth + capOverhang * 2, 5);
    };

    const drawCloud = (x, y, size) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.9, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    };

    const jump = () => { if (gameOver) return; if (!started) started = true; bird.velocity = jumpForce; };
    const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    const handleClick = () => jump();
    document.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);
    this.keyHandler = handleKey;

    const spawnPipe = () => {
        const minHeight = 60;
        const maxHeight = canvas.height - pipeGap - minHeight - groundHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        pipes.push({ x: canvas.width, topHeight: topHeight, passed: false });
    };

    const showEndScreen = () => {
        gameOver = true;
        clearInterval(this.gameLoop);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.getColor('--red');
        ctx.font = 'bold 28px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillStyle = this.getColor('--yellow');
        ctx.font = '20px "Fira Code", monospace';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillStyle = this.getColor('--comment');
        ctx.font = '14px "Fira Code", monospace';
        ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + 50);
    };

    const update = () => {
        if (gameOver || !started) return;
        bird.velocity += gravity;
        bird.y += bird.velocity;
        if (bird.y < 0 || bird.y + bird.size > canvas.height - groundHeight) { showEndScreen(); return; }
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 3.5;
            if (bird.x + bird.size * 0.4 > pipes[i].x && bird.x - bird.size * 0.3 < pipes[i].x + pipeWidth) {
                if (bird.y - bird.size * 0.3 < pipes[i].topHeight || bird.y + bird.size * 0.3 > pipes[i].topHeight + pipeGap) {
                    showEndScreen(); return;
                }
            }
            if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
                pipes[i].passed = true;
                score++;
                document.getElementById('flappy-score').textContent = score;
            }
            if (pipes[i].x + pipeWidth < 0) { pipes.splice(i, 1); }
        }
        clouds.forEach(c => { c.x -= 0.8; if (c.x + c.size < 0) { c.x = canvas.width + c.size; c.y = 30 + Math.random() * 80; } });
    };

    const draw = () => {
        if (gameOver) return;

        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#1e3c72');
        skyGradient.addColorStop(0.5, '#2a5298');
        skyGradient.addColorStop(1, '#1e3c72');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clouds
        clouds.forEach(c => drawCloud(c.x, c.y, c.size));

        // Pipes
        pipes.forEach(pipe => drawPipe(pipe.x, pipe.topHeight));

        // Ground
        const groundGradient = ctx.createLinearGradient(0, canvas.height - groundHeight, 0, canvas.height);
        groundGradient.addColorStop(0, '#8B4513');
        groundGradient.addColorStop(0.3, '#654321');
        groundGradient.addColorStop(1, '#3d2817');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

        // Ground grass
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 8);
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, 3);

        // Bird
        drawBird(bird.x, bird.y, bird.size, bird.velocity);

        if (!started) {
            ctx.fillStyle = this.getColor('--foreground');
            ctx.font = '16px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE or Click to start', canvas.width / 2, canvas.height / 2);
        }
    };

    let frameCount = 0;
    this.gameLoop = setInterval(() => { update(); draw(); frameCount++; if (started && !gameOver && frameCount % 100 === 0) { spawnPipe(); } }, 1000 / 60);
    document.getElementById('game-back').addEventListener('click', () => { canvas.removeEventListener('click', handleClick); this.showMenu(); });
}
