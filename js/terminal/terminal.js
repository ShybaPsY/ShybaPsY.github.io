// ================================================
// TERMINAL MODULE
// ================================================

import { t } from '../i18n/i18n.js';
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
    skipTyping: false,
    isTyping: false,
    enterKeyHeld: false,

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
        const { ThemeManager, WindowManager, AchievementManager, MatrixEffect, ThemePickerApp, ASCIIPlayerApp, MusicApp, GamesApp, ProjetosApp, AsciiMirrorApp, AsciiPortrait, GitHubAPI, QuoteAPI } = dependencies;

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

        // O init roda antes de i18n.init() (que só acontece depois da
        // escolha de idioma no boot), então montar a mensagem agora
        // logava quatro "Translation missing" a cada carregamento. O
        // comando 'bemvindo' remonta a mensagem na hora em que é usado,
        // quando as traduções já existem.
        this.welcomeMessage = '';

        // Create commands with dependencies
        this.commands = createCommands({
            ThemeManager,
            WindowManager,
            ThemePickerApp,
            ASCIIPlayerApp,
            MusicApp,
            GamesApp,
            ProjetosApp,
            AsciiMirrorApp,
            AsciiPortrait,
            AchievementManager,
            GitHubAPI,
            QuoteAPI,
            // Função, não string: a mensagem é montada no momento do uso,
            // com as traduções do idioma que o usuário escolheu.
            welcomeMessage: () => this.buildWelcomeMessage()
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
        // Track Enter key state to distinguish between initial command submit and skip request
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // Only skip if: we're typing, input is disabled, AND this is a fresh press (not held from command submit)
                if (this.commandInput.disabled && this.isTyping && !this.enterKeyHeld) {
                    this.skipTyping = true;
                }
                this.enterKeyHeld = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.enterKeyHeld = false;
            }
        });

        this.commandInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !this.commandInput.disabled) {
                this.enterKeyHeld = true; // Mark Enter as held before executing
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
                    this.commandInput.setSelectionRange(this.commandInput.value.length, this.commandInput.value.length);
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

    // Resolve um comando para { handler, args, base }: tenta a string exata
    // primeiro (ex: "download cv") e depois primeira palavra + argumentos
    // (ex: "theme dracula" -> theme(["dracula"])). Retorna null se não existir.
    resolveCommand(normalizedCommand) {
        if (this.commands[normalizedCommand]) {
            return { handler: this.commands[normalizedCommand], args: [], base: normalizedCommand };
        }

        if (normalizedCommand.includes(' ')) {
            const parts = normalizedCommand.split(/\s+/);
            let base = parts[0];
            if (aliases[base]) base = aliases[base];
            if (this.commands[base]) {
                return { handler: this.commands[base], args: parts.slice(1), base };
            }
        }

        return null;
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
                // Check if skip was requested
                if (this.skipTyping) {
                    // Append remaining text at once
                    targetElement.appendChild(document.createTextNode(text.slice(i)));
                    this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
                    resolve();
                    return;
                }

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
        // speed 0 = saída instantânea. Algumas respostas são um retrato do
        // sistema num instante (neofetch), não um fluxo sendo digitado —
        // e digitar mil caracteres de arte ASCII levaria vários segundos.
        // Só usado em saídas nossas, nunca em texto vindo do usuário.
        if (!speed) {
            targetElement.innerHTML = htmlString;
            this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
            return;
        }

        const sourceElement = document.createElement('div');
        sourceElement.innerHTML = htmlString;
        await this.typeNodeContents(targetElement, sourceElement, speed);
    },

    async executeCommand(command) {
        // se outra resposta ainda está sendo digitada (ex: comando vindo do
        // Spotlight ou menu de contexto), finaliza a digitação atual primeiro
        // para as saídas não se entrelaçarem
        if (this.isTyping) {
            this.skipTyping = true;
            while (this.isTyping) {
                await new Promise(resolve => setTimeout(resolve, 25));
            }
            this.skipTyping = false;
        }

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
                ? t('terminal.matrix_activated')
                : t('terminal.matrix_already_active');
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
        let speed = 8;
        const resolved = this.resolveCommand(normalizedCommand);

        // Handle clear command
        if (normalizedCommand === 'clear') {
            const matrixWasRunning = this.MatrixEffect.isRunning;
            if (matrixWasRunning) {
                this.MatrixEffect.stop();
            }

            this.output.innerHTML = '';
            responseText = t('terminal.type_help');
            if (matrixWasRunning) {
                responseText += "<br>" + t('terminal.matrix_deactivated');
            }
        }
        // Handle exit command
        else if (normalizedCommand === 'exit') {
            responseText = t('terminal.closing_terminal');
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
        else if (resolved) {
            const { handler, args, base } = resolved;
            if (typeof handler === 'function') {
                responseText = await handler(args);
            } else {
                responseText = handler;
            }
            if (base === 'help' || base === 'bemvindo') {
                speed = 5;
            }
            if (base === 'neofetch') {
                speed = 0;
            }
        }
        // Command not found - try fuzzy search
        else {
            const suggestion = FuzzySearch.getSuggestionMessage(normalizedCommand);
            responseText = t('terminal.command_not_found', { command: sanitizedCommand });
            if (suggestion) {
                responseText += `\n\n${suggestion}`;
            }
            responseText += `\n\n${t('terminal.type_help')}`;
        }

        if (responseText) {
            this.output.appendChild(responseLine);
            this.isTyping = true;
            await this.typeMessage(responseLine, responseText, speed);
            this.isTyping = false;
        }

        this.skipTyping = false;
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

        // Rebuild welcome message with current translations
        this.welcomeMessage = this.buildWelcomeMessage();

        const initialLine = document.createElement('div');
        initialLine.classList.add('line', 'output-text');
        this.output.appendChild(initialLine);
        this.isTyping = true;
        await this.typeMessage(initialLine, this.welcomeMessage, 8);
        this.isTyping = false;

        this.skipTyping = false;
        this.commandInput.disabled = false;
        this.commandInput.focus();
        this.setCursorLock(false);
    },

    buildWelcomeMessage() {
        // O banner largo tem 78 colunas e não cabe num celular. Abaixo de
        // 760px entra a versão de 51 colunas, que ainda é legível.
        const artKey = window.innerWidth < 760
            ? 'terminal.ascii_art_compact'
            : 'terminal.ascii_art';

        return t(artKey) + `
  <span class="highlight">${t('terminal.welcome_intro')}</span>

  ${t('terminal.welcome_name')}

  ${t('terminal.welcome_help')}
            `;
    }
};
