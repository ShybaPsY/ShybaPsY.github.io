// ================================================
// CALCULATOR APP MODULE
// ================================================

export const CalculatorApp = {
    WindowManager: null,
    AchievementManager: null,
    display: '0',
    expression: '',
    hasResult: false,
    mode: 'basic',

    init(WindowManager, AchievementManager) {
        this.WindowManager = WindowManager;
        this.AchievementManager = AchievementManager;
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

        const content = this.renderContent();
        const windowEl = this.WindowManager.createWindow('calculator', 'Calculadora', 320, 450, content);

        this.WindowManager.registerCleanup('calculator', () => this.cleanup());
        this.AchievementManager?.trackApp('calculator');

        this.attachEvents(windowEl);
        this.setupKeyboard(windowEl);
    },

    renderContent() {
        const buttons = this.mode === 'basic' ? this.getBasicButtons() : this.getScientificButtons();

        return `
            <div class="calculator-container">
                <div class="calculator-mode">
                    <button data-mode="basic" class="${this.mode === 'basic' ? 'active' : ''}">Básica</button>
                    <button data-mode="scientific" class="${this.mode === 'scientific' ? 'active' : ''}">Científica</button>
                </div>
                <div class="calculator-display">
                    <div class="calculator-expression">${this.expression || '&nbsp;'}</div>
                    <div class="calculator-result">${this.display}</div>
                </div>
                <div class="calculator-buttons">
                    ${buttons.map(btn => `
                        <button class="calc-btn ${btn.class}" data-action="${btn.action}" data-value="${btn.value || ''}">${btn.label}</button>
                    `).join('')}
                </div>
            </div>
        `;
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

            { label: '0', action: 'number', value: '0', class: 'calc-btn-number' },
            { label: '.', action: 'decimal', class: 'calc-btn-number' },
            { label: '⌫', action: 'backspace', class: 'calc-btn-function' },
            { label: '=', action: 'equals', class: 'calc-btn-equals' }
        ];
    },

    getScientificButtons() {
        return [
            { label: 'sin', action: 'function', value: 'sin', class: 'calc-btn-function' },
            { label: 'cos', action: 'function', value: 'cos', class: 'calc-btn-function' },
            { label: 'tan', action: 'function', value: 'tan', class: 'calc-btn-function' },
            { label: 'π', action: 'constant', value: Math.PI.toString(), class: 'calc-btn-function' },

            { label: '√', action: 'function', value: 'sqrt', class: 'calc-btn-function' },
            { label: 'x²', action: 'function', value: 'square', class: 'calc-btn-function' },
            { label: 'xʸ', action: 'operator', value: '**', class: 'calc-btn-function' },
            { label: 'log', action: 'function', value: 'log', class: 'calc-btn-function' },

            { label: 'C', action: 'clear', class: 'calc-btn-clear' },
            { label: '(', action: 'paren', value: '(', class: 'calc-btn-function' },
            { label: ')', action: 'paren', value: ')', class: 'calc-btn-function' },
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

            { label: '0', action: 'number', value: '0', class: 'calc-btn-number' },
            { label: '.', action: 'decimal', class: 'calc-btn-number' },
            { label: '⌫', action: 'backspace', class: 'calc-btn-function' },
            { label: '=', action: 'equals', class: 'calc-btn-equals' }
        ];
    },

    attachEvents(windowEl) {
        const container = windowEl.querySelector('.calculator-container');
        if (!container) return;

        // Mode buttons
        container.querySelectorAll('.calculator-mode button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mode = btn.dataset.mode;
                this.refresh(windowEl);
            });
        });

        // Calculator buttons
        container.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleButton(btn.dataset.action, btn.dataset.value, windowEl);
            });
        });
    },

    setupKeyboard(windowEl) {
        const handler = (e) => {
            if (!this.WindowManager.windows['calculator']) {
                document.removeEventListener('keydown', handler);
                return;
            }

            const key = e.key;

            if (/^[0-9]$/.test(key)) {
                this.handleButton('number', key, windowEl);
            } else if (key === '.') {
                this.handleButton('decimal', '', windowEl);
            } else if (['+', '-', '*', '/'].includes(key)) {
                this.handleButton('operator', key, windowEl);
            } else if (key === 'Enter' || key === '=') {
                e.preventDefault();
                this.handleButton('equals', '', windowEl);
            } else if (key === 'Backspace') {
                this.handleButton('backspace', '', windowEl);
            } else if (key === 'Escape' || key === 'c' || key === 'C') {
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

            case 'equals':
                if (this.expression) {
                    const expr = this.expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
                    const fullExpr = expr + this.display;
                    try {
                        const result = this.safeEval(fullExpr);
                        this.expression = fullExpr + ' =';
                        this.display = this.formatNumber(result);
                        this.hasResult = true;
                    } catch (e) {
                        this.display = 'Erro';
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

            case 'function':
                const num = parseFloat(this.display);
                let result;
                switch (value) {
                    case 'sin': result = Math.sin(num * Math.PI / 180); break;
                    case 'cos': result = Math.cos(num * Math.PI / 180); break;
                    case 'tan': result = Math.tan(num * Math.PI / 180); break;
                    case 'sqrt': result = Math.sqrt(num); break;
                    case 'square': result = num * num; break;
                    case 'log': result = Math.log10(num); break;
                    default: result = num;
                }
                this.expression = `${value}(${this.display}) =`;
                this.display = this.formatNumber(result);
                this.hasResult = true;
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

    getOperatorSymbol(op) {
        const symbols = { '*': '×', '/': '÷', '-': '−', '+': '+', '**': '^' };
        return symbols[op] || op;
    },

    safeEval(expr) {
        // Simple expression evaluator (no eval)
        const sanitized = expr.replace(/[^0-9+\-*/.() ]/g, '');
        return Function('"use strict"; return (' + sanitized + ')')();
    },

    formatNumber(num) {
        if (isNaN(num) || !isFinite(num)) return 'Erro';
        const str = num.toPrecision(10);
        return parseFloat(str).toString();
    },

    updateDisplay(windowEl) {
        const exprEl = windowEl.querySelector('.calculator-expression');
        const resultEl = windowEl.querySelector('.calculator-result');
        if (exprEl) exprEl.textContent = this.expression || '\u00A0';
        if (resultEl) resultEl.textContent = this.display;
    },

    refresh(windowEl) {
        const body = windowEl.querySelector('.app-window-body');
        if (body) {
            body.innerHTML = this.renderContent();
            this.attachEvents(windowEl);
        }
    },

    cleanup() {}
};
