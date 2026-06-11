// ================================================
// TETRIS — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startTetris() {
    this.adjustWindowSize('tetris');
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
        const scoreHeight = 50, buttonHeight = 55, padding = 16;
        const availableHeight = container.clientHeight - scoreHeight - buttonHeight - padding;
        const cellSize = Math.floor(availableHeight / ROWS);
        canvas.width = cellSize * COLS;
        canvas.height = cellSize * ROWS;
    };
    resizeCanvas();

    if (window.ResizeObserver) {
        const debouncedResize = this.debounce(resizeCanvas);
        this.resizeObserver = new ResizeObserver(debouncedResize);
        this.resizeObserver.observe(container);
    }

    const PIECES = [
        [[1, 1, 1, 1]],           // I
        [[1, 1], [1, 1]],         // O
        [[0, 1, 0], [1, 1, 1]],     // T
        [[1, 0, 0], [1, 1, 1]],     // J
        [[0, 0, 1], [1, 1, 1]],     // L
        [[0, 1, 1], [1, 1, 0]],     // S
        [[1, 1, 0], [0, 1, 1]]      // Z
    ];
    const COLORS = [
        { main: '#00f5ff', light: '#7fffff', dark: '#00a5b0' },  // I - Cyan
        { main: '#ffeb3b', light: '#ffff72', dark: '#c8b900' },  // O - Yellow
        { main: '#e040fb', light: '#ff79ff', dark: '#a000c6' },  // T - Purple
        { main: '#2196f3', light: '#6ec6ff', dark: '#0069c0' },  // J - Blue
        { main: '#ff9800', light: '#ffc947', dark: '#c66900' },  // L - Orange
        { main: '#4caf50', light: '#80e27e', dark: '#087f23' },  // S - Green
        { main: '#f44336', light: '#ff7961', dark: '#ba000d' }   // Z - Red
    ];

    let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    let score = 0, gameOver = false;
    let piece, pieceX, pieceY, pieceColorIdx;

    const drawBlock = (x, y, colorIdx, ghost = false) => {
        const cellW = canvas.width / COLS;
        const cellH = canvas.height / ROWS;
        const color = COLORS[colorIdx];
        const px = x * cellW;
        const py = y * cellH;
        const pad = 1;

        if (ghost) {
            ctx.strokeStyle = color.main;
            ctx.lineWidth = 2;
            ctx.strokeRect(px + pad + 2, py + pad + 2, cellW - pad * 2 - 4, cellH - pad * 2 - 4);
            return;
        }

        // Main block
        ctx.fillStyle = color.main;
        ctx.fillRect(px + pad, py + pad, cellW - pad * 2, cellH - pad * 2);

        // 3D highlight (top-left)
        ctx.fillStyle = color.light;
        ctx.beginPath();
        ctx.moveTo(px + pad, py + pad);
        ctx.lineTo(px + cellW - pad, py + pad);
        ctx.lineTo(px + cellW - pad - 4, py + pad + 4);
        ctx.lineTo(px + pad + 4, py + pad + 4);
        ctx.lineTo(px + pad + 4, py + cellH - pad - 4);
        ctx.lineTo(px + pad, py + cellH - pad);
        ctx.closePath();
        ctx.fill();

        // 3D shadow (bottom-right)
        ctx.fillStyle = color.dark;
        ctx.beginPath();
        ctx.moveTo(px + cellW - pad, py + pad);
        ctx.lineTo(px + cellW - pad, py + cellH - pad);
        ctx.lineTo(px + pad, py + cellH - pad);
        ctx.lineTo(px + pad + 4, py + cellH - pad - 4);
        ctx.lineTo(px + cellW - pad - 4, py + cellH - pad - 4);
        ctx.lineTo(px + cellW - pad - 4, py + pad + 4);
        ctx.closePath();
        ctx.fill();

        // Inner face
        ctx.fillStyle = color.main;
        ctx.fillRect(px + pad + 4, py + pad + 4, cellW - pad * 2 - 8, cellH - pad * 2 - 8);
    };

    const newPiece = () => {
        const idx = Math.floor(Math.random() * PIECES.length);
        piece = PIECES[idx].map(r => [...r]);
        pieceColorIdx = idx;
        pieceX = Math.floor(COLS / 2) - Math.floor(piece[0].length / 2);
        pieceY = 0;
        if (collides()) { gameOver = true; showEnd(); }
    };

    const collides = (px = pieceX, py = pieceY, p = piece) => {
        for (let y = 0; y < p.length; y++) {
            for (let x = 0; x < p[y].length; x++) {
                if (p[y][x] && (px + x < 0 || px + x >= COLS || py + y >= ROWS || (py + y >= 0 && board[py + y][px + x] !== null))) return true;
            }
        }
        return false;
    };

    const merge = () => {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x] && pieceY + y >= 0) board[pieceY + y][pieceX + x] = pieceColorIdx;
            }
        }
    };

    const clearLines = () => {
        let lines = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(c => c !== null)) {
                board.splice(y, 1);
                board.unshift(Array(COLS).fill(null));
                lines++;
                y++;
            }
        }
        if (lines) score += [0, 100, 300, 500, 800][lines];
        document.getElementById('tetris-score').textContent = score;
    };

    const rotate = () => {
        const rotated = piece[0].map((_, i) => piece.map(r => r[i]).reverse());
        if (!collides(pieceX, pieceY, rotated)) piece = rotated;
    };

    const getGhostY = () => {
        let ghostY = pieceY;
        while (!collides(pieceX, ghostY + 1, piece)) ghostY++;
        return ghostY;
    };

    const showEnd = () => {
        clearInterval(this.gameLoop);
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = this.getColor('--red');
        ctx.font = `bold ${canvas.width * 0.12}px 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = this.getColor('--foreground');
        ctx.font = `${canvas.width * 0.08}px 'Fira Code', monospace`;
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    };

    const handleKey = (e) => {
        if (gameOver) return;
        if (e.key === 'ArrowLeft' && !collides(pieceX - 1, pieceY)) pieceX--;
        else if (e.key === 'ArrowRight' && !collides(pieceX + 1, pieceY)) pieceX++;
        else if (e.key === 'ArrowDown' && !collides(pieceX, pieceY + 1)) pieceY++;
        else if (e.key === 'ArrowUp') rotate();
        else if (e.key === ' ') { while (!collides(pieceX, pieceY + 1)) pieceY++; }
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

        // Background
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw board pieces
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x] !== null) drawBlock(x, y, board[y][x]);
            }
        }

        // Draw ghost piece
        const ghostY = getGhostY();
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) drawBlock(pieceX + x, ghostY + y, pieceColorIdx, true);
            }
        }

        // Draw active piece
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) drawBlock(pieceX + x, pieceY + y, pieceColorIdx);
            }
        }
    };

    this.gameLoop = setInterval(gameLoop, 16);
    document.getElementById('game-back').addEventListener('click', () => this.showMenu());
}
