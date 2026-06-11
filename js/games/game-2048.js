// ================================================
// 2048 — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function start2048() {
    this.adjustWindowSize('2048');
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
}
