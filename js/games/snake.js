// ================================================
// SNAKE — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startSnake() {
    this.adjustWindowSize('snake');
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

    let snake = [{ x: 7, y: 7 }];
    let food = { x: 10, y: 10 };
    let direction = { dx: 0, dy: 0 };
    let nextDirection = { dx: 0, dy: 0 };
    let score = 0;
    let gameOver = false;

    const spawnFood = () => {
        const emptyCells = [];
        for (let x = 0; x < tileCount; x++) {
            for (let y = 0; y < tileCount; y++) {
                if (!snake.some(s => s.x === x && s.y === y)) {
                    emptyCells.push({ x, y });
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
        if (e.key === 'ArrowUp' && direction.dy !== 1) { nextDirection = { dx: 0, dy: -1 }; }
        else if (e.key === 'ArrowDown' && direction.dy !== -1) { nextDirection = { dx: 0, dy: 1 }; }
        else if (e.key === 'ArrowLeft' && direction.dx !== 1) { nextDirection = { dx: -1, dy: 0 }; }
        else if (e.key === 'ArrowRight' && direction.dx !== -1) { nextDirection = { dx: 1, dy: 0 }; }
    };

    document.addEventListener('keydown', handleKey);
    this.keyHandler = handleKey;

    const gameLoop = () => {
        if (gameOver) return;

        direction = { ...nextDirection };
        const gridSize = canvas.width / tileCount;
        const head = { x: snake[0].x + direction.dx, y: snake[0].y + direction.dy };

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
}
