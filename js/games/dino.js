// ================================================
// DINO — módulo do GamesApp
// Chamado como método do GamesApp, então `this` dá acesso aos
// helpers compartilhados (cleanup, getColor, showMenu, etc.)
// ================================================

export function startDino() {
    this.adjustWindowSize('dino');
    const container = document.getElementById('games-content');
    container.className = 'game-canvas-container';
    container.innerHTML = `<canvas id="dino-canvas" class="game-canvas"></canvas><button class="game-back-btn" id="game-back">Back</button>`;
    const canvas = document.getElementById('dino-canvas');
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
        const buttonHeight = 50, padding = 10;
        const w = container.clientWidth - padding;
        const h = container.clientHeight - buttonHeight - padding;
        if (w > 0 && h > 0) { canvas.width = Math.max(500, w); canvas.height = Math.max(200, h); }
    };
    resizeCanvas();
    if (window.ResizeObserver) { const debouncedResize = this.debounce(resizeCanvas); this.resizeObserver = new ResizeObserver(debouncedResize); this.resizeObserver.observe(container); }

    // Load sprite images
    const sprites = {};
    const imagePaths = {
        dinoRun1: 'js/games/dino_run_images/dino_run1.png',
        dinoRun2: 'js/games/dino_run_images/dino_run2.png',
        dinoStand: 'js/games/dino_run_images/standing_still.png',
        dinoStandBlink: 'js/games/dino_run_images/standing_still_eye_closed.png',
        cactus1: 'js/games/dino_run_images/cactus_1.png',
        cactus2: 'js/games/dino_run_images/cactus_2.png',
        cactus3: 'js/games/dino_run_images/cactus_3.png',
        ground: 'js/games/dino_run_images/ground.png'
    };
    let imagesLoaded = 0;
    const totalImages = Object.keys(imagePaths).length;

    // Game constants
    const GROUND_Y = () => canvas.height - 15; // Ground line position
    const DINO_SCALE = () => 0.5; // User specified size
    const GRAVITY = 0.58;
    const JUMP_FORCE = -12;

    // Game state
    let dinoY = 0, velocityY = 0, isJumping = false;
    let obstacles = [], clouds = [];
    let score = 0, highScore = 0, gameOver = false, gameStarted = false, speed = 7;
    let runFrame = 0, frameCount = 0, blinkTimer = 0;
    let groundOffset = 0;

    // Initial clouds
    for (let i = 0; i < 4; i++) {
        clouds.push({ x: canvas.width * 0.2 + Math.random() * canvas.width, y: 25 + Math.random() * 40 });
    }

    // Cloud drawing (pixel style)
    const drawCloud = (x, y) => {
        ctx.fillStyle = '#d4d4d4';
        const s = Math.max(0.8, canvas.height / 280);
        ctx.fillRect(x, y, 46 * s, 14 * s);
        ctx.fillRect(x + 6 * s, y - 6 * s, 28 * s, 6 * s);
        ctx.fillRect(x + 4 * s, y + 14 * s, 36 * s, 4 * s);
    };

    const handleKey = (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!gameStarted && !gameOver) {
                gameStarted = true;
                return;
            }
            if (gameOver) {
                // Restart game
                dinoY = 0; velocityY = 0; isJumping = false;
                obstacles = []; score = 0; gameOver = false; gameStarted = true; speed = 7;
                return;
            }
            if (!isJumping) {
                velocityY = JUMP_FORCE * DINO_SCALE();
                isJumping = true;
            }
        }
    };
    document.addEventListener('keydown', handleKey);
    this.keyHandler = handleKey;

    const showEnd = () => {
        gameOver = true;
        gameStarted = false;
        if (score > highScore) highScore = score;

        // Draw game over icon and text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(canvas.width / 2 - 90, canvas.height / 2 - 35, 180, 70);

        ctx.strokeStyle = '#535353';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 90, canvas.height / 2 - 35, 180, 70);

        ctx.fillStyle = '#535353';
        ctx.font = 'bold 16px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
        ctx.font = '13px "Fira Code", monospace';
        ctx.fillText(`Score: ${Math.floor(score / 10)}`, canvas.width / 2, canvas.height / 2 + 12);
        ctx.font = '10px "Fira Code", monospace';
        ctx.fillStyle = '#757575';
        ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 28);
    };

    const gameLoop = () => {
        frameCount++;
        if (frameCount % 5 === 0) runFrame++;
        blinkTimer++;

        const scale = DINO_SCALE();
        const ground = GROUND_Y();

        // Physics (only when game started)
        if (gameStarted && !gameOver) {
            velocityY += GRAVITY * scale;
            dinoY += velocityY;
            if (dinoY >= 0) { dinoY = 0; isJumping = false; velocityY = 0; }

            // Spawn obstacles 
            if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 250 - Math.random() * 150) {
                const types = [1, 2, 3];
                const type = types[Math.floor(Math.random() * types.length)];
                obstacles.push({ x: canvas.width + 50, type });
            }

            // Update positions
            obstacles = obstacles.filter(o => { o.x -= speed; return o.x > -100; });
            groundOffset = (groundOffset + speed) % (sprites.ground ? sprites.ground.width * scale : 1200);

            // Score
            score++;
            if (score % 100 === 0) speed = Math.min(14, speed + 0.4);
        }

        // Update clouds always
        clouds = clouds.map(c => {
            c.x -= (gameStarted && !gameOver ? speed * 0.15 : 0.3);
            if (c.x < -80) { c.x = canvas.width + 80 + Math.random() * 100; c.y = 25 + Math.random() * 40; }
            return c;
        });

        // --- DRAWING ---
        // Background
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clouds
        clouds.forEach(c => drawCloud(c.x, c.y));

        // Ground using sprite
        if (sprites.ground && sprites.ground.complete) {
            const gw = sprites.ground.width * scale * 0.5;
            const gh = sprites.ground.height * scale * 0.5;
            for (let x = -groundOffset % gw; x < canvas.width + gw; x += gw) {
                ctx.drawImage(sprites.ground, x, ground - gh * 0.3, gw, gh);
            }
        } else {
            // Fallback ground line
            ctx.fillStyle = '#535353';
            ctx.fillRect(0, ground, canvas.width, 1);
        }

        // Draw dino
        const dinoX = 60;
        let dinoSprite;
        if (!gameStarted && !gameOver) {
            // Idle state with blinking
            dinoSprite = (blinkTimer % 200 < 10) ? sprites.dinoStandBlink : sprites.dinoStand;
        } else if (isJumping) {
            dinoSprite = sprites.dinoStand;
        } else {
            dinoSprite = (runFrame % 2 === 0) ? sprites.dinoRun1 : sprites.dinoRun2;
        }

        if (dinoSprite && dinoSprite.complete) {
            const dw = dinoSprite.width * scale;
            const dh = dinoSprite.height * scale;
            const dinoDrawY = ground - dh + 5 + dinoY; // Sit on ground
            ctx.drawImage(dinoSprite, dinoX, dinoDrawY, dw, dh);

            // Collision detection (only when game running)
            if (gameStarted && !gameOver) {
                const dinoBox = { x: dinoX + 8 * scale, y: dinoDrawY + 8 * scale, w: dw - 16 * scale, h: dh - 12 * scale };

                for (const o of obstacles) {
                    const cactusSprite = sprites[`cactus${o.type}`];
                    if (cactusSprite && cactusSprite.complete) {
                        const cw = cactusSprite.width * scale;
                        const ch = cactusSprite.height * scale;
                        const cactusBox = { x: o.x + 4 * scale, y: ground - ch + 4 * scale, w: cw - 8 * scale, h: ch - 8 * scale };

                        if (dinoBox.x + dinoBox.w > cactusBox.x &&
                            dinoBox.x < cactusBox.x + cactusBox.w &&
                            dinoBox.y + dinoBox.h > cactusBox.y) {
                            showEnd();
                            return;
                        }
                    }
                }
            }
        }

        // Draw obstacles using sprites
        obstacles.forEach(o => {
            const cactusSprite = sprites[`cactus${o.type}`];
            if (cactusSprite && cactusSprite.complete) {
                const cw = cactusSprite.width * scale;
                const ch = cactusSprite.height * scale;
                ctx.drawImage(cactusSprite, o.x, ground - ch + 5, cw, ch); // Sit on ground
            }
        });

        // HI score display
        ctx.fillStyle = '#757575';
        ctx.font = '11px "Fira Code", monospace';
        ctx.textAlign = 'right';
        if (highScore > 0) {
            ctx.fillText(`HI ${Math.floor(highScore / 10).toString().padStart(5, '0')}  ${Math.floor(score / 10).toString().padStart(5, '0')}`, canvas.width - 15, 22);
        } else {
            ctx.fillText(Math.floor(score / 10).toString().padStart(5, '0'), canvas.width - 15, 22);
        }

        // Start prompt
        if (!gameStarted && !gameOver) {
            ctx.fillStyle = '#535353';
            ctx.font = '14px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 - 20);
        }

        // Game over screen
        if (gameOver) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(canvas.width / 2 - 90, canvas.height / 2 - 35, 180, 70);

            ctx.strokeStyle = '#535353';
            ctx.lineWidth = 2;
            ctx.strokeRect(canvas.width / 2 - 90, canvas.height / 2 - 35, 180, 70);

            ctx.fillStyle = '#535353';
            ctx.font = 'bold 16px "Fira Code", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
            ctx.font = '13px "Fira Code", monospace';
            ctx.fillText(`Score: ${Math.floor(score / 10)}`, canvas.width / 2, canvas.height / 2 + 12);
            ctx.font = '10px "Fira Code", monospace';
            ctx.fillStyle = '#757575';
            ctx.fillText('Press SPACE to restart', canvas.width / 2, canvas.height / 2 + 28);
        }
    };

    // Load all images then start game loop
    const loadImages = () => {
        for (const [key, path] of Object.entries(imagePaths)) {
            const img = new Image();
            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    // All images loaded, start game
                    this.gameLoop = setInterval(gameLoop, 16);
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${path}`);
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    this.gameLoop = setInterval(gameLoop, 16);
                }
            };
            img.src = path;
            sprites[key] = img;
        }
    };

    // Show loading state
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#535353';
    ctx.font = '14px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);

    loadImages();
    document.getElementById('game-back').addEventListener('click', () => this.showMenu());
}
