// ================================================
// CALCULATOR APP MODULE - Enhanced Version
// ================================================

import { t } from '../i18n/i18n.js';

export const CalculatorApp = {
    WindowManager: null,
    AchievementManager: null,
    display: '0',
    expression: '',
    hasResult: false,
    mode: 'basic',
    base: 'DEC',
    history: [],
    historyVisible: false,
    lastAnswer: '0',
    calculusInput: '',
    calculusOutput: '',

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;
        this.loadHistory();
    },

    open() {
        if (this.WindowManager.windows['calculator']) {
            this.WindowManager.focusWindow('calculator');
            return;
        }

        this.display = '0';
        this.expression = '';
        this.hasResult = false;
        this.mode = 'basic';
        this.base = 'DEC';
        this.calculusInput = '';
        this.calculusOutput = '';

        const content = this.renderContent();
        const windowEl = this.WindowManager.createWindow('calculator', 'Calculadora', 420, 620, content);

        this.WindowManager.registerCleanup('calculator', () => this.cleanup());
        this.AchievementManager?.trackApp('calculator');

        this.attachEvents(windowEl);
        this.setupKeyboard(windowEl);
    },

    renderContent() {
        return `
            <div class="calculator-container">
                <div class="calculator-header">
                    <div class="calculator-mode">
                        <button data-mode="basic" class="${this.mode === 'basic' ? 'active' : ''}">${t('calculator.mode_basic')}</button>
                        <button data-mode="scientific" class="${this.mode === 'scientific' ? 'active' : ''}">${t('calculator.mode_scientific')}</button>
                        <button data-mode="programmer" class="${this.mode === 'programmer' ? 'active' : ''}">${t('calculator.mode_programmer')}</button>
                        <button data-mode="calculus" class="${this.mode === 'calculus' ? 'active' : ''}">${t('calculator.mode_calculus')}</button>
                    </div>
                    <button class="calc-history-toggle" title="${t('calculator.history')}">⏱</button>
                </div>
                ${this.mode === 'calculus' ? this.renderCalculusMode() : this.renderStandardMode()}
                ${this.renderHistoryPanel()}
            </div>
        `;
    },

    renderStandardMode() {
        const buttons = this.getButtons();
        const gridClass = this.mode === 'programmer' ? 'programmer-grid' :
                          this.mode === 'scientific' ? 'scientific-grid' : 'basic-grid';
        return `
            ${this.mode === 'programmer' ? this.renderBaseSelector() : ''}
            <div class="calculator-display" title="${t('calculator.click_to_copy')}">
                <div class="calculator-expression">${this.expression || '&nbsp;'}</div>
                <div class="calculator-result">${this.formatDisplayNumber(this.display)}</div>
                ${this.mode === 'programmer' ? this.renderMultiBaseDisplay() : ''}
            </div>
            <div class="calculator-buttons ${gridClass}">
                ${buttons.map(btn => `
                    <button class="calc-btn ${btn.class} ${btn.disabled ? 'disabled' : ''}"
                            data-action="${btn.action}"
                            data-value="${btn.value || ''}"
                            ${btn.disabled ? 'disabled' : ''}>${btn.label}</button>
                `).join('')}
            </div>
            <div class="calc-toast" id="calc-toast">${t('calculator.copied')}</div>
        `;
    },

    renderCalculusMode() {
        return `
            <div class="calculus-container">
                <div class="calculus-input-wrapper">
                    <input type="text" class="calculus-input" placeholder="Ex: x^2 + 3*x - 5" value="${this.calculusInput}">
                    <span class="calculus-hint">Use: x, sin, cos, tan, log, sqrt, ^, pi, e</span>
                </div>
                <div class="calculus-buttons">
                    <button class="calc-btn calc-btn-calculus" data-calculus="integral" title="Integral indefinida">∫ dx</button>
                    <button class="calc-btn calc-btn-calculus" data-calculus="derivative" title="Derivada">d/dx</button>
                    <button class="calc-btn calc-btn-calculus" data-calculus="simplify" title="Simplificar">Simplify</button>
                    <button class="calc-btn calc-btn-calculus" data-calculus="expand" title="Expandir">Expand</button>
                    <button class="calc-btn calc-btn-calculus" data-calculus="factor" title="Fatorar">Factor</button>
                    <button class="calc-btn calc-btn-clear" data-calculus="clear">${t('calculator.clear')}</button>
                </div>
                <div class="calculus-output">
                    <div class="calculus-output-label">${t('calculator.result')}</div>
                    <div class="calculus-output-result" id="mathjax-output">${this.calculusOutput || t('calculator.type_expression')}</div>
                </div>
            </div>
            <div class="calc-toast" id="calc-toast">${t('calculator.copied')}</div>
        `;
    },

    renderBaseSelector() {
        return `
            <div class="calculator-base-selector">
                <button data-base="HEX" class="${this.base === 'HEX' ? 'active' : ''}">HEX</button>
                <button data-base="DEC" class="${this.base === 'DEC' ? 'active' : ''}">DEC</button>
                <button data-base="OCT" class="${this.base === 'OCT' ? 'active' : ''}">OCT</button>
                <button data-base="BIN" class="${this.base === 'BIN' ? 'active' : ''}">BIN</button>
            </div>
        `;
    },

    renderMultiBaseDisplay() {
        const num = this.parseCurrentNumber();
        if (isNaN(num) || !isFinite(num)) {
            return `<div class="calculator-multi-base"><span class="base-error">Invalid</span></div>`;
        }
        const int = Math.floor(Math.abs(num)) * (num < 0 ? -1 : 1);
        return `
            <div class="calculator-multi-base">
                <div class="base-row"><span class="base-label">HEX</span><span class="base-value">${this.toHex(int)}</span></div>
                <div class="base-row"><span class="base-label">DEC</span><span class="base-value">${int.toString()}</span></div>
                <div class="base-row"><span class="base-label">OCT</span><span class="base-value">${this.toOct(int)}</span></div>
                <div class="base-row"><span class="base-label">BIN</span><span class="base-value">${this.toBin(int)}</span></div>
            </div>
        `;
    },

    renderHistoryPanel() {
        return `
            <div class="calculator-history ${this.historyVisible ? 'visible' : ''}">
                <div class="history-header">
                    <button class="history-close" title="${t('calculator.close')}">✕</button>
                    <span>${t('calculator.history')}</span>
                    <button class="history-clear" title="${t('calculator.clear_history')}">🗑</button>
                </div>
                <div class="history-list">
                    ${this.history.length === 0 ?
                        `<div class="history-empty">${t('calculator.no_history')}</div>` :
                        this.history.map((item, i) => `
                            <div class="history-item" data-index="${i}">
                                <div class="history-expr">${item.expr}</div>
                                <div class="history-result">${item.result}</div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    },

    getButtons() {
        switch (this.mode) {
            case 'basic': return this.getBasicButtons();
            case 'scientific': return this.getScientificButtons();
            case 'programmer': return this.getProgrammerButtons();
            default: return this.getBasicButtons();
        }
    },

    getBasicButtons() {
        return [
            { label: 'C', action: 'clear', class: 'calc-btn-clear' },
            { label: '±', action: 'negate', class: 'calc-btn-function' },
            { label: '%', action: 'percent', class: 'calc-btn-function' },
            { label: '÷', action: 'operator', value: '/', class: 'calc-btn-operator' },

            { label: '7', action: 'number', value: '7', class: 'calc-btn-number' },
            { label: '8', action: 'number', value: '8', class: 'calc-btn-number' },
            { label: '9', action: 'number', value: '9', class: 'calc-btn-number' },
            { label: '×', action: 'operator', value: '*', class: 'calc-btn-operator' },

            { label: '4', action: 'number', value: '4', class: 'calc-btn-number' },
            { label: '5', action: 'number', value: '5', class: 'calc-btn-number' },
            { label: '6', action: 'number', value: '6', class: 'calc-btn-number' },
            { label: '−', action: 'operator', value: '-', class: 'calc-btn-operator' },

            { label: '1', action: 'number', value: '1', class: 'calc-btn-number' },
            { label: '2', action: 'number', value: '2', class: 'calc-btn-number' },
            { label: '3', action: 'number', value: '3', class: 'calc-btn-number' },
            { label: '+', action: 'operator', value: '+', class: 'calc-btn-operator' },

            { label: 'ANS', action: 'ans', class: 'calc-btn-function' },
            { label: '0', action: 'number', value: '0', class: 'calc-btn-number' },
            { label: '.', action: 'decimal', class: 'calc-btn-number' },
            { label: '=', action: 'equals', class: 'calc-btn-equals' },

            { label: '⌫', action: 'backspace', class: 'calc-btn-function calc-btn-wide' },
            { label: 'Copiar', action: 'copy', class: 'calc-btn-function calc-btn-wide' }
        ];
    },

    getScientificButtons() {
        return [
            { label: 'sin', action: 'function', value: 'sin', class: 'calc-btn-function' },
            { label: 'cos', action: 'function', value: 'cos', class: 'calc-btn-function' },
            { label: 'tan', action: 'function', value: 'tan', class: 'calc-btn-function' },
            { label: 'π', action: 'constant', value: Math.PI.toString(), class: 'calc-btn-function' },
            { label: 'e', action: 'constant', value: Math.E.toString(), class: 'calc-btn-function' },

            { label: 'sin⁻¹', action: 'function', value: 'asin', class: 'calc-btn-function' },
            { label: 'cos⁻¹', action: 'function', value: 'acos', class: 'calc-btn-function' },
            { label: 'tan⁻¹', action: 'function', value: 'atan', class: 'calc-btn-function' },
            { label: 'ln', action: 'function', value: 'ln', class: 'calc-btn-function' },
            { label: 'log', action: 'function', value: 'log', class: 'calc-btn-function' },

            { label: '√', action: 'function', value: 'sqrt', class: 'calc-btn-function' },
            { label: 'x²', action: 'function', value: 'square', class: 'calc-btn-function' },
            { label: 'xʸ', action: 'operator', value: '**', class: 'calc-btn-function' },
            { label: 'n!', action: 'function', value: 'factorial', class: 'calc-btn-function' },
            { label: '|x|', action: 'function', value: 'abs', class: 'calc-btn-function' },

            { label: 'C', action: 'clear', class: 'calc-btn-clear' },
            { label: '(', action: 'paren', value: '(', class: 'calc-btn-function' },
            { label: ')', action: 'paren', value: ')', class: 'calc-btn-function' },
            { label: '÷', action: 'operator', value: '/', class: 'calc-btn-operator' },
            { label: 'ANS', action: 'ans', class: 'calc-btn-function' },

            { label: '7', action: 'number', value: '7', class: 'calc-btn-number' },
            { label: '8', action: 'number', value: '8', class: 'calc-btn-number' },
            { label: '9', action: 'number', value: '9', class: 'calc-btn-number' },
            { label: '×', action: 'operator', value: '*', class: 'calc-btn-operator' },
            { label: '⌫', action: 'backspace', class: 'calc-btn-function' },

            { label: '4', action: 'number', value: '4', class: 'calc-btn-number' },
            { label: '5', action: 'number', value: '5', class: 'calc-btn-number' },
            { label: '6', action: 'number', value: '6', class: 'calc-btn-number' },
            { label: '−', action: 'operator', value: '-', class: 'calc-btn-operator' },
            { label: '±', action: 'negate', class: 'calc-btn-function' },

            { label: '1', action: 'number', value: '1', class: 'calc-btn-number' },
            { label: '2', action: 'number', value: '2', class: 'calc-btn-number' },
            { label: '3', action: 'number', value: '3', class: 'calc-btn-number' },
            { label: '+', action: 'operator', value: '+', class: 'calc-btn-operator' },
            { label: '%', action: 'percent', class: 'calc-btn-function' },

            { label: '0', action: 'number', value: '0', class: 'calc-btn-number calc-btn-wide' },
            { label: '.', action: 'decimal', class: 'calc-btn-number' },
            { label: '=', action: 'equals', class: 'calc-btn-equals calc-btn-wide' }
        ];
    },

    getProgrammerButtons() {
        const isHex = this.base === 'HEX';
        const isBin = this.base === 'BIN';
        const isOct = this.base === 'OCT';

        return [
            // Row 1: Bitwise operators
            { label: 'AND', action: 'bitwise', value: '&', class: 'calc-btn-bitwise' },
            { label: 'OR', action: 'bitwise', value: '|', class: 'calc-btn-bitwise' },
            { label: 'XOR', action: 'bitwise', value: '^', class: 'calc-btn-bitwise' },
            { label: 'NOT', action: 'bitwise-unary', value: '~', class: 'calc-btn-bitwise' },

            // Row 2: Shifts + Hex A/B
            { label: '<<', action: 'bitwise', value: '<<', class: 'calc-btn-bitwise' },
            { label: '>>', action: 'bitwise', value: '>>', class: 'calc-btn-bitwise' },
            { label: 'A', action: 'hex', value: 'A', class: 'calc-btn-hex', disabled: !isHex },
            { label: 'B', action: 'hex', value: 'B', class: 'calc-btn-hex', disabled: !isHex },

            // Row 3: Hex C-F
            { label: 'C', action: 'hex', value: 'C', class: 'calc-btn-hex', disabled: !isHex },
            { label: 'D', action: 'hex', value: 'D', class: 'calc-btn-hex', disabled: !isHex },
            { label: 'E', action: 'hex', value: 'E', class: 'calc-btn-hex', disabled: !isHex },
            { label: 'F', action: 'hex', value: 'F', class: 'calc-btn-hex', disabled: !isHex },

            // Row 4: 7-9 + operators
            { label: '7', action: 'number', value: '7', class: 'calc-btn-number', disabled: isBin },
            { label: '8', action: 'number', value: '8', class: 'calc-btn-number', disabled: isBin || isOct },
            { label: '9', action: 'number', value: '9', class: 'calc-btn-number', disabled: isBin || isOct },
            { label: '÷', action: 'operator', value: '/', class: 'calc-btn-operator' },

            // Row 5: 4-6
            { label: '4', action: 'number', value: '4', class: 'calc-btn-number', disabled: isBin },
            { label: '5', action: 'number', value: '5', class: 'calc-btn-number', disabled: isBin },
            { label: '6', action: 'number', value: '6', class: 'calc-btn-number', disabled: isBin },
            { label: '×', action: 'operator', value: '*', class: 'calc-btn-operator' },

            // Row 6: 1-3
            { label: '1', action: 'number', value: '1', class: 'calc-btn-number' },
            { label: '2', action: 'number', value: '2', class: 'calc-btn-number', disabled: isBin },
            { label: '3', action: 'number', value: '3', class: 'calc-btn-number', disabled: isBin },
            { label: '−', action: 'operator', value: '-', class: 'calc-btn-operator' },

            // Row 7: 0 and controls
            { label: 'CLR', action: 'clear', class: 'calc-btn-clear' },
            { label: '0', action: 'number', value: '0', class: 'calc-btn-number' },
            { label: '⌫', action: 'backspace', class: 'calc-btn-function' },
            { label: '+', action: 'operator', value: '+', class: 'calc-btn-operator' },

            // Row 8: ANS and equals
            { label: '±', action: 'negate', class: 'calc-btn-function' },
            { label: 'ANS', action: 'ans', class: 'calc-btn-function' },
            { label: '=', action: 'equals', class: 'calc-btn-equals calc-btn-wide' }
        ];
    },

    attachEvents(windowEl) {
        const container = windowEl.querySelector('.calculator-container');
        if (!container) return;

        // Mode buttons
        container.querySelectorAll('.calculator-mode button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mode = btn.dataset.mode;
                this.adjustWindowSize(windowEl);
                this.refresh(windowEl);
            });
        });

        // History toggle
        const historyToggle = container.querySelector('.calc-history-toggle');
        if (historyToggle) {
            historyToggle.addEventListener('click', () => {
                this.historyVisible = !this.historyVisible;
                this.refresh(windowEl);
            });
        }

        // History close
        const historyClose = container.querySelector('.history-close');
        if (historyClose) {
            historyClose.addEventListener('click', (e) => {
                e.stopPropagation();
                this.historyVisible = false;
                this.refresh(windowEl);
            });
        }

        // History clear
        const historyClear = container.querySelector('.history-clear');
        if (historyClear) {
            historyClear.addEventListener('click', (e) => {
                e.stopPropagation();
                this.history = [];
                this.saveHistory();
                this.refresh(windowEl);
            });
        }

        // History items
        container.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const historyItem = this.history[index];
                if (historyItem) {
                    this.display = historyItem.result;
                    this.hasResult = true;
                    this.updateDisplay(windowEl);
                }
            });
            item.addEventListener('dblclick', () => {
                const index = parseInt(item.dataset.index);
                const historyItem = this.history[index];
                if (historyItem && historyItem.fullExpr) {
                    this.expression = historyItem.fullExpr;
                    this.display = historyItem.result;
                    this.hasResult = true;
                    this.updateDisplay(windowEl);
                }
            });
        });

        // Base selector (programmer mode)
        container.querySelectorAll('.calculator-base-selector button').forEach(btn => {
            btn.addEventListener('click', () => {
                const newBase = btn.dataset.base;
                this.convertBase(newBase);
                this.base = newBase;
                this.refresh(windowEl);
            });
        });

        // Calculator buttons with ripple
        container.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.createRipple(e, btn);

                if (btn.dataset.calculus) {
                    this.handleCalculus(btn.dataset.calculus, windowEl);
                } else {
                    this.handleButton(btn.dataset.action, btn.dataset.value, windowEl);
                }
            });
        });

        // Copy on display click
        const displayEl = container.querySelector('.calculator-display');
        if (displayEl) {
            displayEl.addEventListener('click', () => {
                this.copyToClipboard(this.display, windowEl);
            });
        }

        // Calculus input
        const calculusInput = container.querySelector('.calculus-input');
        if (calculusInput) {
            calculusInput.addEventListener('input', (e) => {
                this.calculusInput = e.target.value;
            });
            calculusInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCalculus('simplify', windowEl);
                }
            });
        }

        // Copy calculus output
        const calculusOutput = container.querySelector('.calculus-output-result');
        if (calculusOutput && this.calculusOutput) {
            calculusOutput.style.cursor = 'pointer';
            calculusOutput.title = 'Clique para copiar';
            calculusOutput.addEventListener('click', () => {
                this.copyToClipboard(this.calculusOutput, windowEl);
            });
        }
    },

    createRipple(event, button) {
        const ripple = document.createElement('span');
        ripple.classList.add('calc-ripple');

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    },

    copyToClipboard(text, windowEl) {
        navigator.clipboard.writeText(text).then(() => {
            const toast = windowEl.querySelector('#calc-toast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 1500);
            }
        }).catch(() => {});
    },

    adjustWindowSize(windowEl) {
        const sizes = {
            basic: { width: 420, height: 620 },
            scientific: { width: 480, height: 720 },
            programmer: { width: 450, height: 820 },
            calculus: { width: 500, height: 600 }
        };
        const size = sizes[this.mode] || sizes.basic;
        windowEl.style.width = `${size.width}px`;
        windowEl.style.height = `${size.height}px`;
    },

    setupKeyboard(windowEl) {
        const handler = (e) => {
            if (!this.WindowManager.windows['calculator']) {
                document.removeEventListener('keydown', handler);
                return;
            }

            // Don't capture if calculus input is focused
            if (document.activeElement?.classList.contains('calculus-input')) {
                return;
            }

            const key = e.key;

            if (/^[0-9]$/.test(key)) {
                this.handleButton('number', key, windowEl);
            } else if (/^[a-fA-F]$/.test(key) && this.mode === 'programmer' && this.base === 'HEX') {
                this.handleButton('hex', key.toUpperCase(), windowEl);
            } else if (key === '.') {
                this.handleButton('decimal', '', windowEl);
            } else if (['+', '-', '*', '/'].includes(key)) {
                this.handleButton('operator', key, windowEl);
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                this.handleButton('equals', '', windowEl);
            } else if (key === 'Backspace') {
                this.handleButton('backspace', '', windowEl);
            } else if (key === 'Escape') {
                this.handleButton('clear', '', windowEl);
            }
        };

        document.addEventListener('keydown', handler);
    },

    handleButton(action, value, windowEl) {
        switch (action) {
            case 'number':
                if (this.hasResult) {
                    this.display = value;
                    this.expression = '';
                    this.hasResult = false;
                } else if (this.display === '0') {
                    this.display = value;
                } else {
                    this.display += value;
                }
                break;

            case 'hex':
                if (this.mode === 'programmer' && this.base === 'HEX') {
                    if (this.hasResult) {
                        this.display = value;
                        this.expression = '';
                        this.hasResult = false;
                    } else if (this.display === '0') {
                        this.display = value;
                    } else {
                        this.display += value;
                    }
                }
                break;

            case 'decimal':
                if (this.hasResult) {
                    this.display = '0.';
                    this.expression = '';
                    this.hasResult = false;
                } else if (!this.display.includes('.')) {
                    this.display += '.';
                }
                break;

            case 'operator':
                this.expression = this.display + ' ' + this.getOperatorSymbol(value) + ' ';
                this.display = '0';
                this.hasResult = false;
                break;

            case 'bitwise':
                if (this.mode === 'programmer') {
                    this.expression = this.display + ' ' + value + ' ';
                    this.display = '0';
                    this.hasResult = false;
                }
                break;

            case 'bitwise-unary':
                if (this.mode === 'programmer') {
                    const num = this.parseCurrentNumber();
                    if (!isNaN(num)) {
                        const result = ~num;
                        this.expression = `NOT(${this.display}) =`;
                        this.display = this.formatResultForBase(result);
                        this.hasResult = true;
                        this.addToHistory(this.expression, this.display, this.expression);
                    }
                }
                break;

            case 'equals':
                if (this.expression) {
                    try {
                        let result;
                        if (this.mode === 'programmer') {
                            result = this.evalProgrammer();
                        } else {
                            const expr = this.expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                            const fullExpr = expr + this.display;
                            result = this.safeEval(fullExpr);
                        }
                        const fullExpr = this.expression + this.display;
                        this.expression = fullExpr + ' =';
                        const formattedResult = this.mode === 'programmer'
                            ? this.formatResultForBase(result)
                            : this.formatNumber(result);
                        this.display = formattedResult;
                        this.lastAnswer = formattedResult;
                        this.hasResult = true;
                        this.addToHistory(fullExpr + ' =', formattedResult, fullExpr);
                    } catch (e) {
                        this.display = t('calculator.error');
                    }
                }
                break;

            case 'clear':
                this.display = '0';
                this.expression = '';
                this.hasResult = false;
                break;

            case 'backspace':
                if (this.display.length > 1) {
                    this.display = this.display.slice(0, -1);
                } else {
                    this.display = '0';
                }
                break;

            case 'negate':
                if (this.display !== '0') {
                    this.display = this.display.startsWith('-')
                        ? this.display.slice(1)
                        : '-' + this.display;
                }
                break;

            case 'percent':
                this.display = (parseFloat(this.display) / 100).toString();
                break;

            case 'copy':
                this.copyToClipboard(this.display, windowEl);
                return; // Don't update display

            case 'ans':
                if (this.hasResult) {
                    this.expression = this.lastAnswer + ' ';
                    this.display = '0';
                    this.hasResult = false;
                } else if (this.display === '0') {
                    this.display = this.lastAnswer;
                } else {
                    this.display += this.lastAnswer;
                }
                break;

            case 'function':
                const num = parseFloat(this.display);
                let result;
                switch (value) {
                    case 'sin': result = Math.sin(num * Math.PI / 180); break;
                    case 'cos': result = Math.cos(num * Math.PI / 180); break;
                    case 'tan': result = Math.tan(num * Math.PI / 180); break;
                    case 'asin': result = Math.asin(num) * 180 / Math.PI; break;
                    case 'acos': result = Math.acos(num) * 180 / Math.PI; break;
                    case 'atan': result = Math.atan(num) * 180 / Math.PI; break;
                    case 'sqrt': result = Math.sqrt(num); break;
                    case 'square': result = num * num; break;
                    case 'log': result = Math.log10(num); break;
                    case 'ln': result = Math.log(num); break;
                    case 'factorial': result = this.factorial(num); break;
                    case 'abs': result = Math.abs(num); break;
                    default: result = num;
                }
                const funcExpr = `${value}(${this.display}) =`;
                const funcResult = this.formatNumber(result);
                this.expression = funcExpr;
                this.display = funcResult;
                this.lastAnswer = funcResult;
                this.hasResult = true;
                this.addToHistory(funcExpr, funcResult, funcExpr);
                break;

            case 'constant':
                this.display = this.formatNumber(parseFloat(value));
                break;

            case 'paren':
                if (this.display === '0') {
                    this.display = value;
                } else {
                    this.display += value;
                }
                break;
        }

        this.updateDisplay(windowEl);
    },

    handleCalculus(operation, windowEl) {
        if (operation === 'clear') {
            this.calculusInput = '';
            this.calculusOutput = '';
            this.calculusLatex = '';
            this.refresh(windowEl);
            return;
        }

        if (!this.calculusInput.trim()) {
            this.calculusOutput = t('calculator.type_expression');
            this.refresh(windowEl);
            return;
        }

        try {
            if (typeof Algebrite === 'undefined') {
                this.calculusOutput = t('calculator.algebrite_not_loaded');
                this.refresh(windowEl);
                return;
            }

            let result;
            let latex;
            const input = this.calculusInput;

            switch (operation) {
                case 'integral':
                    result = Algebrite.run(`integral(${input}, x)`);
                    latex = Algebrite.run(`printlatex(integral(${input}, x))`);
                    this.calculusOutput = `$$\\int (${this.toLatex(input)}) \\, dx = ${latex}$$`;
                    break;
                case 'derivative':
                    result = Algebrite.run(`d(${input}, x)`);
                    latex = Algebrite.run(`printlatex(d(${input}, x))`);
                    this.calculusOutput = `$$\\frac{d}{dx}(${this.toLatex(input)}) = ${latex}$$`;
                    break;
                case 'simplify':
                    result = Algebrite.run(`simplify(${input})`);
                    latex = Algebrite.run(`printlatex(simplify(${input}))`);
                    this.calculusOutput = `$$${latex}$$`;
                    break;
                case 'expand':
                    result = Algebrite.run(`expand(${input})`);
                    latex = Algebrite.run(`printlatex(expand(${input}))`);
                    this.calculusOutput = `$$${latex}$$`;
                    break;
                case 'factor':
                    result = Algebrite.run(`factor(${input})`);
                    latex = Algebrite.run(`printlatex(factor(${input}))`);
                    this.calculusOutput = `$$${latex}$$`;
                    break;
            }

            this.addToHistory(`${operation}(${input})`, result.toString(), `${operation}(${input})`);
        } catch (e) {
            this.calculusOutput = t('calculator.error_invalid');
        }

        this.refresh(windowEl);

        // Render MathJax after refresh
        setTimeout(() => {
            if (typeof MathJax !== 'undefined' && MathJax.typeset) {
                const outputEl = windowEl.querySelector('#mathjax-output');
                if (outputEl) {
                    MathJax.typeset([outputEl]);
                }
            }
        }, 50);
    },

    toLatex(expr) {
        // Basic conversion for display
        return expr
            .replace(/\*/g, ' \\cdot ')
            .replace(/\^/g, '^')
            .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
            .replace(/sin\(/g, '\\sin(')
            .replace(/cos\(/g, '\\cos(')
            .replace(/tan\(/g, '\\tan(')
            .replace(/log\(/g, '\\log(')
            .replace(/pi/g, '\\pi')
            .replace(/exp\(/g, 'e^{');
    },

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        if (n > 170) return Infinity;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    },

    // Base conversion methods
    parseCurrentNumber() {
        const val = this.display;
        switch (this.base) {
            case 'HEX': return parseInt(val, 16);
            case 'OCT': return parseInt(val, 8);
            case 'BIN': return parseInt(val, 2);
            default: return parseFloat(val);
        }
    },

    convertBase(newBase) {
        const num = this.parseCurrentNumber();
        if (isNaN(num)) return;
        this.display = this.formatNumberForBase(Math.floor(num), newBase);
    },

    formatNumberForBase(num, base) {
        switch (base) {
            case 'HEX': return this.toHex(num);
            case 'OCT': return this.toOct(num);
            case 'BIN': return this.toBin(num);
            default: return num.toString();
        }
    },

    formatResultForBase(num) {
        return this.formatNumberForBase(Math.floor(num), this.base);
    },

    toHex(n) {
        if (n < 0) {
            return '-' + Math.abs(n).toString(16).toUpperCase();
        }
        return n.toString(16).toUpperCase();
    },

    toOct(n) {
        if (n < 0) {
            return '-' + Math.abs(n).toString(8);
        }
        return n.toString(8);
    },

    toBin(n) {
        if (n < 0) {
            return '-' + Math.abs(n).toString(2);
        }
        return n.toString(2);
    },

    evalProgrammer() {
        const expr = this.expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');

        // Parse numbers according to current base
        const left = this.parseNumberFromExpr(expr.split(/[+\-*\/&|^<>]+/)[0].trim());
        const right = this.parseCurrentNumber();

        // Find operator
        const opMatch = expr.match(/([+\-*\/&|^]|<<|>>)/);
        if (!opMatch) return right;

        const op = opMatch[1];
        switch (op) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return Math.floor(left / right);
            case '&': return left & right;
            case '|': return left | right;
            case '^': return left ^ right;
            case '<<': return left << right;
            case '>>': return left >> right;
            default: return right;
        }
    },

    parseNumberFromExpr(str) {
        str = str.trim();
        switch (this.base) {
            case 'HEX': return parseInt(str, 16);
            case 'OCT': return parseInt(str, 8);
            case 'BIN': return parseInt(str, 2);
            default: return parseFloat(str);
        }
    },

    getOperatorSymbol(op) {
        const symbols = { '*': '×', '/': '÷', '-': '−', '+': '+', '**': '^' };
        return symbols[op] || op;
    },

    safeEval(expr) {
        const withPower = expr.replace(/\^/g, '**');
        const sanitized = withPower.replace(/[^0-9+\-*/.() ]/g, '');
        return Function('"use strict"; return (' + sanitized + ')')();
    },

    formatNumber(num) {
        if (isNaN(num) || !isFinite(num)) return t('calculator.error');
        const str = num.toPrecision(10);
        return parseFloat(str).toString();
    },

    formatDisplayNumber(num) {
        // No thousand separators - just return the number as is
        return num;
    },

    addToHistory(expr, result, fullExpr) {
        this.history.unshift({ expr, result, fullExpr });
        if (this.history.length > 20) {
            this.history.pop();
        }
        this.saveHistory();
    },

    saveHistory() {
        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        } catch (e) {}
    },

    loadHistory() {
        try {
            const saved = localStorage.getItem('calculatorHistory');
            if (saved) {
                this.history = JSON.parse(saved);
            }
        } catch (e) {
            this.history = [];
        }
    },

    updateDisplay(windowEl) {
        const exprEl = windowEl.querySelector('.calculator-expression');
        const resultEl = windowEl.querySelector('.calculator-result');
        if (exprEl) exprEl.textContent = this.expression || '\u00A0';
        if (resultEl) resultEl.textContent = this.formatDisplayNumber(this.display);

        // Update multi-base display in programmer mode
        if (this.mode === 'programmer') {
            const multiBase = windowEl.querySelector('.calculator-multi-base');
            if (multiBase) {
                const num = this.parseCurrentNumber();
                if (!isNaN(num) && isFinite(num)) {
                    const int = Math.floor(Math.abs(num)) * (num < 0 ? -1 : 1);
                    multiBase.innerHTML = `
                        <div class="base-row"><span class="base-label">HEX</span><span class="base-value">${this.toHex(int)}</span></div>
                        <div class="base-row"><span class="base-label">DEC</span><span class="base-value">${int.toString()}</span></div>
                        <div class="base-row"><span class="base-label">OCT</span><span class="base-value">${this.toOct(int)}</span></div>
                        <div class="base-row"><span class="base-label">BIN</span><span class="base-value">${this.toBin(int)}</span></div>
                    `;
                }
            }
        }
    },

    refresh(windowEl) {
        const body = windowEl.querySelector('.app-window-body');
        if (body) {
            body.innerHTML = this.renderContent();
            this.attachEvents(windowEl);
        }
    },

    cleanup() {
        this.saveHistory();
    }
};
