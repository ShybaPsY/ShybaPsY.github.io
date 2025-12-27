// ================================================
// DESKTOP PET MODULE (Pixel Art Style)
// ================================================

export const DesktopPet = {
    canvas: null,
    ctx: null,
    element: null,
    petType: 'cat',
    state: 'idle',
    direction: 1,
    position: { x: 100 },
    velocity: 0,
    targetX: null,
    frame: 0,
    frameInterval: null,
    behaviorInterval: null,
    moveInterval: null,
    isOnGround: true,
    groundY: 0,
    jumpY: 0,
    size: 32,

    // Pixel art sprites (each frame is an array of [x, y, color] pixels)
    pets: {
        cat: {
            name: 'Cat',
            color: '#ffaa00',
            idle: [
                // Frame 1 - sitting
                [[4,0],[5,0],[8,0],[9,0],[4,1],[5,1],[8,1],[9,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[2,4],[3,4],[11,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[4,7],[5,7],[8,7],[9,7]],
                // Frame 2 - ear twitch
                [[4,0],[5,0],[9,0],[10,0],[4,1],[5,1],[8,1],[9,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[2,4],[3,4],[11,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[4,7],[5,7],[8,7],[9,7]]
            ],
            walk: [
                // Walking frame 1
                [[4,0],[5,0],[8,0],[9,0],[4,1],[5,1],[8,1],[9,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[2,4],[11,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[3,6],[4,6],[9,6],[10,6],[3,7],[10,7]],
                // Walking frame 2
                [[4,0],[5,0],[8,0],[9,0],[4,1],[5,1],[8,1],[9,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[2,4],[11,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[4,6],[5,6],[8,6],[9,6],[5,7],[8,7]]
            ],
            run: [
                [[4,0],[5,0],[8,0],[9,0],[4,1],[5,1],[8,1],[9,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[1,4],[2,4],[12,4],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[2,6],[3,6],[10,6],[11,6],[2,7],[11,7]],
                [[4,0],[5,0],[8,0],[9,0],[4,1],[5,1],[8,1],[9,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[1,4],[2,4],[12,4],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[4,6],[5,6],[8,6],[9,6],[5,7],[8,7]]
            ],
            sleep: [
                [[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[2,5],[3,5],[11,5],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7]],
                [[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[2,5],[3,5],[11,5],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7]]
            ]
        },
        dog: {
            name: 'Dog',
            color: '#8B4513',
            idle: [
                [[5,0],[6,0],[5,1],[6,1],[7,1],[8,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[3,4],[4,4],[10,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[4,6],[5,6],[8,6],[9,6],[4,7],[5,7],[8,7],[9,7]],
                [[5,0],[6,0],[5,1],[6,1],[7,1],[8,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[3,4],[4,4],[10,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[4,6],[5,6],[8,6],[9,6],[5,7],[8,7]]
            ],
            walk: [
                [[5,0],[6,0],[5,1],[6,1],[7,1],[8,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[3,4],[4,4],[10,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[3,6],[4,6],[9,6],[10,6],[3,7],[10,7]],
                [[5,0],[6,0],[5,1],[6,1],[7,1],[8,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[3,4],[4,4],[10,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[5,6],[6,6],[7,6],[8,6],[5,7],[8,7]]
            ],
            run: [
                [[5,0],[6,0],[5,1],[6,1],[7,1],[8,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[2,4],[3,4],[4,4],[11,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[3,6],[4,6],[9,6],[10,6],[3,7],[10,7]],
                [[5,0],[6,0],[5,1],[6,1],[7,1],[8,1],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[2,4],[3,4],[4,4],[11,4],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[5,6],[6,6],[7,6],[8,6],[6,7],[7,7]]
            ],
            sleep: [
                [[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[3,5],[4,5],[10,5],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7]],
                [[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[3,5],[4,5],[10,5],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7]]
            ]
        },
        duck: {
            name: 'Duck',
            color: '#FFD700',
            idle: [
                [[6,1],[7,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[5,6],[6,6],[7,6],[8,6],[5,7],[6,7],[7,7],[8,7]],
                [[6,1],[7,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[5,6],[6,6],[7,6],[8,6],[6,7],[7,7]]
            ],
            walk: [
                [[6,1],[7,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[4,6],[5,6],[8,6],[9,6],[4,7],[9,7]],
                [[6,1],[7,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[5,6],[6,6],[7,6],[8,6],[5,7],[8,7]]
            ],
            run: [
                [[6,1],[7,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[4,6],[5,6],[8,6],[9,6],[4,7],[9,7]],
                [[6,1],[7,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[5,6],[6,6],[7,6],[8,6],[6,7],[7,7]]
            ],
            sleep: [
                [[5,3],[6,3],[7,3],[8,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[5,6],[6,6],[7,6],[8,6]],
                [[5,3],[6,3],[7,3],[8,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[5,6],[6,6],[7,6],[8,6]]
            ]
        },
        crab: {
            name: 'Crab',
            color: '#FF6347',
            idle: [
                [[2,2],[3,2],[10,2],[11,2],[1,3],[2,3],[3,3],[10,3],[11,3],[12,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[3,6],[4,6],[5,6],[8,6],[9,6],[10,6],[3,7],[4,7],[9,7],[10,7]],
                [[3,2],[4,2],[9,2],[10,2],[2,3],[3,3],[4,3],[9,3],[10,3],[11,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[3,6],[4,6],[5,6],[8,6],[9,6],[10,6],[3,7],[4,7],[9,7],[10,7]]
            ],
            walk: [
                [[2,2],[3,2],[10,2],[11,2],[1,3],[2,3],[3,3],[10,3],[11,3],[12,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[2,6],[3,6],[10,6],[11,6],[2,7],[11,7]],
                [[3,2],[4,2],[9,2],[10,2],[2,3],[3,3],[4,3],[9,3],[10,3],[11,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[4,6],[5,6],[8,6],[9,6],[4,7],[9,7]]
            ],
            run: [
                [[1,2],[2,2],[11,2],[12,2],[0,3],[1,3],[2,3],[11,3],[12,3],[13,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[2,6],[3,6],[10,6],[11,6],[2,7],[11,7]],
                [[2,2],[3,2],[10,2],[11,2],[1,3],[2,3],[3,3],[10,3],[11,3],[12,3],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[4,6],[5,6],[8,6],[9,6],[4,7],[9,7]]
            ],
            sleep: [
                [[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[3,6],[4,6],[5,6],[8,6],[9,6],[10,6]],
                [[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[3,6],[4,6],[5,6],[8,6],[9,6],[10,6]]
            ]
        }
    },

    init() {
        this.loadPreferences();
        this.createDOM();
        this.startAnimationLoop();
        this.startBehaviorLoop();
    },

    loadPreferences() {
        const saved = localStorage.getItem('desktop-pet-v3');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.petType = data.type || 'cat';
            } catch (e) {}
        }
        this.position.x = Math.random() * (window.innerWidth - 100) + 50;
    },

    savePreferences() {
        localStorage.setItem('desktop-pet-v3', JSON.stringify({ type: this.petType }));
    },

    createDOM() {
        this.element = document.createElement('div');
        this.element.id = 'desktop-pet';

        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size * 2;
        this.canvas.height = this.size * 2;
        this.ctx = this.canvas.getContext('2d');

        const menu = document.createElement('div');
        menu.className = 'pet-menu';

        this.element.appendChild(this.canvas);
        this.element.appendChild(menu);

        this.updatePosition();
        this.draw();
        document.body.appendChild(this.element);

        this.element.addEventListener('click', (e) => this.handleClick(e));
        this.element.addEventListener('dblclick', (e) => this.showPetMenu(e));
    },

    draw() {
        const pet = this.pets[this.petType];
        const frames = pet[this.state] || pet.idle;
        const pixels = frames[this.frame % frames.length];

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const pixelSize = 3;
        const offsetX = this.direction === 1 ? 0 : this.canvas.width;
        const scaleX = this.direction;

        this.ctx.save();
        this.ctx.translate(offsetX, 0);
        this.ctx.scale(scaleX, 1);

        this.ctx.fillStyle = pet.color;
        pixels.forEach(([x, y]) => {
            this.ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });

        // Draw eyes (white with black pupils)
        if (this.state !== 'sleep') {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(5 * pixelSize, 3 * pixelSize, pixelSize, pixelSize);
            this.ctx.fillRect(8 * pixelSize, 3 * pixelSize, pixelSize, pixelSize);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(5 * pixelSize, 3 * pixelSize, 1, 1);
            this.ctx.fillRect(8 * pixelSize, 3 * pixelSize, 1, 1);
        } else {
            // Closed eyes for sleep
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(5 * pixelSize, 3 * pixelSize, pixelSize, 1);
            this.ctx.fillRect(8 * pixelSize, 3 * pixelSize, pixelSize, 1);
        }

        this.ctx.restore();
    },

    updatePosition() {
        this.element.style.left = `${this.position.x}px`;
        this.element.style.bottom = `${48 + this.jumpY}px`;
    },

    startAnimationLoop() {
        this.frameInterval = setInterval(() => {
            this.frame++;
            this.draw();
        }, 200);

        this.moveInterval = setInterval(() => {
            this.updateMovement();
        }, 50);
    },

    startBehaviorLoop() {
        this.behaviorInterval = setInterval(() => {
            this.decideBehavior();
        }, 3000 + Math.random() * 4000);
    },

    decideBehavior() {
        if (this.state === 'sleep') {
            if (Math.random() < 0.2) {
                this.setState('idle');
            }
            return;
        }

        const rand = Math.random();

        if (rand < 0.3) {
            this.walkTo(Math.random() * (window.innerWidth - 100) + 50);
        } else if (rand < 0.5) {
            this.runTo(Math.random() * (window.innerWidth - 100) + 50);
        } else if (rand < 0.6) {
            this.setState('idle');
            this.targetX = null;
        } else if (rand < 0.7) {
            this.setState('sleep');
            this.targetX = null;
        } else if (rand < 0.8) {
            this.jump();
        } else {
            this.setState('idle');
            this.targetX = null;
        }
    },

    walkTo(x) {
        this.targetX = x;
        this.velocity = 2;
        this.setState('walk');
        this.direction = x > this.position.x ? 1 : -1;
    },

    runTo(x) {
        this.targetX = x;
        this.velocity = 5;
        this.setState('run');
        this.direction = x > this.position.x ? 1 : -1;
    },

    jump() {
        if (!this.isOnGround) return;

        this.isOnGround = false;
        let jumpVelocity = 12;
        const gravity = 1;

        const jumpLoop = setInterval(() => {
            this.jumpY += jumpVelocity;
            jumpVelocity -= gravity;
            this.updatePosition();

            if (this.jumpY <= 0) {
                this.jumpY = 0;
                this.isOnGround = true;
                clearInterval(jumpLoop);
                this.updatePosition();
            }
        }, 50);
    },

    updateMovement() {
        if (this.targetX === null) return;

        const distance = this.targetX - this.position.x;

        if (Math.abs(distance) < 5) {
            this.targetX = null;
            this.setState('idle');
            return;
        }

        this.direction = distance > 0 ? 1 : -1;
        this.position.x += this.velocity * this.direction;
        this.position.x = Math.max(20, Math.min(window.innerWidth - 60, this.position.x));

        this.updatePosition();
    },

    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.frame = 0;
            this.draw();
        }
    },

    handleClick(e) {
        e.stopPropagation();
        this.runTo(e.clientX);
    },

    showPetMenu(e) {
        e.stopPropagation();
        e.preventDefault();

        const menu = this.element.querySelector('.pet-menu');
        menu.innerHTML = Object.entries(this.pets).map(([id, pet]) =>
            `<div class="pet-menu-item ${id === this.petType ? 'active' : ''}" data-pet="${id}">
                ${pet.name}
            </div>`
        ).join('');

        menu.classList.add('visible');

        menu.querySelectorAll('.pet-menu-item').forEach(item => {
            item.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.changePet(item.dataset.pet);
                menu.classList.remove('visible');
            });
        });

        setTimeout(() => menu.classList.remove('visible'), 3000);

        const hideMenu = () => {
            menu.classList.remove('visible');
            document.removeEventListener('click', hideMenu);
        };
        setTimeout(() => document.addEventListener('click', hideMenu), 100);
    },

    changePet(type) {
        if (!this.pets[type]) return;
        this.petType = type;
        this.setState('idle');
        this.jump();
        this.savePreferences();
    },

    destroy() {
        if (this.frameInterval) clearInterval(this.frameInterval);
        if (this.behaviorInterval) clearInterval(this.behaviorInterval);
        if (this.moveInterval) clearInterval(this.moveInterval);
        if (this.element) this.element.remove();
    }
};
