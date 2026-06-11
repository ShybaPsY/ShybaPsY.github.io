// ================================================
// GAMES APP MODULE
// Contains all mini-games: Snake, Pong, Tetris, Breakout,
// Invaders, Asteroids, Dino, 2048, Flappy, Minesweeper, Memory
// ================================================

import { startSnake } from './snake.js';
import { startPong } from './pong.js';
import { startTetris } from './tetris.js';
import { startBreakout } from './breakout.js';
import { startInvaders } from './invaders.js';
import { startAsteroids } from './asteroids.js';
import { startDino } from './dino.js';
import { start2048 } from './game-2048.js';
import { startFlappy } from './flappy.js';
import { startMinesweeper } from './minesweeper.js';
import { startMemory } from './memory.js';

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

    // Adjust window size based on game type
    adjustWindowSize(gameType) {
        const windowEl = this.WindowManager?.windows?.['games'];
        if (!windowEl) return;

        const sizes = {
            'menu': { width: 480, height: 520 },
            'snake': { width: 450, height: 520 },
            'pong': { width: 500, height: 450 },
            'tetris': { width: 320, height: 580 },
            'breakout': { width: 520, height: 450 },
            'invaders': { width: 480, height: 500 },
            'asteroids': { width: 500, height: 500 },
            'dino': { width: 750, height: 450 },
            '2048': { width: 380, height: 480 },
            'flappy': { width: 380, height: 550 },
            'minesweeper': { width: 340, height: 420 },
            'memory': { width: 360, height: 450 }
        };

        const size = sizes[gameType] || sizes.menu;
        windowEl.style.width = `${size.width}px`;
        windowEl.style.height = `${size.height}px`;

        // Center the window after resize
        const maxX = window.innerWidth - size.width - 10;
        const maxY = window.innerHeight - size.height - 60;
        const currentLeft = parseInt(windowEl.style.left) || 0;
        const currentTop = parseInt(windowEl.style.top) || 0;

        if (currentLeft > maxX) windowEl.style.left = `${Math.max(10, maxX)}px`;
        if (currentTop > maxY) windowEl.style.top = `${Math.max(10, maxY)}px`;
    },


    showMenu() {
        this.cleanup();
        this.adjustWindowSize('menu');
        const container = document.getElementById('games-content');
        if (!container) return;

        container.className = 'games-menu';
        container.innerHTML = `
            <div class="game-option" data-game="snake">
                <div class="game-option-title">🐍 Snake</div>
                <div class="game-option-desc">Arrow keys to move</div>
            </div>
            <div class="game-option" data-game="pong">
                <div class="game-option-title">🏓 Pong</div>
                <div class="game-option-desc">W/S or Arrows</div>
            </div>
            <div class="game-option" data-game="tetris">
                <div class="game-option-title">🧱 Tetris</div>
                <div class="game-option-desc">Arrows to control</div>
            </div>
            <div class="game-option" data-game="breakout">
                <div class="game-option-title">🎯 Breakout</div>
                <div class="game-option-desc">Left/Right arrows</div>
            </div>
            <div class="game-option" data-game="invaders">
                <div class="game-option-title">👾 Invaders</div>
                <div class="game-option-desc">Arrows + Space</div>
            </div>
            <div class="game-option" data-game="asteroids">
                <div class="game-option-title">🚀 Asteroids</div>
                <div class="game-option-desc">Arrows + Space</div>
            </div>
            <div class="game-option" data-game="dino">
                <div class="game-option-title">🦖 Dino Run</div>
                <div class="game-option-desc">Space to jump</div>
            </div>
            <div class="game-option" data-game="2048">
                <div class="game-option-title">🔢 2048</div>
                <div class="game-option-desc">Arrow keys</div>
            </div>
            <div class="game-option" data-game="flappy">
                <div class="game-option-title">🐦 Flappy</div>
                <div class="game-option-desc">Space or click</div>
            </div>
            <div class="game-option" data-game="minesweeper">
                <div class="game-option-title">💣 Mines</div>
                <div class="game-option-desc">Click to reveal</div>
            </div>
            <div class="game-option" data-game="memory">
                <div class="game-option-title">🃏 Memory</div>
                <div class="game-option-desc">Match the pairs</div>
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

    // Jogos em módulos separados, atachados como métodos para preservar o `this`
    startSnake,
    startPong,
    startTetris,
    startBreakout,
    startInvaders,
    startAsteroids,
    startDino,
    start2048,
    startFlappy,
    startMinesweeper,
    startMemory,

    cleanup() {
        if (this.gameLoop) { clearInterval(this.gameLoop); this.gameLoop = null; }
        if (this.keyHandler) { document.removeEventListener('keydown', this.keyHandler); this.keyHandler = null; }
        if (this.keyUpHandler) { document.removeEventListener('keyup', this.keyUpHandler); this.keyUpHandler = null; }
        if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null; }
        if (this.resizeTimeout) { cancelAnimationFrame(this.resizeTimeout); this.resizeTimeout = null; }
    }
};
