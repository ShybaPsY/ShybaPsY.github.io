// ================================================
// MEMORY — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startMemory() {
    this.adjustWindowSize('memory');
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
}
