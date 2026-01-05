// ================================================
// DESKTOP PET MODULE (GIF Animation Style)
// Using assets from VS Code Pets extension
// ================================================

export const DesktopPet = {
    element: null,
    imgElement: null,
    speechBubble: null,
    petType: 'dog',
    state: 'idle',
    direction: 1,
    position: { x: 100 },
    velocity: 0,
    targetX: null,
    behaviorInterval: null,
    moveInterval: null,
    tipInterval: null,
    isOnGround: true,
    jumpY: 0,
    lastTipIndex: -1,
    isDragging: false,
    wasDragging: false,
    dragOffset: { x: 0, y: 0 },

    // Base URL for VS Code Pets assets
    baseUrl: 'https://raw.githubusercontent.com/tonybaloney/vscode-pets/main/media',

    tips: [
        "Os aplicativos são funcionais e clicáveis!",
        "Clique com o botão direito na área de trabalho para mudar o papel de parede!",
        "Arraste as janelas pela barra de título para movê-las!",
        "Clique com o botão direito em mim para trocar de pet!",
        "Use o terminal para comandos secretos!",
        "O botão CRT na taskbar ativa o efeito retrô!",
        "A calculadora tem modo científico, programador e cálculo!",
        "Você pode minimizar as janelas clicando no ícone na taskbar!",
        "Tente o comando 'matrix' no terminal!",
        "O Notepad salva automaticamente no seu navegador!",
        "Pressione ESC para fechar o Spotlight!",
        "Os temas podem ser alterados no app Themes!",
        "O Music Player toca rádios de verdade!",
        "Redimensione as janelas arrastando as bordas!",
        "O histórico da calculadora guarda seus cálculos!",
        "Experimente o jogo da cobrinha no app Games!",
        "Clique em mim para eu correr até você!",
        "O ASCII Player converte vídeos em arte ASCII!",
        "Use Ctrl+Espaço para abrir o Spotlight!",
        "Olá! Sou seu pet virtual!"
    ],

    // Pet definitions with their sprite configurations
    // Using assets from VS Code Pets (https://github.com/tonybaloney/vscode-pets)
    pets: {
        dog: {
            name: 'Dog',
            folder: 'dog',
            color: 'akita',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'walk_fast_8fps.gif',
                sleep: 'lie_8fps.gif'
            }
        },
        chicken: {
            name: 'Chicken',
            folder: 'chicken',
            color: 'white',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'walk_fast_8fps.gif',
                sleep: 'idle_8fps.gif'
            }
        },
        fox: {
            name: 'Fox',
            folder: 'fox',
            color: 'red',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'run_8fps.gif',
                sleep: 'lie_8fps.gif'
            }
        },
        snake: {
            name: 'Snake',
            folder: 'snake',
            color: 'green',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'walk_fast_8fps.gif',
                sleep: 'idle_8fps.gif'
            }
        },
        crab: {
            name: 'Crab',
            folder: 'crab',
            color: 'red',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'walk_fast_8fps.gif',
                sleep: 'idle_8fps.gif'
            }
        },
        duck: {
            name: 'Duck',
            folder: 'rubber-duck',
            color: 'yellow',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'run_8fps.gif',
                sleep: 'idle_8fps.gif'
            }
        },
        turtle: {
            name: 'Turtle',
            folder: 'turtle',
            color: 'green',
            states: {
                idle: 'idle_8fps.gif',
                walk: 'walk_8fps.gif',
                run: 'run_8fps.gif',
                sleep: 'lie_8fps.gif'
            }
        }
    },

    init() {
        // Clear old invalid pet data
        const saved = localStorage.getItem('desktop-pet-v4');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.type && !this.pets[data.type]) {
                    localStorage.removeItem('desktop-pet-v4');
                }
            } catch (e) {
                localStorage.removeItem('desktop-pet-v4');
            }
        }

        this.loadPreferences();
        this.createDOM();
        this.startBehaviorLoop();
        this.startTipLoop();
        this.startMoveLoop();
    },

    loadPreferences() {
        const saved = localStorage.getItem('desktop-pet-v4');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.type && this.pets[data.type]) {
                    this.petType = data.type;
                } else {
                    this.petType = 'dog';
                }
            } catch (e) {
                this.petType = 'dog';
            }
        }
        this.position.x = Math.random() * (window.innerWidth - 100) + 50;
    },

    savePreferences() {
        localStorage.setItem('desktop-pet-v4', JSON.stringify({ type: this.petType }));
    },

    getSpritePath(state) {
        const pet = this.pets[this.petType];
        const stateFile = pet.states[state] || pet.states.idle;
        return `${this.baseUrl}/${pet.folder}/${pet.color}_${stateFile}`;
    },

    createDOM() {
        this.element = document.createElement('div');
        this.element.id = 'desktop-pet';

        this.imgElement = document.createElement('img');
        this.imgElement.className = 'pet-sprite';
        this.imgElement.src = this.getSpritePath('idle');
        this.imgElement.draggable = false;

        const menu = document.createElement('div');
        menu.className = 'pet-menu';

        this.speechBubble = document.createElement('div');
        this.speechBubble.className = 'pet-speech-bubble';

        this.element.appendChild(this.imgElement);
        this.element.appendChild(menu);
        this.element.appendChild(this.speechBubble);

        this.updatePosition();
        document.body.appendChild(this.element);

        // Click and right-click handlers
        this.element.addEventListener('click', (e) => this.handleClick(e));
        this.element.addEventListener('contextmenu', (e) => this.showPetMenu(e));

        // Drag and drop handlers
        this.element.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.onDrag(e));
        document.addEventListener('mouseup', (e) => this.endDrag(e));

        // Touch support for mobile
        this.element.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
        document.addEventListener('touchend', (e) => this.endDrag(e));
    },

    startDrag(e) {
        if (e.target.closest('.pet-menu')) return;

        e.preventDefault();
        this.isDragging = true;
        this.targetX = null; // Stop any current movement

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = this.element.getBoundingClientRect();

        this.dragOffset.x = clientX - rect.left;
        this.dragOffset.y = clientY - rect.top;

        this.element.style.cursor = 'grabbing';
        this.imgElement.style.transition = 'none';
    },

    onDrag(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const newX = clientX - this.dragOffset.x;
        const newY = window.innerHeight - clientY - (64 - this.dragOffset.y);

        this.position.x = Math.max(0, Math.min(window.innerWidth - 64, newX));
        this.jumpY = Math.max(0, newY - 48);

        this.element.style.left = `${this.position.x}px`;
        this.element.style.bottom = `${48 + this.jumpY}px`;
    },

    endDrag(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.wasDragging = true;
        this.element.style.cursor = 'grab';
        this.imgElement.style.transition = '';

        // If dropped in the air, fall down
        if (this.jumpY > 0) {
            this.isOnGround = false;
            const fallLoop = setInterval(() => {
                this.jumpY -= 8;
                if (this.jumpY <= 0) {
                    this.jumpY = 0;
                    this.isOnGround = true;
                    clearInterval(fallLoop);
                }
                this.updatePosition();
            }, 30);
        }

        // Reset wasDragging after a short delay
        setTimeout(() => {
            this.wasDragging = false;
        }, 100);
    },

    updateSprite() {
        const newSrc = this.getSpritePath(this.state);
        if (this.imgElement.src !== newSrc) {
            this.imgElement.src = newSrc;
        }
        // Flip sprite based on direction
        this.imgElement.style.transform = this.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)';
    },

    updatePosition() {
        this.element.style.left = `${this.position.x}px`;
        this.element.style.bottom = `${48 + this.jumpY}px`;
    },

    startMoveLoop() {
        this.moveInterval = setInterval(() => {
            this.updateMovement();
        }, 50);
    },

    startBehaviorLoop() {
        this.behaviorInterval = setInterval(() => {
            this.decideBehavior();
        }, 2000 + Math.random() * 2000);
    },

    startTipLoop() {
        setTimeout(() => this.showTip(), 3000);

        const scheduleNextTip = () => {
            this.tipInterval = setTimeout(() => {
                this.showTip();
                scheduleNextTip();
            }, 15000 + Math.random() * 10000);
        };
        scheduleNextTip();
    },

    showTip() {
        if (!this.speechBubble || this.state === 'sleep') return;

        let tipIndex;
        do {
            tipIndex = Math.floor(Math.random() * this.tips.length);
        } while (tipIndex === this.lastTipIndex && this.tips.length > 1);

        this.lastTipIndex = tipIndex;
        const tip = this.tips[tipIndex];

        this.speechBubble.textContent = tip;
        this.speechBubble.classList.add('visible');

        setTimeout(() => {
            this.speechBubble.classList.remove('visible');
        }, 5000 + Math.random() * 2000);
    },

    decideBehavior() {
        if (this.isDragging) return;

        if (this.state === 'sleep') {
            if (Math.random() < 0.3) {
                this.setState('idle');
            }
            return;
        }

        const rand = Math.random();

        if (rand < 0.15) {
            // Walk (15%)
            this.walkTo(Math.random() * (window.innerWidth - 100) + 50);
        } else if (rand < 0.50) {
            // Run (35%) - more running!
            this.runTo(Math.random() * (window.innerWidth - 100) + 50);
        } else if (rand < 0.65) {
            // Idle (15%)
            this.setState('idle');
            this.targetX = null;
        } else if (rand < 0.70) {
            // Sleep (5%) - less sleeping
            this.setState('sleep');
            this.targetX = null;
        } else if (rand < 0.90) {
            // Jump (20%) - more jumping!
            this.jump();
        } else {
            // Jump while running (10%)
            this.runTo(Math.random() * (window.innerWidth - 100) + 50);
            setTimeout(() => this.jump(), 200);
        }
    },

    walkTo(x) {
        this.targetX = x;
        this.velocity = 2;
        this.setState('walk');
        this.direction = x > this.position.x ? 1 : -1;
        this.updateSprite();
    },

    runTo(x) {
        this.targetX = x;
        this.velocity = 5;
        this.setState('run');
        this.direction = x > this.position.x ? 1 : -1;
        this.updateSprite();
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
        if (this.targetX === null || this.isDragging) return;

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
        this.updateSprite();
    },

    setState(state) {
        if (this.state !== state) {
            this.state = state;
            this.updateSprite();
        }
    },

    handleClick(e) {
        e.stopPropagation();
        // Don't run if we just finished dragging
        if (this.wasDragging) {
            this.wasDragging = false;
            return;
        }
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
        this.updateSprite();
        this.jump();
        this.savePreferences();
    },

    destroy() {
        if (this.behaviorInterval) clearInterval(this.behaviorInterval);
        if (this.moveInterval) clearInterval(this.moveInterval);
        if (this.tipInterval) clearTimeout(this.tipInterval);
        if (this.element) this.element.remove();
    }
};
