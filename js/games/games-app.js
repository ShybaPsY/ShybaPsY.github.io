// ================================================
// GAMES APP MODULE
// Contains all mini-games: Snake, Pong, Tetris, Breakout,
// Invaders, Asteroids, Dino, 2048, Flappy, Minesweeper, Memory
// ================================================

export const GamesApp = {
    WindowManager: null,
    AchievementManager: null,
    gameLoop: null,
    keyHandler: null,
    keyUpHandler: null,
    resizeObserver: null,
    resizeTimeout: null,

    // Debounce helper to prevent flickering during resize
    debounce(fn, delay = 50) {
        return (...args) => {
            if (this.resizeTimeout) cancelAnimationFrame(this.resizeTimeout);
            this.resizeTimeout = requestAnimationFrame(() => {
                fn.apply(this, args);
            });
        };
    },

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;

        // Register cleanup handler
        if (WindowManager) {
            WindowManager.registerCleanup('games', () => this.cleanup());
        }
    },

    open() {
        if (!this.WindowManager) return;
        const content = `<div class="games-menu" id="games-content"></div>`;
        this.WindowManager.createWindow('games', 'Mini Games', 500, 550, content);
        this.showMenu();

        if (this.AchievementManager) {
            this.AchievementManager.trackApp('games');
        }
    },

    startGame(gameId) {
        const gameMap = {
            'snake': () => this.startSnake(),
            'pong': () => this.startPong(),
            'tetris': () => this.startTetris(),
            '2048': () => this.start2048(),
            'breakout': () => this.startBreakout(),
            'space-invaders': () => this.startInvaders(),
            'asteroids': () => this.startAsteroids(),
            'dino': () => this.startDino(),
            'flappy': () => this.startFlappy(),
            'minesweeper': () => this.startMinesweeper(),
            'memory': () => this.startMemory()
        };
        if (gameMap[gameId]) {
            gameMap[gameId]();
        }
    },

    showMenu() {
        this.cleanup();
        const container = document.getElementById('games-content');
        if (!container) return;

        container.className = 'games-menu';
        container.innerHTML = `
            <div class="game-option" data-game="snake">
                <div class="game-option-title">🐍 Snake</div>
                <div class="game-option-desc">Arrow keys • Fill the grid!</div>
            </div>
            <div class="game-option" data-game="pong">
                <div class="game-option-title">🏓 Pong</div>
                <div class="game-option-desc">W/S keys • First to 5!</div>
            </div>
            <div class="game-option" data-game="tetris">
                <div class="game-option-title">🧱 Tetris</div>
                <div class="game-option-desc">Arrow keys • Clear lines!</div>
            </div>
            <div class="game-option" data-game="breakout">
                <div class="game-option-title">🧱 Breakout</div>
                <div class="game-option-desc">Mouse/Arrow • Break bricks!</div>
            </div>
            <div class="game-option" data-game="invaders">
                <div class="game-option-title">👾 Invaders</div>
                <div class="game-option-desc">Arrow + Space • Shoot!</div>
            </div>
            <div class="game-option" data-game="asteroids">
                <div class="game-option-title">🚀 Asteroids</div>
                <div class="game-option-desc">Arrows + Space • Survive!</div>
            </div>
            <div class="game-option" data-game="dino">
                <div class="game-option-title">🦖 Dino Run</div>
                <div class="game-option-desc">Space to jump!</div>
            </div>
            <div class="game-option" data-game="2048">
                <div class="game-option-title">🔢 2048</div>
                <div class="game-option-desc">Arrow keys • Merge tiles!</div>
            </div>
            <div class="game-option" data-game="flappy">
                <div class="game-option-title">🐦 Flappy Bird</div>
                <div class="game-option-desc">Space/Click • Fly!</div>
            </div>
            <div class="game-option" data-game="minesweeper">
                <div class="game-option-title">💣 Minesweeper</div>
                <div class="game-option-desc">Click • Find mines!</div>
            </div>
            <div class="game-option" data-game="memory">
                <div class="game-option-title">🃏 Memory</div>
                <div class="game-option-desc">Click • Match pairs!</div>
            </div>
        `;

        container.querySelectorAll('.game-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const game = opt.dataset.game;
                if (game === 'snake') this.startSnake();
                else if (game === 'pong') this.startPong();
                else if (game === 'tetris') this.startTetris();
                else if (game === 'breakout') this.startBreakout();
                else if (game === 'invaders') this.startInvaders();
                else if (game === 'asteroids') this.startAsteroids();
                else if (game === 'dino') this.startDino();
                else if (game === '2048') this.start2048();
                else if (game === 'flappy') this.startFlappy();
                else if (game === 'minesweeper') this.startMinesweeper();
                else if (game === 'memory') this.startMemory();

                if (this.AchievementManager) {
                    this.AchievementManager.check('gamer');
                }
            });
        });
    },

    // Helper to get CSS theme colors
    getColor(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    },

    startSnake() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        container.innerHTML = `
            <div class="game-score">Score: <span id="snake-score">0</span></div>
            <canvas id="snake-canvas" class="game-canvas"></canvas>
            <button class="game-back-btn" id="game-back">Back</button>
        `;

        const canvas = document.getElementById('snake-canvas');
        const ctx = canvas.getContext('2d');
        const tileCount = 15;
        const maxScore = tileCount * tileCount - 1;

        const resizeCanvas = () => {
            const scoreHeight = 30, buttonHeight = 45, padding = 20;
            const availableWidth = container.clientWidth - padding;
            const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
            const size = Math.min(availableWidth, availableHeight);
            if (size > 0) {
                canvas.width = Math.max(150, size);
                canvas.height = Math.max(150, size);
            }
        };
        resizeCanvas();

        if (window.ResizeObserver) {
            const debouncedResize = this.debounce(resizeCanvas);
            this.resizeObserver = new ResizeObserver(debouncedResize);
            this.resizeObserver.observe(container);
        }

        let snake = [{x: 7, y: 7}];
        let food = {x: 10, y: 10};
        let direction = {dx: 0, dy: 0};
        let nextDirection = {dx: 0, dy: 0};
        let score = 0;
        let gameOver = false;

        const spawnFood = () => {
            const emptyCells = [];
            for (let x = 0; x < tileCount; x++) {
                for (let y = 0; y < tileCount; y++) {
                    if (!snake.some(s => s.x === x && s.y === y)) {
                        emptyCells.push({x, y});
                    }
                }
            }
            if (emptyCells.length > 0) {
                food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        };

        const showEndScreen = (won) => {
            gameOver = true;
            clearInterval(this.gameLoop);

            const gridSize = canvas.width / tileCount;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = won ? this.getColor('--green') : this.getColor('--red');
            ctx.font = `bold ${gridSize * 1.5}px 'Fira Code', monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - 20);

            ctx.fillStyle = this.getColor('--foreground');
            ctx.font = `${gridSize}px 'Fira Code', monospace`;
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);

            ctx.font = `${gridSize * 0.7}px 'Fira Code', monospace`;
            ctx.fillStyle = this.getColor('--comment');
            ctx.fillText('Click Back to return', canvas.width / 2, canvas.height / 2 + 50);
        };

        const handleKey = (e) => {
            if (gameOver) return;
            if (e.key === 'ArrowUp' && direction.dy !== 1) { nextDirection = {dx: 0, dy: -1}; }
            else if (e.key === 'ArrowDown' && direction.dy !== -1) { nextDirection = {dx: 0, dy: 1}; }
            else if (e.key === 'ArrowLeft' && direction.dx !== 1) { nextDirection = {dx: -1, dy: 0}; }
            else if (e.key === 'ArrowRight' && direction.dx !== -1) { nextDirection = {dx: 1, dy: 0}; }
        };

        document.addEventListener('keydown', handleKey);
        this.keyHandler = handleKey;

        const gameLoop = () => {
            if (gameOver) return;

            direction = {...nextDirection};
            const gridSize = canvas.width / tileCount;
            const head = {x: snake[0].x + direction.dx, y: snake[0].y + direction.dy};

            if (head.x < 0) head.x = tileCount - 1;
            if (head.x >= tileCount) head.x = 0;
            if (head.y < 0) head.y = tileCount - 1;
            if (head.y >= tileCount) head.y = 0;

            if (snake.some(s => s.x === head.x && s.y === head.y) && (direction.dx !== 0 || direction.dy !== 0)) {
                showEndScreen(false);
                return;
            }

            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score++;
                document.getElementById('snake-score').textContent = score;
                if (score >= maxScore) { showEndScreen(true); return; }
                spawnFood();
            } else {
                snake.pop();
            }

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const greenColor = this.getColor('--green');
            snake.forEach((s, i) => {
                const brightness = 1 - (i / snake.length) * 0.5;
                ctx.fillStyle = i === 0 ? this.getColor('--cyan') : greenColor;
                ctx.globalAlpha = brightness;
                ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2);
            });
            ctx.globalAlpha = 1;

            const pulse = Math.sin(Date.now() / 200) * 0.2 + 0.8;
            ctx.fillStyle = this.getColor('--red');
            const foodSize = (gridSize - 2) * pulse;
            const foodOffset = (gridSize - 2 - foodSize) / 2;
            ctx.fillRect(food.x * gridSize + 1 + foodOffset, food.y * gridSize + 1 + foodOffset, foodSize, foodSize);
        };

        this.gameLoop = setInterval(gameLoop, 120);
        document.getElementById('game-back').addEventListener('click', () => this.showMenu());
    },

    startPong() {
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
    },

    startTetris() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        container.innerHTML = `
            <div class="game-score">Score: <span id="tetris-score">0</span></div>
            <canvas id="tetris-canvas" class="game-canvas"></canvas>
            <button class="game-back-btn" id="game-back">Back</button>
        `;

        const canvas = document.getElementById('tetris-canvas');
        const ctx = canvas.getContext('2d');
        const COLS = 10, ROWS = 20;

        const resizeCanvas = () => {
            const scoreHeight = 30, buttonHeight = 45, padding = 20;
            const availableWidth = container.clientWidth - padding;
            const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
            if (availableWidth > 0 && availableHeight > 0) {
                const cellSize = Math.min(availableWidth / COLS, availableHeight / ROWS);
                canvas.width = cellSize * COLS;
                canvas.height = cellSize * ROWS;
            }
        };
        resizeCanvas();

        if (window.ResizeObserver) {
            const debouncedResize = this.debounce(resizeCanvas);
            this.resizeObserver = new ResizeObserver(debouncedResize);
            this.resizeObserver.observe(container);
        }

        const PIECES = [[[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]]];
        const COLORS = ['#00f5ff', '#ffeb3b', '#e040fb', '#ff9800', '#2196f3', '#4caf50', '#f44336'];

        let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        let score = 0, gameOver = false;
        let piece, pieceX, pieceY, pieceColor;

        const newPiece = () => {
            const idx = Math.floor(Math.random() * PIECES.length);
            piece = PIECES[idx].map(r => [...r]);
            pieceColor = COLORS[idx];
            pieceX = Math.floor(COLS / 2) - Math.floor(piece[0].length / 2);
            pieceY = 0;
            if (collides()) { gameOver = true; showEnd(); }
        };

        const collides = (px = pieceX, py = pieceY, p = piece) => {
            for (let y = 0; y < p.length; y++) {
                for (let x = 0; x < p[y].length; x++) {
                    if (p[y][x] && (px + x < 0 || px + x >= COLS || py + y >= ROWS || (py + y >= 0 && board[py + y][px + x]))) return true;
                }
            }
            return false;
        };

        const merge = () => {
            for (let y = 0; y < piece.length; y++) {
                for (let x = 0; x < piece[y].length; x++) {
                    if (piece[y][x] && pieceY + y >= 0) board[pieceY + y][pieceX + x] = pieceColor;
                }
            }
        };

        const clearLines = () => {
            let lines = 0;
            for (let y = ROWS - 1; y >= 0; y--) {
                if (board[y].every(c => c)) { board.splice(y, 1); board.unshift(Array(COLS).fill(0)); lines++; y++; }
            }
            if (lines) score += [0, 100, 300, 500, 800][lines];
            document.getElementById('tetris-score').textContent = score;
        };

        const rotate = () => {
            const rotated = piece[0].map((_, i) => piece.map(r => r[i]).reverse());
            if (!collides(pieceX, pieceY, rotated)) piece = rotated;
        };

        const showEnd = () => {
            clearInterval(this.gameLoop);
            const size = Math.min(canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = this.getColor('--red');
            ctx.font = `bold ${size * 0.1}px 'Fira Code', monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.05);
            ctx.fillStyle = this.getColor('--foreground');
            ctx.font = `${size * 0.06}px 'Fira Code', monospace`;
            ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.05);
        };

        const handleKey = (e) => {
            if (gameOver) return;
            if (e.key === 'ArrowLeft' && !collides(pieceX - 1, pieceY)) pieceX--;
            else if (e.key === 'ArrowRight' && !collides(pieceX + 1, pieceY)) pieceX++;
            else if (e.key === 'ArrowDown' && !collides(pieceX, pieceY + 1)) pieceY++;
            else if (e.key === 'ArrowUp') rotate();
            e.preventDefault();
        };
        document.addEventListener('keydown', handleKey);
        this.keyHandler = handleKey;

        newPiece();
        let dropCounter = 0;
        const gameLoop = () => {
            if (gameOver) return;
            dropCounter++;
            if (dropCounter > 30) {
                dropCounter = 0;
                if (!collides(pieceX, pieceY + 1)) pieceY++;
                else { merge(); clearLines(); newPiece(); if (gameOver) return; }
            }

            const cellW = canvas.width / COLS, cellH = canvas.height / ROWS;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    if (board[y][x]) { ctx.fillStyle = board[y][x]; ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2); }
                }
            }

            ctx.fillStyle = pieceColor;
            for (let y = 0; y < piece.length; y++) {
                for (let x = 0; x < piece[y].length; x++) {
                    if (piece[y][x]) ctx.fillRect((pieceX + x) * cellW + 1, (pieceY + y) * cellH + 1, cellW - 2, cellH - 2);
                }
            }

            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cellW, 0); ctx.lineTo(x * cellW, canvas.height); ctx.stroke(); }
            for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellH); ctx.lineTo(canvas.width, y * cellH); ctx.stroke(); }
        };

        this.gameLoop = setInterval(gameLoop, 16);
        document.getElementById('game-back').addEventListener('click', () => this.showMenu());
    },

    startBreakout() {
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
    },

    startInvaders() {
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
    },

    startAsteroids() {
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
    },

    startDino() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        container.innerHTML = `<div class="game-score">Score: <span id="dino-score">0</span></div><canvas id="dino-canvas" class="game-canvas"></canvas><button class="game-back-btn" id="game-back">Back</button>`;
        const canvas = document.getElementById('dino-canvas');
        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => { const scoreHeight = 30, buttonHeight = 45, padding = 20; const w = container.clientWidth - padding; const h = container.clientHeight - scoreHeight - buttonHeight - padding; if (w > 0 && h > 0) { canvas.width = Math.max(200, w); canvas.height = Math.max(150, h); } };
        resizeCanvas();
        if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }
        const groundY = () => canvas.height * 0.8;
        const dinoSize = () => canvas.height * 0.12;
        let dinoY = 0, velocityY = 0, isJumping = false, obstacles = [], score = 0, gameOver = false, speed = 5;
        const handleKey = (e) => { if ((e.key === ' ' || e.key === 'ArrowUp') && !isJumping && !gameOver) { velocityY = -canvas.height * 0.035; isJumping = true; e.preventDefault(); } if (gameOver && e.key === ' ') { dinoY = 0; velocityY = 0; isJumping = false; obstacles = []; score = 0; gameOver = false; speed = 5; } };
        document.addEventListener('keydown', handleKey);
        this.keyHandler = handleKey;
        const showEnd = () => { gameOver = true; const size = Math.min(canvas.width, canvas.height); ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = this.getColor('--red'); ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`; ctx.textAlign = 'center'; ctx.fillText('YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.08); ctx.fillStyle = this.getColor('--foreground'); ctx.font = `${size * 0.06}px 'Fira Code', monospace`; ctx.fillText(`Score: ${Math.floor(score / 10)}`, canvas.width / 2, canvas.height / 2 + size * 0.02); ctx.fillStyle = this.getColor('--comment'); ctx.font = `${size * 0.04}px 'Fira Code', monospace`; ctx.fillText('SPACE to restart or Back to return', canvas.width / 2, canvas.height / 2 + size * 0.12); };
        const gameLoop = () => {
            if (gameOver) return;
            velocityY += canvas.height * 0.002; dinoY += velocityY; if (dinoY >= 0) { dinoY = 0; isJumping = false; velocityY = 0; }
            if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width * 0.6) { if (Math.random() < 0.02) { const h = canvas.height * (0.08 + Math.random() * 0.08); obstacles.push({ x: canvas.width, w: canvas.width * 0.05, h: h }); } }
            obstacles = obstacles.filter(o => { o.x -= speed; return o.x > -o.w; });
            const dino = { x: canvas.width * 0.1, y: groundY() + dinoY - dinoSize(), w: dinoSize() * 0.6, h: dinoSize() };
            for (const o of obstacles) { if (dino.x < o.x + o.w && dino.x + dino.w > o.x && dino.y + dino.h > groundY() - o.h) { showEnd(); return; } }
            score++; if (score % 100 === 0) speed += 0.5;
            document.getElementById('dino-score').textContent = Math.floor(score / 10);
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = this.getColor('--comment'); ctx.fillRect(0, groundY(), canvas.width, 2);
            ctx.fillStyle = this.getColor('--green'); ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
            ctx.fillStyle = this.getColor('--red'); obstacles.forEach(o => ctx.fillRect(o.x, groundY() - o.h, o.w, o.h));
        };
        this.gameLoop = setInterval(gameLoop, 16);
        document.getElementById('game-back').addEventListener('click', () => this.showMenu());
    },

    start2048() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        container.innerHTML = `<div class="game-score">Score: <span id="2048-score">0</span></div><canvas id="2048-canvas" class="game-canvas"></canvas><button class="game-back-btn" id="game-back">Back</button>`;
        const canvas = document.getElementById('2048-canvas');
        const ctx = canvas.getContext('2d');
        const SIZE = 4;
        const resizeCanvas = () => { const scoreHeight = 30, buttonHeight = 45, padding = 20; const availableWidth = container.clientWidth - padding; const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding; const size = Math.min(availableWidth, availableHeight); if (size > 0) { canvas.width = size; canvas.height = size; } };
        resizeCanvas();
        if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }
        let grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
        let score = 0, gameOver = false, won = false;
        const colors = { 0: '#1a1a2e', 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };
        const addTile = () => { const empty = []; for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) empty.push([r, c]); if (empty.length) { const [r, c] = empty[Math.floor(Math.random() * empty.length)]; grid[r][c] = Math.random() < 0.9 ? 2 : 4; } };
        const slide = (row) => { let arr = row.filter(x => x); for (let i = 0; i < arr.length - 1; i++) { if (arr[i] === arr[i + 1]) { arr[i] *= 2; score += arr[i]; if (arr[i] === 2048) won = true; arr.splice(i + 1, 1); } } while (arr.length < SIZE) arr.push(0); return arr; };
        const move = (dir) => { const oldGrid = JSON.stringify(grid); if (dir === 'left') { for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r]); } else if (dir === 'right') { for (let r = 0; r < SIZE; r++) grid[r] = slide(grid[r].reverse()).reverse(); } else if (dir === 'up') { for (let c = 0; c < SIZE; c++) { let col = grid.map(row => row[c]); col = slide(col); for (let r = 0; r < SIZE; r++) grid[r][c] = col[r]; } } else if (dir === 'down') { for (let c = 0; c < SIZE; c++) { let col = grid.map(row => row[c]).reverse(); col = slide(col).reverse(); for (let r = 0; r < SIZE; r++) grid[r][c] = col[r]; } } if (JSON.stringify(grid) !== oldGrid) addTile(); document.getElementById('2048-score').textContent = score; checkGameOver(); draw(); };
        const checkGameOver = () => { for (let r = 0; r < SIZE; r++) { for (let c = 0; c < SIZE; c++) { if (grid[r][c] === 0) return; if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return; if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return; } } gameOver = true; };
        const draw = () => { const cellSize = canvas.width / SIZE; const gap = cellSize * 0.05; ctx.fillStyle = '#0a0a15'; ctx.fillRect(0, 0, canvas.width, canvas.height); for (let r = 0; r < SIZE; r++) { for (let c = 0; c < SIZE; c++) { const val = grid[r][c]; ctx.fillStyle = colors[val] || '#3c3a32'; ctx.fillRect(c * cellSize + gap, r * cellSize + gap, cellSize - gap * 2, cellSize - gap * 2); if (val) { ctx.fillStyle = val <= 4 ? '#776e65' : '#f9f6f2'; ctx.font = `bold ${cellSize * 0.35}px 'Fira Code', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(val, c * cellSize + cellSize / 2, r * cellSize + cellSize / 2); } } } if (won || gameOver) { const size = canvas.width; ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = won ? this.getColor('--green') : this.getColor('--red'); ctx.font = `bold ${size * 0.12}px 'Fira Code', monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', canvas.width / 2, canvas.height / 2 - size * 0.08); ctx.fillStyle = this.getColor('--foreground'); ctx.font = `${size * 0.06}px 'Fira Code', monospace`; ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + size * 0.02); } };
        const handleKey = (e) => { if (gameOver || won) return; if (e.key === 'ArrowLeft') move('left'); else if (e.key === 'ArrowRight') move('right'); else if (e.key === 'ArrowUp') move('up'); else if (e.key === 'ArrowDown') move('down'); e.preventDefault(); };
        document.addEventListener('keydown', handleKey);
        this.keyHandler = handleKey;
        addTile(); addTile(); draw();
        document.getElementById('game-back').addEventListener('click', () => this.showMenu());
    },

    startFlappy() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        container.innerHTML = `<div class="game-score">Score: <span id="flappy-score">0</span></div><canvas id="flappy-canvas" class="game-canvas"></canvas><button class="game-back-btn" id="game-back">Back</button>`;
        const canvas = document.getElementById('flappy-canvas');
        const ctx = canvas.getContext('2d');
        const resizeCanvas = () => { const scoreHeight = 30, buttonHeight = 45, padding = 20; const availableWidth = container.clientWidth - padding; const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding; if (availableWidth > 0 && availableHeight > 0) { canvas.width = Math.max(200, Math.min(availableWidth, 400)); canvas.height = Math.max(300, Math.min(availableHeight, 500)); } };
        resizeCanvas();
        if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }
        const bird = { x: 50, y: 150, velocity: 0, size: 20 };
        const gravity = 0.5, jumpForce = -8, pipes = [], pipeWidth = 50, pipeGap = 120;
        let score = 0, gameOver = false, started = false;
        const jump = () => { if (gameOver) return; if (!started) started = true; bird.velocity = jumpForce; };
        const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
        const handleClick = () => jump();
        document.addEventListener('keydown', handleKey);
        canvas.addEventListener('click', handleClick);
        this.keyHandler = handleKey;
        const spawnPipe = () => { const minHeight = 50; const maxHeight = canvas.height - pipeGap - minHeight; const topHeight = Math.random() * (maxHeight - minHeight) + minHeight; pipes.push({ x: canvas.width, topHeight: topHeight, passed: false }); };
        const showEndScreen = () => { gameOver = true; clearInterval(this.gameLoop); ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = this.getColor('--red'); ctx.font = 'bold 24px "Fira Code", monospace'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20); ctx.fillStyle = this.getColor('--foreground'); ctx.font = '16px "Fira Code", monospace'; ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20); };
        const update = () => { if (gameOver || !started) return; bird.velocity += gravity; bird.y += bird.velocity; if (bird.y < 0 || bird.y + bird.size > canvas.height) { showEndScreen(); return; } for (let i = pipes.length - 1; i >= 0; i--) { pipes[i].x -= 3; if (bird.x + bird.size > pipes[i].x && bird.x < pipes[i].x + pipeWidth) { if (bird.y < pipes[i].topHeight || bird.y + bird.size > pipes[i].topHeight + pipeGap) { showEndScreen(); return; } } if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) { pipes[i].passed = true; score++; document.getElementById('flappy-score').textContent = score; } if (pipes[i].x + pipeWidth < 0) { pipes.splice(i, 1); } } };
        const draw = () => { const bgColor = this.getColor('--background'); const pipeColor = this.getColor('--green'); const birdColor = this.getColor('--yellow'); ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = pipeColor; pipes.forEach(pipe => { ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight); ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height); }); ctx.fillStyle = birdColor; ctx.beginPath(); ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2, 0, Math.PI * 2); ctx.fill(); if (!started && !gameOver) { ctx.fillStyle = this.getColor('--foreground'); ctx.font = '14px "Fira Code", monospace'; ctx.textAlign = 'center'; ctx.fillText('Press SPACE or Click to start', canvas.width / 2, canvas.height / 2); } };
        let frameCount = 0;
        this.gameLoop = setInterval(() => { update(); draw(); frameCount++; if (started && !gameOver && frameCount % 90 === 0) { spawnPipe(); } }, 1000 / 60);
        document.getElementById('game-back').addEventListener('click', () => { canvas.removeEventListener('click', handleClick); this.showMenu(); });
    },

    startMinesweeper() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        const gridSize = 8, mineCount = 10;
        container.innerHTML = `<div class="game-score">Mines: <span id="mine-count">${mineCount}</span></div><div id="minesweeper-grid" style="display: grid; grid-template-columns: repeat(${gridSize}, 30px); gap: 2px; justify-content: center;"></div><button class="game-back-btn" id="game-back">Back</button>`;
        const grid = [], revealed = [], flagged = [];
        let gameOver = false, won = false;
        for (let i = 0; i < gridSize; i++) { grid[i] = []; revealed[i] = []; flagged[i] = []; for (let j = 0; j < gridSize; j++) { grid[i][j] = 0; revealed[i][j] = false; flagged[i][j] = false; } }
        let minesPlaced = 0;
        while (minesPlaced < mineCount) { const x = Math.floor(Math.random() * gridSize); const y = Math.floor(Math.random() * gridSize); if (grid[x][y] !== -1) { grid[x][y] = -1; minesPlaced++; } }
        for (let i = 0; i < gridSize; i++) { for (let j = 0; j < gridSize; j++) { if (grid[i][j] === -1) continue; let count = 0; for (let di = -1; di <= 1; di++) { for (let dj = -1; dj <= 1; dj++) { const ni = i + di, nj = j + dj; if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize && grid[ni][nj] === -1) count++; } } grid[i][j] = count; } }
        const numberColors = ['', 'blue', 'green', 'red', 'darkblue', 'darkred', 'cyan', 'black', 'gray'];
        const revealCell = (x, y) => { if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return; if (revealed[x][y] || flagged[x][y]) return; revealed[x][y] = true; if (grid[x][y] === 0) { for (let di = -1; di <= 1; di++) { for (let dj = -1; dj <= 1; dj++) { revealCell(x + di, y + dj); } } } };
        const checkWin = () => { for (let i = 0; i < gridSize; i++) { for (let j = 0; j < gridSize; j++) { if (grid[i][j] !== -1 && !revealed[i][j]) return false; } } return true; };
        const renderGrid = () => { const gridEl = document.getElementById('minesweeper-grid'); gridEl.innerHTML = ''; for (let i = 0; i < gridSize; i++) { for (let j = 0; j < gridSize; j++) { const cell = document.createElement('div'); cell.style.cssText = `width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; cursor: pointer; border-radius: 4px; user-select: none;`; if (revealed[i][j]) { cell.style.backgroundColor = 'var(--background)'; cell.style.border = '1px solid var(--comment)'; if (grid[i][j] === -1) { cell.textContent = '💣'; } else if (grid[i][j] > 0) { cell.textContent = grid[i][j]; cell.style.color = `var(--${numberColors[grid[i][j]] || 'foreground'})`; } } else { cell.style.backgroundColor = 'var(--comment)'; cell.style.border = '1px solid var(--foreground)'; if (flagged[i][j]) cell.textContent = '🚩'; } const x = i, y = j; cell.addEventListener('click', () => { if (gameOver || won) return; if (flagged[x][y]) return; if (grid[x][y] === -1) { gameOver = true; for (let a = 0; a < gridSize; a++) { for (let b = 0; b < gridSize; b++) { if (grid[a][b] === -1) revealed[a][b] = true; } } renderGrid(); document.getElementById('mine-count').textContent = 'LOST!'; } else { revealCell(x, y); renderGrid(); if (checkWin()) { won = true; document.getElementById('mine-count').textContent = 'WON!'; } } }); cell.addEventListener('contextmenu', (e) => { e.preventDefault(); if (gameOver || won || revealed[x][y]) return; flagged[x][y] = !flagged[x][y]; renderGrid(); }); gridEl.appendChild(cell); } } };
        renderGrid();
        document.getElementById('game-back').addEventListener('click', () => this.showMenu());
    },

    startMemory() {
        const container = document.getElementById('games-content');
        container.className = 'game-canvas-container';
        const symbols = ['🍎', '🍊', '🍋', '🍇', '🍉', '🍓', '🥝', '🍒'];
        const pairs = [...symbols, ...symbols];
        const shuffled = pairs.sort(() => Math.random() - 0.5);
        container.innerHTML = `<div class="game-score">Moves: <span id="memory-moves">0</span></div><div id="memory-grid" style="display: grid; grid-template-columns: repeat(4, 60px); gap: 8px; justify-content: center;"></div><button class="game-back-btn" id="game-back">Back</button>`;
        let flipped = [], matched = [], moves = 0, canFlip = true;
        const renderGrid = () => { const gridEl = document.getElementById('memory-grid'); gridEl.innerHTML = ''; shuffled.forEach((symbol, index) => { const card = document.createElement('div'); card.style.cssText = `width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 28px; cursor: pointer; border-radius: 8px; transition: transform 0.3s ease; user-select: none;`; const isFlipped = flipped.includes(index) || matched.includes(index); if (isFlipped) { card.style.backgroundColor = 'var(--background)'; card.style.border = '2px solid var(--green)'; card.textContent = symbol; } else { card.style.backgroundColor = 'var(--comment)'; card.style.border = '2px solid var(--foreground)'; card.textContent = '?'; } if (matched.includes(index)) { card.style.opacity = '0.6'; } card.addEventListener('click', () => { if (!canFlip || flipped.includes(index) || matched.includes(index)) return; flipped.push(index); renderGrid(); if (flipped.length === 2) { canFlip = false; moves++; document.getElementById('memory-moves').textContent = moves; const [first, second] = flipped; if (shuffled[first] === shuffled[second]) { matched.push(first, second); flipped = []; canFlip = true; renderGrid(); if (matched.length === shuffled.length) { document.getElementById('memory-moves').textContent = `${moves} - WIN!`; } } else { setTimeout(() => { flipped = []; canFlip = true; renderGrid(); }, 1000); } } }); gridEl.appendChild(card); }); };
        renderGrid();
        document.getElementById('game-back').addEventListener('click', () => this.showMenu());
    },

    cleanup() {
        if (this.gameLoop) { clearInterval(this.gameLoop); this.gameLoop = null; }
        if (this.keyHandler) { document.removeEventListener('keydown', this.keyHandler); this.keyHandler = null; }
        if (this.keyUpHandler) { document.removeEventListener('keyup', this.keyUpHandler); this.keyUpHandler = null; }
        if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
        if (this.resizeTimeout) { cancelAnimationFrame(this.resizeTimeout); this.resizeTimeout = null; }
    }
};
