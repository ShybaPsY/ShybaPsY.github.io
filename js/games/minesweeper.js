// ================================================
// MINESWEEPER — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startMinesweeper() {
    this.adjustWindowSize('minesweeper');
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
}
