// ================================================
// TERMINAL MODULE
// ================================================

import { aliases } from './aliases.js';
import { TabCompletion } from './tab-completion.js';
import { FuzzySearch } from './fuzzy-search.js';
import { createCommands } from './commands.js';

export const Terminal = {
    // DOM elements
    terminal: null,
    terminalBody: null,
    commandInput: null,
    output: null,
    cursor: null,
    inputMirror: null,

    // Dependencies
    ThemeManager: null,
    WindowManager: null,
    AchievementManager: null,
    MatrixEffect: null,
    commands: null,

    // State
    commandHistory: [],
    historyIndex: 0,
    isCursorLocked: false,
    isMatrixRunning: false,
    welcomeMessage: '',

    // ASCII Art
    asciiArt: `<span class="ascii-art">
.______    _______ .___  ___.    ____    ____  __  .__   __.  _______   ______
|   _  \\  |   ____||   \\/   |    \\   \\  /   / |  | |  \\ |  | |       \\ /  __  \\
|  |_)  | |  |__   |  \\  /  |     \\   \\/   /  |  | |   \\|  | |  .--.  |  |  |  |
|   _  <  |   __|  |  |\\/|  |      \\      /   |  | |  . \`  | |  |  |  |  |  |  |
|  |_)  | |  |____ |  |  |  |       \\    /    |  | |  |\\   | |  '--'  |  \`--'  |
|______/  |_______||__|  |__|        \\__/     |__| |__| \\__| |_______/ \\______/

</span>`,

    init(dependencies) {
        const { ThemeManager, WindowManager, AchievementManager, MatrixEffect, ThemePickerApp, ASCIIPlayerApp, MusicApp, GamesApp, ProjetosApp, GitHubAPI, QuoteAPI } = dependencies;

        this.ThemeManager = ThemeManager;
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;
        this.MatrixEffect = MatrixEffect;

        // Get DOM elements
        this.terminal = document.getElementById('terminal');
        this.terminalBody = document.getElementById('terminal-body');
        this.commandInput = document.getElementById('command-input');
        this.output = document.getElementById('output');
        this.cursor = document.getElementById('cursor');
        this.inputMirror = document.getElementById('input-mirror');

        // Create welcome message
        this.welcomeMessage = this.asciiArt + `
  <span class="highlight">Este é o meu Portfólio Interativo!</span>

  Meu nome é Gabriel Mendes Lopes e sou um Desenvolvedor Fullstack.

  Digite '<span class="output-command">help</span>' para ver a lista de comandos disponíveis.
            `;

        // Create commands with dependencies
        this.commands = createCommands({
            ThemeManager,
            ThemePickerApp,
            ASCIIPlayerApp,
            MusicApp,
            GamesApp,
            ProjetosApp,
            AchievementManager,
            GitHubAPI,
            QuoteAPI,
            welcomeMessage: this.welcomeMessage
        });

        // Initialize tab completion and fuzzy search
        TabCompletion.init(this.commands, aliases, ThemeManager);
        FuzzySearch.init(TabCompletion);

        // Setup event listeners
        this.setupCursorManagement();
        this.setupEventListeners();
    },

    setupCursorManagement() {
        const updateCursorPosition = () => {
            if (this.isCursorLocked) return;

            const isActive = document.activeElement === this.commandInput && !this.commandInput.disabled;
            this.cursor.classList.toggle('cursor-hidden', !isActive);

            if (!isActive) return;

            const selection = typeof this.commandInput.selectionStart === 'number'
                ? this.commandInput.selectionStart
                : this.commandInput.value.length;
            const textBeforeCaret = this.commandInput.value.slice(0, selection) || '\u200b';

            this.inputMirror.textContent = textBeforeCaret.replace(/ /g, '\u00a0');
            this.cursor.style.left = `${this.inputMirror.offsetWidth}px`;
        };

        this.scheduleCursorUpdate = () => window.requestAnimationFrame(updateCursorPosition);

        this.setCursorLock = (shouldLock) => {
            this.isCursorLocked = shouldLock;
            this.cursor.classList.toggle('cursor-hidden', shouldLock);
            if (!shouldLock) {
                this.scheduleCursorUpdate();
            }
        };

        ['input', 'keyup', 'keydown', 'click'].forEach((eventType) => {
            this.commandInput.addEventListener(eventType, this.scheduleCursorUpdate);
        });
        this.commandInput.addEventListener('focus', this.scheduleCursorUpdate);
        this.commandInput.addEventListener('blur', this.scheduleCursorUpdate);
        window.addEventListener('resize', this.scheduleCursorUpdate);
    },

    setupEventListeners() {
        this.commandInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !this.commandInput.disabled) {
                await this.executeCommand(this.commandInput.value);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                if (this.commandInput.value.trim()) {
                    const completed = TabCompletion.complete(this.commandInput.value);
                    this.commandInput.value = completed;
                    this.commandInput.setSelectionRange(completed.length, completed.length);
                    this.scheduleCursorUpdate();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.commandInput.value = this.commandHistory[this.historyIndex];
                    this.commandInput.setSelectionRange(this.commandInput.value.length, this.commandInput.value.length);
                    this.scheduleCursorUpdate();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.commandInput.value = this.commandHistory[this.historyIndex];
                    this.scheduleCursorUpdate();
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.commandInput.value = '';
                    this.scheduleCursorUpdate();
                }
            } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
                TabCompletion.reset();
            }
        });
    },

    escapeHtml(value = '') {
        return value.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return char;
            }
        });
    },

    async typeText(targetElement, text, speed) {
        return new Promise(resolve => {
            let i = 0;
            const start = performance.now();

            const tick = () => {
                const now = performance.now();
                const elapsed = now - start;
                const expectedCount = Math.floor(elapsed / speed);

                while (i < Math.min(expectedCount, text.length)) {
                    targetElement.appendChild(document.createTextNode(text[i]));
                    i++;
                }

                this.terminalBody.scrollTop = this.terminalBody.scrollHeight;

                if (i < text.length) {
                    setTimeout(tick, speed);
                } else {
                    resolve();
                }
            };

            tick();
        });
    },

    async typeNodeContents(targetElement, sourceNode, defaultSpeed) {
        const nodes = Array.from(sourceNode.childNodes);
        for (const node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const speed = node.parentElement.classList.contains('ascii-art') ? 5 : defaultSpeed;
                await this.typeText(targetElement, node.textContent, speed);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const newElement = document.createElement(node.tagName);
                for (const attr of node.attributes) {
                    newElement.setAttribute(attr.name, attr.value);
                }
                targetElement.appendChild(newElement);
                await this.typeNodeContents(newElement, node, defaultSpeed);
            }
        }
    },

    async typeMessage(targetElement, htmlString, speed) {
        const sourceElement = document.createElement('div');
        sourceElement.innerHTML = htmlString;
        await this.typeNodeContents(targetElement, sourceElement, speed);
    },

    async executeCommand(command) {
        this.commandInput.disabled = true;
        this.setCursorLock(true);
        TabCompletion.reset();

        const commandLine = document.createElement('div');
        const sanitizedCommand = this.escapeHtml(command);
        let normalizedCommand = command.toLowerCase().trim();
        commandLine.innerHTML = `<span class="prompt">$&gt;</span><span class="output-command">${sanitizedCommand}</span>`;
        this.output.appendChild(commandLine);

        if (command) this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        this.commandInput.value = '';

        // Track first command achievement
        if (command && this.AchievementManager) {
            this.AchievementManager.check('first_command');
        }

        // Resolve alias if exists
        if (aliases[normalizedCommand]) {
            normalizedCommand = aliases[normalizedCommand];
        }

        // Handle matrix command
        if (normalizedCommand === 'matrix') {
            const matrixStarted = this.MatrixEffect.start();
            const infoLine = document.createElement('div');
            infoLine.classList.add('line', 'output-text');
            infoLine.innerHTML = matrixStarted
                ? "<span class=\"highlight\">Efeito Matrix ativado.</span> Digite '<span class=\"output-command\">clear</span>' para desativar."
                : "<span class=\"comment\">Efeito Matrix já está ativo. Use '<span class=\"output-command\">clear</span>' para desativar.</span>";
            this.output.appendChild(infoLine);

            if (matrixStarted && this.AchievementManager) {
                this.AchievementManager.check('matrix_fan');
            }

            this.commandInput.disabled = false;
            this.commandInput.focus();
            this.setCursorLock(false);
            this.scheduleCursorUpdate();
            this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
            return;
        }

        const responseLine = document.createElement('div');
        responseLine.classList.add('line', 'output-text');

        let responseText;
        let speed = 10;

        // Handle clear command
        if (normalizedCommand === 'clear') {
            const matrixWasRunning = this.MatrixEffect.isRunning;
            if (matrixWasRunning) {
                this.MatrixEffect.stop();
            }

            this.output.innerHTML = '';
            responseText = "Digite '<span class=\"output-command\">help</span>' para ver a lista de comandos disponíveis.";
            if (matrixWasRunning) {
                responseText += "<br><span class=\"comment\">Efeito Matrix desativado.</span>";
            }
        }
        // Handle exit command
        else if (normalizedCommand === 'exit') {
            responseText = "<span class=\"comment\">Fechando terminal...</span>";
            this.output.appendChild(responseLine);
            responseLine.innerHTML = responseText;

            setTimeout(() => {
                // Dispatch event for TerminalControls to handle close
                window.dispatchEvent(new CustomEvent('terminal-closed'));
            }, 500);

            this.commandInput.disabled = false;
            this.setCursorLock(false);
            return;
        }
        // Handle regular commands
        else if (this.commands[normalizedCommand]) {
            const commandValue = this.commands[normalizedCommand];
            if (typeof commandValue === 'function') {
                responseText = await commandValue();
            } else {
                responseText = commandValue;
            }
            if (normalizedCommand === 'help' || normalizedCommand === 'bemvindo') {
                speed = 5;
            }
        }
        // Command not found - try fuzzy search
        else {
            const suggestion = FuzzySearch.getSuggestionMessage(normalizedCommand);
            responseText = `Comando não encontrado: <span class="highlight">${sanitizedCommand}</span>.`;
            if (suggestion) {
                responseText += `\n\n${suggestion}`;
            }
            responseText += `\n\nDigite '<span class="output-command">help</span>' para ver a lista de comandos.`;
        }

        if (responseText) {
            this.output.appendChild(responseLine);
            await this.typeMessage(responseLine, responseText, speed);
        }

        this.commandInput.disabled = false;
        this.commandInput.focus();
        this.setCursorLock(false);
        this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
    },

    async reset() {
        // Clear output
        this.output.innerHTML = '';
        this.commandInput.value = '';
        this.commandHistory = [];
        this.historyIndex = 0;

        // Stop matrix if running
        if (this.MatrixEffect?.isRunning) {
            this.MatrixEffect.stop();
        }

        // Show welcome message
        await this.showWelcome();
    },

    async showWelcome() {
        this.commandInput.disabled = true;
        this.setCursorLock(true);

        const initialLine = document.createElement('div');
        initialLine.classList.add('line', 'output-text');
        this.output.appendChild(initialLine);
        await this.typeMessage(initialLine, this.welcomeMessage, 10);

        this.commandInput.disabled = false;
        this.commandInput.focus();
        this.setCursorLock(false);
    }
};
