// ================================================
// TERMINAL PORTFOLIO - MAIN SCRIPT
// Gabriel Mendes Lopes
// ================================================

document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const terminal = document.getElementById('terminal');
    const terminalHeader = document.getElementById('terminal-header');
    const output = document.getElementById('output');
    const commandInput = document.getElementById('command-input');
    const terminalBody = document.getElementById('terminal-body');
    const cursor = document.getElementById('cursor');
    const inputMirror = document.getElementById('input-mirror');
    const pageBody = document.body;

    let isCursorLocked = false;

    // === THEME MANAGER ===
    const ThemeManager = {
        themes: {
            'tokyo-night': { name: 'Tokyo Night', description: 'Dark blue with vibrant colors (default)' },
            'dracula': { name: 'Dracula', description: 'Classic purple-based dark theme' },
            'gruvbox': { name: 'Gruvbox', description: 'Warm retro colors' },
            'nord': { name: 'Nord', description: 'Cool arctic-inspired palette' },
            'cyberpunk': { name: 'Cyberpunk', description: 'Futuristic neon vibes' },
            'matrix': { name: 'Matrix', description: 'Green on black hacker style' },
            'catppuccin': { name: 'Catppuccin', description: 'Soothing pastel colors' }
        },
        current: 'tokyo-night',

        apply(themeName) {
            const theme = this.themes[themeName];
            if (!theme) {
                return `<span class="error">Theme "${themeName}" not found.</span>\n\nAvailable themes: ${Object.keys(this.themes).join(', ')}`;
            }

            if (themeName === 'tokyo-night') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', themeName);
            }

            this.current = themeName;
            return `Theme changed to: <span class="highlight">${theme.name}</span>`;
        },

        list() {
            let output = '<span class="highlight">Available Themes:</span>\n\n';
            for (const [key, theme] of Object.entries(this.themes)) {
                const marker = key === this.current ? ' <span class="detail-green">(current)</span>' : '';
                output += `  <span class="output-command">${key}</span>${marker}\n    ${theme.description}\n\n`;
            }
            output += `Use '<span class="output-command">theme [name]</span>' to switch themes.`;
            return output;
        }
    };

    // === DRAG FUNCTIONALITY ===
    if (terminal && terminalHeader) {
        const dragState = {
            isDragging: false,
            offsetX: 0,
            offsetY: 0
        };

        const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

        const getEventPosition = (event) => {
            if (event.touches && event.touches.length > 0) {
                const touch = event.touches[0];
                return { x: touch.clientX, y: touch.clientY };
            }
            if (event.changedTouches && event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                return { x: touch.clientX, y: touch.clientY };
            }
            if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
                return { x: event.clientX, y: event.clientY };
            }
            return null;
        };

        const setTerminalPosition = (left, top) => {
            const bodyRect = pageBody.getBoundingClientRect();
            const maxLeft = Math.max(bodyRect.width - terminal.offsetWidth, 0);
            const maxTop = Math.max(bodyRect.height - terminal.offsetHeight, 0);
            const boundedLeft = clamp(left, 0, maxLeft);
            const boundedTop = clamp(top, 0, maxTop);

            terminal.style.left = `${boundedLeft}px`;
            terminal.style.top = `${boundedTop}px`;
        };

        const ensureTerminalWithinViewport = () => {
            const parsedLeft = parseFloat(terminal.style.left);
            const parsedTop = parseFloat(terminal.style.top);
            const currentLeft = Number.isFinite(parsedLeft) ? parsedLeft : terminal.offsetLeft;
            const currentTop = Number.isFinite(parsedTop) ? parsedTop : terminal.offsetTop;
            setTerminalPosition(currentLeft, currentTop);
        };

        const centerTerminal = () => {
            const bodyRect = pageBody.getBoundingClientRect();
            const centeredLeft = (bodyRect.width - terminal.offsetWidth) / 2;
            const centeredTop = (bodyRect.height - terminal.offsetHeight) / 2;
            setTerminalPosition(centeredLeft, centeredTop);
        };

        const startDragging = (event) => {
            if (event.type === 'mousedown' && event.button !== 0) return;

            const position = getEventPosition(event);
            if (!position) return;

            const terminalRect = terminal.getBoundingClientRect();
            dragState.isDragging = true;
            dragState.offsetX = position.x - terminalRect.left;
            dragState.offsetY = position.y - terminalRect.top;

            terminalHeader.classList.add('dragging');
            pageBody.classList.add('dragging-terminal');

            if (event.type === 'touchstart') {
                event.preventDefault();
            }
        };

        const handleDragging = (event) => {
            if (!dragState.isDragging) return;

            const position = getEventPosition(event);
            if (!position) return;

            const bodyRect = pageBody.getBoundingClientRect();
            const nextLeft = position.x - dragState.offsetX - bodyRect.left;
            const nextTop = position.y - dragState.offsetY - bodyRect.top;

            setTerminalPosition(nextLeft, nextTop);

            if (event.type === 'touchmove') {
                event.preventDefault();
            }
        };

        const stopDragging = () => {
            if (!dragState.isDragging) return;

            dragState.isDragging = false;
            terminalHeader.classList.remove('dragging');
            pageBody.classList.remove('dragging-terminal');
        };

        terminalHeader.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', handleDragging);
        document.addEventListener('mouseup', stopDragging);
        terminalHeader.addEventListener('touchstart', startDragging, { passive: false });
        document.addEventListener('touchmove', handleDragging, { passive: false });
        document.addEventListener('touchend', stopDragging);
        document.addEventListener('touchcancel', stopDragging);
        window.addEventListener('blur', stopDragging);

        window.addEventListener('resize', () => {
            if (!dragState.isDragging) {
                ensureTerminalWithinViewport();
            }
        });

        requestAnimationFrame(() => {
            terminal.style.position = 'absolute';
            terminal.style.margin = '0';
            centerTerminal();
        });
    }

    // === RESIZE FUNCTIONALITY ===
    if (terminal) {
        const MIN_WIDTH = 400;
        const MIN_HEIGHT = 300;

        const resizeState = {
            isResizing: false,
            direction: null,
            startX: 0,
            startY: 0,
            startWidth: 0,
            startHeight: 0,
            startLeft: 0,
            startTop: 0
        };

        const resizeHandles = terminal.querySelectorAll('.resize-handle');

        const getResizeEventPosition = (event) => {
            if (event.touches && event.touches.length > 0) {
                return { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }
            if (event.changedTouches && event.changedTouches.length > 0) {
                return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
            }
            if (typeof event.clientX === 'number') {
                return { x: event.clientX, y: event.clientY };
            }
            return null;
        };

        const startResize = (event) => {
            const handle = event.target;
            if (!handle.dataset.resize) return;

            event.preventDefault();
            event.stopPropagation();

            const position = getResizeEventPosition(event);
            if (!position) return;

            const rect = terminal.getBoundingClientRect();

            resizeState.isResizing = true;
            resizeState.direction = handle.dataset.resize;
            resizeState.startX = position.x;
            resizeState.startY = position.y;
            resizeState.startWidth = rect.width;
            resizeState.startHeight = rect.height;
            resizeState.startLeft = parseFloat(terminal.style.left) || 0;
            resizeState.startTop = parseFloat(terminal.style.top) || 0;

            pageBody.classList.add('resizing-terminal');
            pageBody.style.cursor = window.getComputedStyle(handle).cursor;
        };

        const handleResize = (event) => {
            if (!resizeState.isResizing) return;

            const position = getResizeEventPosition(event);
            if (!position) return;

            const deltaX = position.x - resizeState.startX;
            const deltaY = position.y - resizeState.startY;
            const dir = resizeState.direction;

            let newWidth = resizeState.startWidth;
            let newHeight = resizeState.startHeight;
            let newLeft = resizeState.startLeft;
            let newTop = resizeState.startTop;

            // Handle horizontal resize
            if (dir.includes('e')) {
                newWidth = Math.max(MIN_WIDTH, resizeState.startWidth + deltaX);
            }
            if (dir.includes('w')) {
                const potentialWidth = resizeState.startWidth - deltaX;
                if (potentialWidth >= MIN_WIDTH) {
                    newWidth = potentialWidth;
                    newLeft = resizeState.startLeft + deltaX;
                }
            }

            // Handle vertical resize
            if (dir.includes('s')) {
                newHeight = Math.max(MIN_HEIGHT, resizeState.startHeight + deltaY);
            }
            if (dir.includes('n')) {
                const potentialHeight = resizeState.startHeight - deltaY;
                if (potentialHeight >= MIN_HEIGHT) {
                    newHeight = potentialHeight;
                    newTop = resizeState.startTop + deltaY;
                }
            }

            // Apply new dimensions
            terminal.style.width = `${newWidth}px`;
            terminal.style.height = `${newHeight}px`;
            terminal.style.maxWidth = 'none';
            terminal.style.maxHeight = 'none';
            terminal.style.left = `${newLeft}px`;
            terminal.style.top = `${newTop}px`;
        };

        const stopResize = () => {
            if (!resizeState.isResizing) return;

            resizeState.isResizing = false;
            resizeState.direction = null;
            pageBody.classList.remove('resizing-terminal');
            pageBody.style.cursor = '';
        };

        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', startResize);
            handle.addEventListener('touchstart', startResize, { passive: false });
        });

        document.addEventListener('mousemove', handleResize);
        document.addEventListener('touchmove', handleResize, { passive: false });
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        document.addEventListener('touchcancel', stopResize);
    }

    // === CURSOR MANAGEMENT ===
    const updateCursorPosition = () => {
        if (isCursorLocked) return;

        const isActive = document.activeElement === commandInput && !commandInput.disabled;
        cursor.classList.toggle('cursor-hidden', !isActive);

        if (!isActive) return;

        const selection = typeof commandInput.selectionStart === 'number'
            ? commandInput.selectionStart
            : commandInput.value.length;
        const textBeforeCaret = commandInput.value.slice(0, selection) || '\u200b';

        inputMirror.textContent = textBeforeCaret.replace(/ /g, '\u00a0');
        cursor.style.left = `${inputMirror.offsetWidth}px`;
    };

    const scheduleCursorUpdate = () => window.requestAnimationFrame(updateCursorPosition);

    const setCursorLock = (shouldLock) => {
        isCursorLocked = shouldLock;
        cursor.classList.toggle('cursor-hidden', shouldLock);
        if (!shouldLock) {
            scheduleCursorUpdate();
        }
    };

    ['input', 'keyup', 'keydown', 'click'].forEach((eventType) => {
        commandInput.addEventListener(eventType, scheduleCursorUpdate);
    });
    commandInput.addEventListener('focus', scheduleCursorUpdate);
    commandInput.addEventListener('blur', scheduleCursorUpdate);
    window.addEventListener('resize', scheduleCursorUpdate);

    // === STATE MANAGEMENT ===
    let commandHistory = [];
    let historyIndex = 0;
    let isMatrixRunning = false;

    // === HELPERS ===
    const escapeHtml = (value = '') => value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return char;
        }
    });

    // === ASCII ART AND WELCOME MESSAGE ===
    const asciiArt = `<span class="ascii-art">
.______    _______ .___  ___.    ____    ____  __  .__   __.  _______   ______
|   _  \\  |   ____||   \\/   |    \\   \\  /   / |  | |  \\ |  | |       \\ /  __  \\
|  |_)  | |  |__   |  \\  /  |     \\   \\/   /  |  | |   \\|  | |  .--.  |  |  |  |
|   _  <  |   __|  |  |\\/|  |      \\      /   |  | |  . \`  | |  |  |  |  |  |  |
|  |_)  | |  |____ |  |  |  |       \\    /    |  | |  |\\   | |  '--'  |  \`--'  |
|______/  |_______||__|  |__|        \\__/     |__| |__| \\__| |_______/ \\______/

</span>`;

    const welcomeMessage = asciiArt + `
  <span class="highlight">Este é o meu Portfólio Interativo!</span>

  Meu nome é Gabriel Mendes Lopes e sou um Desenvolvedor Fullstack.

  Digite '<span class="output-command">help</span>' para ver a lista de comandos disponíveis.
            `;

    // === COMMANDS OBJECT ===
    const commands = {
        help: `
  <span class="highlight">Comandos Disponíveis:</span>

  <span class="title-blue">Portfolio:</span>
  <span class="output-command">sobre</span>          - Mostra informações sobre mim.
  <span class="output-command">experiencia</span>    - Exibe minha experiência profissional.
  <span class="output-command">projetos</span>       - Lista meus principais projetos.
  <span class="output-command">skills</span>         - Lista minhas habilidades técnicas e interpessoais.
  <span class="output-command">cursos</span>         - Exibe meus cursos e certificações.
  <span class="output-command">idiomas</span>        - Lista os idiomas que eu falo.
  <span class="output-command">contato</span>        - Exibe minhas informações de contato.
  <span class="output-command">download cv</span>    - Link para baixar meu currículo.

  <span class="title-blue">Exploração:</span>
  <span class="output-command">ls</span>             - Lista arquivos e diretórios disponíveis.
  <span class="output-command">tree</span>           - Mostra estrutura em árvore do portfolio.
  <span class="output-command">neofetch</span>       - Informações do sistema (estilo Linux).

  <span class="title-blue">Customization:</span>
  <span class="output-command">themes</span>         - Lista os temas disponíveis.
  <span class="output-command">theme [nome]</span>   - Muda o tema do terminal.

  <span class="title-blue">Utilities:</span>
  <span class="output-command">clear</span>          - Limpa a tela.
  <span class="output-command">bemvindo</span>       - Mostra a mensagem de boas-vindas novamente.
  <span class="output-command">secret</span>         - Descubra comandos escondidos.

  <span class="title-blue">Tips:</span>
  <span class="detail-green">Tab</span>            - Autocompleta comandos e temas.
  <span class="detail-green">↑/↓</span>            - Navega no histórico de comandos.
  <span class="comment">Aliases: about, cls, cv, contact, projects, exp, ?, etc.</span>`,

        sobre: `
  <span class="highlight">Sobre Mim</span>

  Olá! Sou Gabriel Mendes Lopes, um <span class="title-blue">desenvolvedor fullstack</span> apaixonado por criar soluções eficientes, escaláveis e robustas.
  Atualmente, estou no 5º termo do curso de <span class="title-blue">Sistemas de Informação na FIPP</span> (Faculdade de Informática de Presidente Prudente).
  Resido em Anhumas, SP.

  Sou Bolsista de Iniciação Tecnológica do CNPq na <a href="https://www.fct.unesp.br/" target="_blank">FCT Unesp</a>.

  Tenho interesse em desenvolvimento de aplicações e automações.
  Sou proativo, dedicado e estou sempre em busca de aprendizado contínuo para me tornar um profissional de excelência.`,

        experiencia: `
  <span class="highlight">Experiência Profissional</span>

  <span class="output-command">Bolsista de Iniciação Tecnológica (PIBITI) - Unesp</span>
  <span class="comment">Setembro 2025 - Setembro 2026 (1 ano)</span>

  - Responsável pelo desenvolvimento e automação de equipamentos para medição de propriedades piezoelétricas (d33) em polímeros.

  - Desenvolvimento de software de controle em malha fechada com Arduino para integrar e gerenciar atuadores pneumáticos e sensores de carga.

  - Prototipagem, execução de testes sistemáticos para validação do equipamento e preparação da documentação para registro de patente e software.`,

        projetos: `
  <span class="highlight">Meus Projetos</span>

  1. <span class="title-blue">Sistema de Registro de Novo Colaborador</span>
     - <span class="detail-green">Descrição:</span> Sistema multi-tenant para registro de admissão de funcionários, permitindo que contadores gerenciem formulários únicos e coletem informações de colaboradores de forma segura.
     - <span class="detail-green">Tecnologias:</span> HTML, CSS (TailwindCSS), JavaScript, Supabase (PostgreSQL), Vercel Serverless Functions.

  2. <span class="title-blue">Piezo Peak Analyzer (PPA)</span>
     - <span class="detail-green">Descrição:</span> Aplicação desktop para análise e visualização de medições de sensores piezoelétricos, com detecção de picos, cálculo de potência e gráficos interativos sincronizados.
     - <span class="detail-green">Tecnologias:</span> Java 24, JavaFX, Maven, BigDecimal (alta precisão numérica).

  3. <span class="title-blue">Absorbance Point Analyzer (APA)</span>
     - <span class="detail-green">Descrição:</span> Sistema de análise de dados de espectroscopia de absorbância para detecção de picos e cálculo da proporção de fase beta em análises cristalográficas.
     - <span class="detail-green">Tecnologias:</span> Java 24, JavaFX, Maven, ControlsFX, ValidatorFX.`,

        skills: `
  <span class="highlight">Habilidades Técnicas e Interpessoais</span>

  <span class="title-blue">Hard Skills (Técnicas):</span>
  - <span class="output-command">Linguagens:</span> Java, C, C++, Go, JavaScript, Python.
  - <span class="output-command">Bancos de Dados:</span> PostgreSQL, MongoDB, MySQL.
  - <span class="output-command">DevOps & Ferramentas:</span> Git, CI/CD, Nginx.
  - <span class="output-command">Cloud:</span> Google Cloud, Microsoft Azure (AZ-900).
  - <span class="output-command">Análise de Dados:</span> Power BI.
  - <span class="output-command">Arquitetura:</span> Microsserviços, APIs RESTful.

  <span class="title-blue">Soft Skills (Interpessoais):</span>
  - Comunicação, Resolução de Problemas, Proatividade, Trabalho em Equipe, Negociação.`,

        cursos: `
  <span class="highlight">Cursos e Certificações</span>

  - <span class="title-blue">2024:</span> Curso Completo de Linguagem C e C++ <span class="detail-green">(UDEMY)</span>
  - <span class="title-blue">2024:</span> Power BI <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2024:</span> Python 1 <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2024:</span> Soluções Integradas com IoT <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2023:</span> Implantação de Serviços de IA em Nuvem - Google Cloud AI <span class="detail-green">(SENAI)</span>
  - <span class="title-blue">2023:</span> Implantação de Serviços em Nuvem - Microsoft AZ-900 <span class="detail-green">(SENAI)</span>`,

        idiomas: `
  <span class="highlight">Idiomas</span>

  - <span class="title-blue">Português:</span> <span class="detail-green">Nativo</span>
  - <span class="title-blue">Inglês:</span> <span class="detail-green">Avançado (Nível C1)</span>
  - <span class="title-blue">Espanhol:</span> <span class="detail-green">Básico</span>`,

        contato: `
  <span class="highlight">Entre em Contato</span>

  - <span class="title-blue">Email:</span> <a href="mailto:asdgabrielmlopes@gmail.com">asdgabrielmlopes@gmail.com</a>
  - <span class="title-blue">WhatsApp:</span> <a href="https://wa.me/5518996189978?text=Ol%C3%A1%2C%20vim%20pelo%20seu%20portif%C3%B3lio" target="_blank">+55 18 99618-9978</a>
  - <span class="title-blue">LinkedIn:</span> <a href="https://www.linkedin.com/in/gabriel-lopes-18b839270/" target="_blank">linkedin.com/in/gabriel-lopes-18b839270/</a>
  - <span class="title-blue">GitHub:</span> <a href="https://github.com/ShybaPsY" target="_blank">github.com/ShybaPsY</a>`,

        'download cv': `
  <span class="highlight">Download do Currículo</span>

  Clique no link abaixo para baixar meu CV em formato PDF.

  <span class="title-blue">Link:</span> <a href="Currículo - Gabriel Lopes.pdf" target="_blank">Gabriel_Mendes_Lopes_CV.pdf</a>`,

        bemvindo: welcomeMessage,

        // === File System Style Commands ===
        ls: `
  <span class="highlight">Diretórios e Arquivos Disponíveis:</span>

  <span class="detail-cyan">📁 portfolio/</span>
    <span class="output-command">sobre.txt</span>         - Informações pessoais
    <span class="output-command">experiencia.md</span>   - Histórico profissional
    <span class="output-command">projetos.json</span>    - Portfólio de projetos
    <span class="output-command">skills.yaml</span>      - Competências técnicas
    <span class="output-command">cursos.csv</span>       - Certificações
    <span class="output-command">idiomas.txt</span>      - Fluência linguística

  <span class="detail-cyan">📁 contato/</span>
    <span class="output-command">email.lnk</span>        - Endereço de e-mail
    <span class="output-command">linkedin.url</span>     - Perfil profissional
    <span class="output-command">github.url</span>       - Repositórios

  <span class="detail-cyan">📄 curriculo.pdf</span>      - Currículo completo

  <span class="comment">Use os comandos para "abrir" cada arquivo</span>`,

        tree: `
  <span class="highlight">Estrutura do Portfolio:</span>

  <span class="detail-cyan">.</span>
  ├── <span class="detail-green">README.md</span>
  ├── <span class="detail-cyan">portfolio/</span>
  │   ├── sobre.txt
  │   ├── experiencia.md
  │   ├── projetos.json
  │   ├── skills.yaml
  │   ├── cursos.csv
  │   └── idiomas.txt
  ├── <span class="detail-cyan">contato/</span>
  │   ├── email.lnk
  │   ├── linkedin.url
  │   └── github.url
  ├── <span class="detail-cyan">config/</span>
  │   └── themes.conf
  └── curriculo.pdf

  3 directories, 11 files`,

        neofetch: `
  <span class="detail-cyan">      ___           ___       </span>     <span class="detail-green">gabriel@portfolio</span>
  <span class="detail-cyan">     /  /\\         /__/\\      </span>     <span class="comment">─────────────────</span>
  <span class="detail-cyan">    /  /:/_       |  |::\\     </span>     <span class="title-blue">OS:</span> Portfolio v2.0
  <span class="detail-cyan">   /  /:/ /\\      |  |:|:\\    </span>     <span class="title-blue">Host:</span> GitHub Pages
  <span class="detail-cyan">  /  /:/_/::\\   __|__|:|\\:\\   </span>     <span class="title-blue">Kernel:</span> JavaScript ES6+
  <span class="detail-cyan"> /__/:/__\\/\\:\\ /__/::::| \\:\\  </span>     <span class="title-blue">Uptime:</span> ${Math.floor((Date.now() - performance.timing.navigationStart) / 1000)} seconds
  <span class="detail-cyan"> \\  \\:\\ /~~/:/ \\  \\:\\~~\\__\\/  </span>     <span class="title-blue">Shell:</span> terminal.js
  <span class="detail-cyan">  \\  \\:\\  /:/   \\  \\:\\        </span>     <span class="title-blue">Theme:</span> ${ThemeManager.current}
  <span class="detail-cyan">   \\  \\:\\/:/     \\  \\:\\       </span>     <span class="title-blue">Terminal:</span> Fira Code
  <span class="detail-cyan">    \\  \\::/       \\  \\:\\      </span>     <span class="title-blue">CPU:</span> Full-Stack Developer
  <span class="detail-cyan">     \\__\\/         \\__\\/      </span>     <span class="title-blue">Memory:</span> Infinito
                                    <span class="title-blue">Location:</span> Anhumas, SP
                                    <span class="title-blue">Languages:</span> PT, EN, ES`,

        // === Easter Eggs ===
        sudo: `
  <span class="error">Acesso Negado.</span>

  Usuário não está no arquivo sudoers. Este incidente será reportado. ;)`,

        coffee: `
  <span class="detail-cyan">
      ( (
       ) )
    ........
    |      |]
    \\      /
     \`----'
  </span>
  <span class="highlight">☕ Pegando um café...</span>

  <span class="comment">Programador sem café = erro de compilação!</span>`,

        hack: async function() {
            const lines = [
                '<span class="detail-green">[✓] Inicializando sequência de hack...</span>',
                '<span class="comment">Conectando ao mainframe...</span>',
                '<span class="detail-cyan">Bypassing firewall... █████████░ 90%</span>',
                '<span class="detail-green">[✓] Firewall bypassed</span>',
                '<span class="comment">Descriptografando senha...</span>',
                '<span class="detail-cyan">Cracking password... ████████░░ 80%</span>',
                '<span class="detail-green">[✓] Senha obtida: hunter2</span>',
                '<span class="comment">Acessando banco de dados...</span>',
                '<span class="detail-green">[✓] Acesso concedido!</span>',
                '',
                '<span class="highlight">🎉 Você hackeou o mainframe!</span>',
                '<span class="comment">Brincadeira, isso é só um easter egg 😄</span>'
            ];
            return lines.join('\n');
        },

        '42': `
  <span class="highlight">A Resposta para a Vida, o Universo e Tudo Mais:</span>

  <span class="detail-cyan" style="font-size: 2em;">42</span>

  <span class="comment">"Don't Panic!" - Guia do Mochileiro das Galáxias</span>`,

        vim: `
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~              VIM - Vi IMproved                     </span>
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~             version 8.2.0000                       </span>
  <span class="detail-cyan">~        by Bram Moolenaar et al.                    </span>
  <span class="detail-cyan">~                                                    </span>
  <span class="detail-cyan">~                                                    </span>

  <span class="comment">Para sair do Vim, digite ':q' (brincadeira, use 'clear')</span>
  <span class="highlight">Você está preso no Vim!</span> 😱`,

        sl: `
  <span class="detail-cyan">
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|
   /     |  |   H  |  |     |   |         ||_| |_||
  |      |  |   H  |__--------------------| [___] |
  |  ______|___H__/__|_____/[][]~\\_______|       |
  |/ |   |-----------I_____I [][] []  D   |=======|__
__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/
  </span>
  <span class="comment">Você digitou 'sl' em vez de 'ls'!</span>
  <span class="highlight">🚂 Choo choo!</span>`,

        secret: `
  <span class="highlight">🎉 Você encontrou um comando secreto!</span>

  <span class="detail-cyan">Easter eggs disponíveis:</span>
  - <span class="output-command">sudo</span> - Tente ser root
  - <span class="output-command">coffee</span> - Pegue um café
  - <span class="output-command">hack</span> - Hackeie o mainframe
  - <span class="output-command">42</span> - A resposta definitiva
  - <span class="output-command">vim</span> - Entre no Vim
  - <span class="output-command">sl</span> - Trem ASCII
  - <span class="output-command">matrix</span> - Efeito Matrix

  <span class="comment">Continue explorando para achar mais!</span>`,
    };

    // === COMMAND ALIASES ===
    const aliases = {
        // Clear aliases
        'cls': 'clear',
        'limpar': 'clear',
        // About aliases
        'about': 'sobre',
        'whoami': 'sobre',
        // Experience aliases
        'exp': 'experiencia',
        'experience': 'experiencia',
        'trabalho': 'experiencia',
        // Projects aliases
        'projects': 'projetos',
        'portfolio': 'projetos',
        // Skills aliases
        'habilidades': 'skills',
        'tecnologias': 'skills',
        // Courses aliases
        'courses': 'cursos',
        'certificacoes': 'cursos',
        // Languages aliases
        'languages': 'idiomas',
        'langs': 'idiomas',
        // Contact aliases
        'contact': 'contato',
        'email': 'contato',
        // CV aliases
        'cv': 'download cv',
        'resume': 'download cv',
        'curriculo': 'download cv',
        // Welcome aliases
        'welcome': 'bemvindo',
        'home': 'bemvindo',
        // Help aliases
        'ajuda': 'help',
        'commands': 'help',
        '?': 'help',
        // Theme aliases
        'tema': 'theme',
        'temas': 'themes',
    };

    // === TAB COMPLETION ===
    const TabCompletion = {
        lastInput: '',
        matches: [],
        matchIndex: 0,
        isThemeCompletion: false,

        getAllCommands() {
            const cmds = Object.keys(commands);
            const als = Object.keys(aliases);
            const special = ['clear', 'matrix', 'theme', 'themes'];
            return [...new Set([...cmds, ...als, ...special])].sort();
        },

        getAllThemes() {
            return Object.keys(ThemeManager.themes).sort();
        },

        getMatches(partial) {
            if (!partial) return [];
            const lower = partial.toLowerCase();
            return this.getAllCommands().filter(cmd => cmd.startsWith(lower));
        },

        getThemeMatches(partial) {
            if (!partial) return this.getAllThemes();
            const lower = partial.toLowerCase();
            return this.getAllThemes().filter(theme => theme.startsWith(lower));
        },

        complete(input) {
            const trimmed = input.trim().toLowerCase();

            // Check if completing theme name (e.g., "theme dra" -> "theme dracula")
            if (trimmed.startsWith('theme ') || trimmed.startsWith('tema ')) {
                const prefix = trimmed.startsWith('theme ') ? 'theme ' : 'tema ';
                const themePartial = trimmed.substring(prefix.length);

                if (trimmed !== this.lastInput) {
                    this.lastInput = trimmed;
                    this.matches = this.getThemeMatches(themePartial);
                    this.matchIndex = 0;
                    this.isThemeCompletion = true;
                } else if (this.matches.length > 0) {
                    this.matchIndex = (this.matchIndex + 1) % this.matches.length;
                }

                if (this.matches.length > 0) {
                    return `theme ${this.matches[this.matchIndex]}`;
                }
                return input;
            }

            // Regular command completion
            this.isThemeCompletion = false;

            if (trimmed !== this.lastInput) {
                this.lastInput = trimmed;
                this.matches = this.getMatches(trimmed);
                this.matchIndex = 0;
            } else if (this.matches.length > 0) {
                this.matchIndex = (this.matchIndex + 1) % this.matches.length;
            }

            if (this.matches.length > 0) {
                return this.matches[this.matchIndex];
            }
            return input;
        },

        reset() {
            this.lastInput = '';
            this.matches = [];
            this.matchIndex = 0;
            this.isThemeCompletion = false;
        }
    };

    // === FUZZY SEARCH ===
    const FuzzySearch = {
        // Calculate Levenshtein distance between two strings
        levenshtein(a, b) {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) {
                matrix[i] = [i];
            }
            for (let j = 0; j <= a.length; j++) {
                matrix[0][j] = j;
            }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            matrix[i][j - 1] + 1,
                            matrix[i - 1][j] + 1
                        );
                    }
                }
            }
            return matrix[b.length][a.length];
        },

        // Find similar commands
        findSimilar(input, maxDistance = 3) {
            const lower = input.toLowerCase();
            const allCommands = TabCompletion.getAllCommands();

            const suggestions = allCommands
                .map(cmd => ({
                    command: cmd,
                    distance: this.levenshtein(lower, cmd)
                }))
                .filter(item => item.distance <= maxDistance && item.distance > 0)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3)
                .map(item => item.command);

            return suggestions;
        },

        // Generate suggestion message
        getSuggestionMessage(input) {
            const suggestions = this.findSimilar(input);
            if (suggestions.length === 0) return null;

            if (suggestions.length === 1) {
                return `Você quis dizer '<span class="output-command">${suggestions[0]}</span>'?`;
            }

            const formatted = suggestions
                .map(s => `'<span class="output-command">${s}</span>'`)
                .join(', ');
            return `Você quis dizer: ${formatted}?`;
        }
    };

    // === TYPING EFFECT FUNCTIONS ===
    function typeText(targetElement, text, speed) {
        return new Promise(resolve => {
            let i = 0;
            const start = performance.now();

            function tick() {
                const now = performance.now();
                const elapsed = now - start;
                const expectedCount = Math.floor(elapsed / speed);

                while (i < Math.min(expectedCount, text.length)) {
                    targetElement.appendChild(document.createTextNode(text[i]));
                    i++;
                }

                terminalBody.scrollTop = terminalBody.scrollHeight;

                if (i < text.length) {
                    setTimeout(tick, speed);
                } else {
                    resolve();
                }
            }

            tick();
        });
    }

    async function typeNodeContents(targetElement, sourceNode, defaultSpeed) {
        const nodes = Array.from(sourceNode.childNodes);
        for (const node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const speed = node.parentElement.classList.contains('ascii-art') ? 5 : defaultSpeed;
                await typeText(targetElement, node.textContent, speed);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const newElement = document.createElement(node.tagName);
                for (const attr of node.attributes) {
                    newElement.setAttribute(attr.name, attr.value);
                }
                targetElement.appendChild(newElement);
                await typeNodeContents(newElement, node, defaultSpeed);
            }
        }
    }

    async function typeMessage(targetElement, htmlString, speed) {
        const sourceElement = document.createElement('div');
        sourceElement.innerHTML = htmlString;
        await typeNodeContents(targetElement, sourceElement, speed);
    }

    // === MATRIX EFFECT ===
    let matrixAnimationId = null;
    let matrixCanvas = null;
    let matrixCleanup = null;

    function startMatrixEffect() {
        if (isMatrixRunning) return false;
        isMatrixRunning = true;

        matrixCanvas = document.createElement('canvas');
        matrixCanvas.classList.add('matrix-canvas-local');
        document.body.appendChild(matrixCanvas);

        const ctx = matrixCanvas.getContext('2d');
        const characters = '\u30a2\u30a1\u30ab\u30b5\u30bf\u30ca\u30cf\u30de\u30e4\u30e3\u30e9\u30ef\u30ac\u30b6\u30c0\u30d0\u30d1\u30a4\u30a3\u30ad\u30b7\u30c1\u30cb\u30d2\u30df\u30ea\u30f0\u30ae\u30b8\u30c2\u30d3\u30d4\u30a6\u30a5\u30af\u30b9\u30c4\u30cc\u30d5\u30e0\u30e6\u30e5\u30eb\u30b0\u30ba\u30d6\u30d7\u30a8\u30a7\u30b1\u30bb\u30c6\u30cd\u30d8\u30e1\u30ec\u30f1\u30b2\u30bc\u30c7\u30d9\u30da\u30aa\u30a9\u30b3\u30bd\u30c8\u30ce\u30db\u30e2\u30e8\u30e7\u30ed\u30f2\u30b4\u30be\u30c9\u30dc\u30dd\u30f4\u30c3\u30f3ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const fontSize = 16;
        let columns = 0;
        let drops = [];

        const handleResize = () => {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
            columns = Math.floor(matrixCanvas.width / fontSize);
            drops = Array(columns).fill(1);
        };

        let lastDraw = 0;
        const frameInterval = 40;

        const draw = (timestamp = 0) => {
            if (timestamp - lastDraw < frameInterval) {
                matrixAnimationId = requestAnimationFrame(draw);
                return;
            }
            lastDraw = timestamp;

            ctx.fillStyle = 'rgba(26, 27, 38, 0.06)';
            ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            matrixAnimationId = requestAnimationFrame(draw);
        };

        handleResize();
        matrixAnimationId = requestAnimationFrame(draw);
        window.addEventListener('resize', handleResize);

        matrixCleanup = () => {
            cancelAnimationFrame(matrixAnimationId);
            window.removeEventListener('resize', handleResize);
            if (matrixCanvas && matrixCanvas.parentNode) matrixCanvas.remove();
            matrixCanvas = null;
            matrixAnimationId = null;
            isMatrixRunning = false;
        };

        return true;
    }

    function stopMatrixEffect() {
        if (!isMatrixRunning) return;
        if (typeof matrixCleanup === 'function') {
            matrixCleanup();
            matrixCleanup = null;
        } else {
            isMatrixRunning = false;
        }
    }

    // === COMMAND EXECUTION LOGIC ===
    async function executeCommand(command) {
        commandInput.disabled = true;
        setCursorLock(true);
        TabCompletion.reset();

        const commandLine = document.createElement('div');
        const sanitizedCommand = escapeHtml(command);
        let normalizedCommand = command.toLowerCase().trim();
        commandLine.innerHTML = `<span class="prompt">$&gt;</span><span class="output-command">${sanitizedCommand}</span>`;
        output.appendChild(commandLine);

        if (command) commandHistory.push(command);
        historyIndex = commandHistory.length;
        commandInput.value = '';

        // Resolve alias if exists
        if (aliases[normalizedCommand]) {
            normalizedCommand = aliases[normalizedCommand];
        }

        // Handle matrix command
        if (normalizedCommand === 'matrix') {
            const matrixStarted = startMatrixEffect();
            const infoLine = document.createElement('div');
            infoLine.classList.add('line', 'output-text');
            infoLine.innerHTML = matrixStarted
                ? "<span class=\"highlight\">Efeito Matrix ativado.</span> Digite '<span class=\"output-command\">clear</span>' para desativar."
                : "<span class=\"comment\">Efeito Matrix já está ativo. Use '<span class=\"output-command\">clear</span>' para desativar.</span>";
            output.appendChild(infoLine);

            commandInput.disabled = false;
            commandInput.focus();
            setCursorLock(false);
            scheduleCursorUpdate();
            terminalBody.scrollTop = terminalBody.scrollHeight;
            return;
        }

        const responseLine = document.createElement('div');
        responseLine.classList.add('line', 'output-text');

        let responseText;
        let speed = 10;

        // Handle clear command
        if (normalizedCommand === 'clear') {
            const matrixWasRunning = isMatrixRunning;
            if (matrixWasRunning) {
                stopMatrixEffect();
            }

            output.innerHTML = '';
            responseText = "Digite '<span class=\"output-command\">help</span>' para ver a lista de comandos disponíveis.";
            if (matrixWasRunning) {
                responseText += "<br><span class=\"comment\">Efeito Matrix desativado.</span>";
            }
        }
        // Handle themes command
        else if (normalizedCommand === 'themes') {
            responseText = ThemeManager.list();
        }
        // Handle theme command with argument
        else if (normalizedCommand.startsWith('theme ')) {
            const themeName = normalizedCommand.substring(6).trim();
            responseText = ThemeManager.apply(themeName);
        }
        // Handle theme command without argument
        else if (normalizedCommand === 'theme') {
            responseText = `Current theme: <span class="highlight">${ThemeManager.current}</span>\n\nUse '<span class="output-command">themes</span>' to see available themes.`;
        }
        // Handle regular commands
        else if (commands[normalizedCommand]) {
            const commandValue = commands[normalizedCommand];
            // Check if command is a function (for async commands like 'hack')
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
            output.appendChild(responseLine);
            await typeMessage(responseLine, responseText, speed);
        }

        commandInput.disabled = false;
        commandInput.focus();
        setCursorLock(false);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // === EVENT LISTENERS ===
    commandInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && !commandInput.disabled) {
            await executeCommand(commandInput.value);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (commandInput.value.trim()) {
                const completed = TabCompletion.complete(commandInput.value);
                commandInput.value = completed;
                commandInput.setSelectionRange(completed.length, completed.length);
                scheduleCursorUpdate();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
                commandInput.setSelectionRange(commandInput.value.length, commandInput.value.length);
                scheduleCursorUpdate();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
                scheduleCursorUpdate();
            } else {
                historyIndex = commandHistory.length;
                commandInput.value = '';
                scheduleCursorUpdate();
            }
        } else if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
            // Reset tab completion on any other key press
            TabCompletion.reset();
        }
    });

    // === INITIALIZATION ===
    async function init() {
        commandInput.disabled = true;
        setCursorLock(true);

        const initialLine = document.createElement('div');
        initialLine.classList.add('line', 'output-text');
        output.appendChild(initialLine);
        await typeMessage(initialLine, welcomeMessage, 10);

        commandInput.disabled = false;
        commandInput.focus();
        setCursorLock(false);
    }

    init();
});
