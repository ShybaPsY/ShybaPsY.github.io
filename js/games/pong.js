// ================================================
// PONG — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startPong() {
    this.adjustWindowSize('pong');
    const container = document.getElementById('games-content');
    container.className = 'game-canvas-container';
    container.innerHTML = `
        <div class="game-score"><span id="player-score">0</span> - <span id="ai-score">0</span></div>
        <canvas id="pong-canvas" class="game-canvas"></canvas>
        <button class="game-back-btn" id="game-back">Back</button>
    `;

    const canvas = document.getElementById('pong-canvas');
    const ctx = canvas.getContext('2d');
    const winScore = 5;

    const getPaddleHeight = () => canvas.height * 0.15;
    const getPaddleWidth = () => Math.max(8, canvas.width * 0.02);
    const getBallRadius = () => Math.max(5, Math.min(canvas.width, canvas.height) * 0.015);
    const getPlayerSpeed = () => canvas.height * 0.015;

    let playerYRatio = 0.5, aiYRatio = 0.5;
    let ballXRatio = 0.5, ballYRatio = 0.5, ballDXRatio = 0, ballDYRatio = 0;
    let playerScore = 0, aiScore = 0, gameOver = false;
    let speedMultiplier = 1, aiSpeedMultiplier = 0.7;
    const keysPressed = { up: false, down: false };

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

    const resetBall = (towardsPlayer = Math.random() > 0.5) => {
        ballXRatio = 0.5; ballYRatio = 0.5;
        const angle = (Math.random() - 0.5) * Math.PI / 2;
        const initialSpeed = 0.008;
        ballDXRatio = Math.cos(angle) * initialSpeed * (towardsPlayer ? -1 : 1);
        ballDYRatio = Math.sin(angle) * initialSpeed;
        speedMultiplier = 1;
    };
    resetBall();

    const showEndScreen = (playerWon) => {
        gameOver = true;
        clearInterval(this.gameLoop);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = playerWon ? this.getColor('--green') : this.getColor('--red');
        ctx.font = `bold ${canvas.height / 8}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(playerWon ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = this.getColor('--foreground');
        ctx.font = `${canvas.height / 12}px 'Fira Code', monospace`;
        ctx.fillText(`${playerScore} - ${aiScore}`, canvas.width / 2, canvas.height / 2 + 25);
    };

    const handleKeyDown = (e) => {
        if (gameOver) return;
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { keysPressed.up = true; e.preventDefault(); }
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { keysPressed.down = true; e.preventDefault(); }
    };
    const handleKeyUp = (e) => {
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keysPressed.up = false;
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keysPressed.down = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    this.keyHandler = handleKeyDown;
    this.keyUpHandler = handleKeyUp;

    const gameLoop = () => {
        if (gameOver) return;

        const paddleHeight = getPaddleHeight();
        const paddleWidth = getPaddleWidth();
        const ballRadius = getBallRadius();
        const playerSpeed = getPlayerSpeed();
        const aiSpeed = playerSpeed * aiSpeedMultiplier;

        let playerY = playerYRatio * (canvas.height - paddleHeight);
        let aiY = aiYRatio * (canvas.height - paddleHeight);
        let ballX = ballXRatio * canvas.width;
        let ballY = ballYRatio * canvas.height;

        if (keysPressed.up) playerY = Math.max(0, playerY - playerSpeed);
        if (keysPressed.down) playerY = Math.min(canvas.height - paddleHeight, playerY + playerSpeed);
        playerYRatio = playerY / (canvas.height - paddleHeight);

        ballX += ballDXRatio * canvas.width * speedMultiplier;
        ballY += ballDYRatio * canvas.height * speedMultiplier;

        if (ballY - ballRadius <= 0) { ballDYRatio = Math.abs(ballDYRatio); ballY = ballRadius; }
        if (ballY + ballRadius >= canvas.height) { ballDYRatio = -Math.abs(ballDYRatio); ballY = canvas.height - ballRadius; }

        const aiCenter = aiY + paddleHeight / 2;
        const deadZone = paddleHeight * 0.2;
        if (aiCenter < ballY - deadZone) aiY = Math.min(canvas.height - paddleHeight, aiY + aiSpeed);
        else if (aiCenter > ballY + deadZone) aiY = Math.max(0, aiY - aiSpeed);
        aiYRatio = aiY / (canvas.height - paddleHeight);

        if (ballX - ballRadius <= paddleWidth + 5 && ballY >= playerY && ballY <= playerY + paddleHeight && ballDXRatio < 0) {
            const hitPos = (ballY - playerY) / paddleHeight;
            const angle = (hitPos - 0.5) * Math.PI / 3;
            const baseSpeed = 0.008;
            ballDXRatio = Math.cos(angle) * baseSpeed;
            ballDYRatio = Math.sin(angle) * baseSpeed;
            speedMultiplier = Math.min(2.5, speedMultiplier + 0.12);
            ballX = paddleWidth + 5 + ballRadius;
        }

        if (ballX + ballRadius >= canvas.width - paddleWidth - 5 && ballY >= aiY && ballY <= aiY + paddleHeight && ballDXRatio > 0) {
            const hitPos = (ballY - aiY) / paddleHeight;
            const angle = (hitPos - 0.5) * Math.PI / 3;
            const baseSpeed = 0.008;
            ballDXRatio = -Math.cos(angle) * baseSpeed;
            ballDYRatio = Math.sin(angle) * baseSpeed;
            speedMultiplier = Math.min(2.5, speedMultiplier + 0.12);
            ballX = canvas.width - paddleWidth - 5 - ballRadius;
        }

        ballXRatio = ballX / canvas.width;
        ballYRatio = ballY / canvas.height;

        if (ballX - ballRadius <= 0) {
            aiScore++;
            document.getElementById('ai-score').textContent = aiScore;
            if (aiScore >= winScore) { showEndScreen(false); return; }
            resetBall(true);
        }

        if (ballX + ballRadius >= canvas.width) {
            playerScore++;
            document.getElementById('player-score').textContent = playerScore;
            if (playerScore >= winScore) { showEndScreen(true); return; }
            aiSpeedMultiplier = Math.min(0.95, aiSpeedMultiplier + 0.05);
            resetBall(false);
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.setLineDash([canvas.height * 0.03, canvas.height * 0.03]);
        ctx.lineWidth = Math.max(2, canvas.width * 0.004);
        ctx.strokeStyle = this.getColor('--comment');
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        const cornerRadius = Math.min(paddleWidth / 2, 6);
        ctx.fillStyle = this.getColor('--cyan');
        ctx.beginPath();
        ctx.roundRect(5, playerY, paddleWidth, paddleHeight, cornerRadius);
        ctx.fill();

        ctx.fillStyle = this.getColor('--red');
        ctx.beginPath();
        ctx.roundRect(canvas.width - paddleWidth - 5, aiY, paddleWidth, paddleHeight, cornerRadius);
        ctx.fill();

        ctx.shadowBlur = ballRadius * 2;
        ctx.shadowColor = this.getColor('--yellow');
        ctx.fillStyle = this.getColor('--yellow');
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    };

    this.gameLoop = setInterval(gameLoop, 16);
    document.getElementById('game-back').addEventListener('click', () => this.showMenu());
}
