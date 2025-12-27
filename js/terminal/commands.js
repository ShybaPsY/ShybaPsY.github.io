// ================================================
// TERMINAL COMMANDS MODULE
// ================================================

export function createCommands(dependencies) {
    const { ThemeManager, ThemePickerApp, ASCIIPlayerApp, MusicApp, GamesApp, AchievementManager, GitHubAPI, QuoteAPI, welcomeMessage } = dependencies;

    return {
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
  <span class="output-command">github</span>         - Mostra minhas estatísticas do GitHub.
  <span class="output-command">download cv</span>    - Link para baixar meu currículo.

  <span class="title-blue">Customization:</span>
  <span class="output-command">themes</span>         - Lista os temas disponíveis.
  <span class="output-command">theme [nome]</span>   - Muda o tema do terminal.

  <span class="title-blue">Utilities:</span>
  <span class="output-command">clear</span>          - Limpa a tela.
  <span class="output-command">exit</span>           - Fecha o terminal.
  <span class="output-command">bemvindo</span>       - Mostra a mensagem de boas-vindas novamente.
  <span class="output-command">quote</span>          - Exibe uma citação inspiradora sobre programação.
  <span class="output-command">conquistas</span>     - Lista suas conquistas desbloqueadas.
  <span class="output-command">crt</span>            - Ativa/desativa efeito CRT no monitor.
  <span class="output-command">extras</span>         - Comandos extras e exploração.`,

        sobre: `
  <span class="highlight">Sobre Mim</span>

  Olá! Sou Gabriel Mendes Lopes, um <span class="title-blue">desenvolvedor fullstack</span> apaixonado por criar soluções eficientes, escaláveis e robustas.
  Atualmente, estou no 5º semestre do curso de <span class="title-blue">Sistemas de Informação na FIPP</span> (Faculdade de Informática de Presidente Prudente).
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

        extras: `
  <span class="highlight">Comandos Extras:</span>

  <span class="title-blue">Exploração:</span>
  <span class="output-command">ls</span>             - Lista arquivos e diretórios disponíveis.
  <span class="output-command">tree</span>           - Mostra estrutura em árvore do portfolio.
  <span class="output-command">neofetch</span>       - Informações do sistema (estilo Linux).

  <span class="title-blue">Easter Eggs:</span>
  <span class="output-command">coffee</span>         - Pegue um café virtual.
  <span class="output-command">sudo</span>           - Tente obter permissões de root.
  <span class="output-command">hack</span>           - Hackeie o mainframe (simulação).
  <span class="output-command">42</span>             - A resposta definitiva.
  <span class="output-command">vim</span>            - Entre no editor Vim.
  <span class="output-command">sl</span>             - Locomotive ASCII.
  <span class="output-command">matrix</span>         - Efeito Matrix no fundo.

  <span class="comment">Digite qualquer comando acima para explorá-lo!</span>`,

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

        get neofetch() {
            const uptime = Math.floor((Date.now() - performance.timing.navigationStart) / 1000);
            const hours = Math.floor(uptime / 3600);
            const mins = Math.floor((uptime % 3600) / 60);
            const secs = uptime % 60;
            const uptimeStr = hours > 0 ? `${hours}h ${mins}m ${secs}s` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            const apps = Object.keys(localStorage).filter(k => k.includes('used')).length;
            const achievements = JSON.parse(localStorage.getItem('achievements') || '[]').length;

            return `
  <span class="detail-green">   ▄██████▄     ▄█</span>         <span class="detail-green">gabriel@portfolio</span>
  <span class="detail-green">  ███    ███   ███</span>         <span class="comment">──────────────────</span>
  <span class="detail-green">  ███    █▀    ███</span>         <span class="title-blue">OS:</span> Portfolio OS v2.0
  <span class="detail-green"> ▄███         ███</span>          <span class="title-blue">Host:</span> GitHub Pages
  <span class="detail-green">▀▀███ ████▄   ███</span>          <span class="title-blue">Kernel:</span> JavaScript ES6+
  <span class="detail-green">  ███    ███  ███</span>          <span class="title-blue">Uptime:</span> ${uptimeStr}
  <span class="detail-green">  ███    ███  ███▌    ▄</span>    <span class="title-blue">Shell:</span> terminal.js v1.0
  <span class="detail-green">  ███    ███  █████▄▄██</span>    <span class="title-blue">Theme:</span> ${ThemeManager.current}
  <span class="detail-green">  ████████▀   ▀</span>            <span class="title-blue">Terminal:</span> Fira Code 14px
                             <span class="title-blue">Resolution:</span> ${window.innerWidth}x${window.innerHeight}
                             <span class="title-blue">CPU:</span> Full-Stack Developer
                             <span class="title-blue">Memory:</span> ∞ / ∞ MB
                             <span class="title-blue">Apps:</span> ${apps} tracked
                             <span class="title-blue">Achievements:</span> ${achievements}/9 unlocked
                             <span class="title-blue">Location:</span> Anhumas, SP, Brazil
                             <span class="title-blue">Languages:</span> PT-BR, EN, ES

                             <span style="background:#ff5555;color:#ff5555;">██</span><span style="background:#ffb86c;color:#ffb86c;">██</span><span style="background:#f1fa8c;color:#f1fa8c;">██</span><span style="background:#50fa7b;color:#50fa7b;">██</span><span style="background:#8be9fd;color:#8be9fd;">██</span><span style="background:#bd93f9;color:#bd93f9;">██</span><span style="background:#ff79c6;color:#ff79c6;">██</span>`;
        },

        sudo: `
  <span class="error">Acesso Negado.</span>

  Usuário não está no arquivo sudoers. Este incidente será reportado. ;)`,

        coffee: function() {
            if (AchievementManager) {
                AchievementManager.check('coffee_lover');
            }
            return `
  <span class="detail-cyan">
      ( (
       ) )
    ........
    |      |]
    \\      /
     \`----'
  </span>
  <span class="highlight">☕ Pegando um café...</span>

  <span class="comment">Programador sem café = erro de compilação!</span>`;
        },

        hack: async function() {
            if (AchievementManager) {
                AchievementManager.check('hacker');
            }
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

        github: async function() {
            const stats = await GitHubAPI.fetchStats();
            return GitHubAPI.formatStats(stats);
        },

        quote: async function() {
            const quote = await QuoteAPI.fetch();
            return QuoteAPI.format(quote);
        },

        desktop: `
  <span class="highlight">Desktop Apps:</span>

  <span class="title-blue">Applications:</span>
  <span class="output-command">open themes</span>     - Seletor visual de temas
  <span class="output-command">open player</span>     - Player de animações ASCII
  <span class="output-command">open music</span>      - Player de música lo-fi
  <span class="output-command">open games</span>      - Mini jogos (Snake, Pong)

  <span class="comment">Você também pode clicar duas vezes nos ícones à esquerda!</span>`,

        'open themes': function() {
            ThemePickerApp.open();
            return '<span class="detail-green">Abrindo Theme Picker...</span>';
        },

        'open player': function() {
            ASCIIPlayerApp.open();
            return '<span class="detail-green">Abrindo ASCII Video Player...</span>';
        },

        'open music': function() {
            MusicApp.open();
            return '<span class="detail-green">Abrindo Music Player...</span>';
        },

        'open games': function() {
            GamesApp.open();
            return '<span class="detail-green">Abrindo Mini Games...</span>';
        },

        conquistas: function() {
            return AchievementManager.listAchievements();
        },

        crt: function() {
            document.body.classList.toggle('crt-enabled');
            const crtBtn = document.getElementById('taskbar-crt');
            if (crtBtn) crtBtn.classList.toggle('active');
            const enabled = document.body.classList.contains('crt-enabled');
            localStorage.setItem('crt-enabled', enabled);
            return enabled
                ? '<span class="detail-green">Efeito CRT ativado!</span> Aproveite a nostalgia.'
                : '<span class="comment">Efeito CRT desativado.</span>';
        },

        rickroll: function() {
            return `
  <span class="detail-green">  Never gonna give you up</span>
  <span class="detail-cyan">  Never gonna let you down</span>
  <span class="detail-green">  Never gonna run around and desert you</span>
  <span class="detail-cyan">  Never gonna make you cry</span>
  <span class="detail-green">  Never gonna say goodbye</span>
  <span class="detail-cyan">  Never gonna tell a lie and hurt you</span>

  <span class="comment">  You just got rickrolled!</span>

  <span class="highlight"><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank">Clique para a experiencia completa!</a></span>`;
        },

        konami: `
  <span class="highlight">Codigo Konami</span>

  <span class="comment">Use o teclado:</span>
  <span class="detail-cyan">  cima cima baixo baixo</span>
  <span class="detail-cyan">  esquerda direita esquerda direita</span>
  <span class="detail-cyan">  B A</span>

  <span class="comment">Algo magico pode acontecer...</span>`,
    };
}
