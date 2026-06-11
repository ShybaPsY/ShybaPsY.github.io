# Portfolio Interativo — Gabriel Mendes Lopes

Portfolio pessoal em formato de sistema operacional interativo. Uma experiência desktop completa rodando no navegador, com terminal, jogos, calculadora e muito mais.

🔗 **Acesse:** https://shybapsy.github.io

---

## Sobre o Projeto

Desenvolvi este portfolio como um "sistema operacional" que roda no navegador. A ideia era criar algo diferente dos portfolios tradicionais e mostrar minhas habilidades como desenvolvedor fullstack na prática.

São mais de **10.000 linhas de JavaScript puro**, sem frameworks, organizadas em módulos ES6 com separação clara de responsabilidades.

---

## Funcionalidades

### 🖥️ Sistema de Janelas
- Gerenciador de janelas customizado (arrastar, redimensionar, minimizar, maximizar, fechar)
- Snap-to-edge nas bordas da tela
- Múltiplas janelas simultâneas com gerenciamento de foco e z-index
- Suporte a touch para dispositivos móveis

### 💻 Terminal Interativo
- Mais de 30 comandos disponíveis
- Tab completion e fuzzy search
- Histórico de comandos (setas ↑/↓)
- Animação de digitação estilo máquina de escrever
- **Comandos:** `help`, `sobre`, `experiencia`, `projetos`, `skills`, `github`, `quote`, `neofetch`, `theme`, `coffee`, `hack`, `vim` e mais...

### 📱 Aplicativos
| App | Descrição |
|-----|-----------|
| **Calculadora** | 4 modos: básico, científico, programador (HEX/BIN/OCT/DEC), cálculo (derivadas/integrais com MathJax) |
| **Notepad** | Editor de texto com salvamento local via localStorage |
| **Music Player** | Player de rádios lo-fi com visualização |
| **ASCII Player** | Converte vídeos em arte ASCII em tempo real |
| **Theme Picker** | 10+ temas de cores customizáveis |
| **Projetos** | Showcase de projetos com cards 3D flip, carrossel e partículas animadas |

### 🎮 Mini Games (11 jogos)
Snake, Pong, Tetris, Breakout, Space Invaders, Asteroids, Dino Run, 2048, Flappy Bird, Minesweeper, Memory

### 🌐 Internacionalização (i18n)
- Suporte completo a **Português** e **Inglês**
- Traduções separadas por módulo (`locales/pt.json`, `locales/en.json`)
- Projetos traduzidos independentemente (`projects-pt.json`, `projects-en.json`)

### ✨ Extras
- **Spotlight Search** — Busca universal (Ctrl+Espaço ou Cmd+Espaço)
- **Desktop Pet** — Pet animado com 6 tipos (cachorro, gato, sapo, caranguejo, clippy, tartaruga) usando assets do VS Code Pets
- **Boot Sequence** — Animação de inicialização estilo terminal
- **Efeito Matrix** — Cascata de caracteres ativável via comando
- **Particle Effects** — Fundo animado com partículas
- **Sistema de Conquistas** — Desbloqueie achievements explorando o sistema
- **Wallpaper Manager** — Troca de papéis de parede via menu de contexto
- **Easter Eggs** — Comandos ocultos (`sl`, `rickroll`, `42`, `secret`...)
- **Integração GitHub API** — Exibe estatísticas do perfil do GitHub
- **Quote API** — Citações inspiradoras aleatórias

---

## Tecnologias

- **JavaScript ES6+** — Módulos, classes, async/await, Proxy, destructuring
- **CSS3** — Custom properties (variáveis), gradientes, animações, grid, flexbox, glassmorphism
- **Canvas API** — Jogos, efeitos visuais (Matrix, partículas), ASCII art
- **HTML5** — Semântico e acessível
- **Algebrite** — Computação simbólica (derivadas, integrais)
- **MathJax** — Renderização de expressões matemáticas em LaTeX

---

## Estrutura do Projeto

```
├── assets/
│   └── img/projects/         # Screenshots dos projetos
├── css/
│   ├── base.css              # Reset e estilos base
│   ├── variables.css         # Tokens de design (cores, fontes)
│   ├── effects.css           # Animações e efeitos visuais
│   ├── apps.css              # Estilos dos aplicativos
│   ├── games.css             # Estilos dos jogos
│   ├── projetos.css          # Estilos do showcase de projetos
│   ├── terminal.css          # Estilos do terminal
│   ├── taskbar.css           # Barra de tarefas
│   ├── windows.css           # Janelas do sistema
│   ├── desktop.css           # Área de trabalho
│   └── responsive.css        # Media queries
├── js/
│   ├── main.js               # Entry point e inicialização
│   ├── api/
│   │   ├── github-api.js     # Integração GitHub
│   │   └── quote-api.js      # API de citações
│   ├── apps/
│   │   ├── calculator.js     # Calculadora multimodal
│   │   ├── notepad.js        # Editor de texto
│   │   ├── music-player.js   # Player de música
│   │   ├── ascii-player.js   # Player ASCII art
│   │   ├── projetos-app.js   # Showcase de projetos
│   │   └── theme-picker.js   # Seletor de temas
│   ├── core/
│   │   ├── window-manager.js # Gerenciador de janelas
│   │   ├── theme-manager.js  # Gerenciador de temas
│   │   └── keyboard-shortcuts.js
│   ├── effects/
│   │   ├── boot-sequence.js  # Animação de boot
│   │   ├── matrix.js         # Efeito Matrix
│   │   └── particles.js      # Sistema de partículas
│   ├── features/
│   │   ├── achievements.js   # Sistema de conquistas
│   │   ├── desktop-pet.js    # Pet virtual animado
│   │   ├── easter-eggs.js    # Comandos secretos
│   │   ├── spotlight.js      # Busca universal
│   │   └── wallpaper-manager.js
│   ├── games/
│   │   ├── games-app.js      # Menu e infraestrutura dos jogos
│   │   └── *.js              # 11 mini-games em módulos separados
│   ├── i18n/
│   │   └── i18n.js           # Sistema de internacionalização
│   ├── locales/
│   │   ├── pt.json           # Traduções português
│   │   ├── en.json           # Traduções inglês
│   │   ├── projects-pt.json  # Projetos em português
│   │   └── projects-en.json  # Projetos em inglês
│   ├── terminal/
│   │   ├── terminal.js       # Core do terminal
│   │   ├── commands.js       # Comandos disponíveis
│   │   ├── aliases.js        # Aliases de comandos
│   │   ├── tab-completion.js # Autocompletar
│   │   └── fuzzy-search.js   # Busca fuzzy
│   └── ui/
│       ├── taskbar.js        # Barra de tarefas
│       ├── context-menu.js   # Menu de contexto
│       └── desktop-icons.js  # Ícones da área de trabalho
└── index.html
```

---

## Rodar Localmente

```bash
# Opção 1: Servidor Python
python -m http.server 8080
# Acesse: http://localhost:8080

# Opção 2: Node.js (npx)
npx serve .
# Acesse: http://localhost:3000

# Opção 3: VS Code Live Server
# Instale a extensão "Live Server" e clique em "Go Live"
```

> **Nota:** Abrir diretamente o `index.html` não funciona por causa de restrições de CORS com ES modules.

---

## Deploy

Este repositório segue o padrão `usuario.github.io`, então o GitHub Pages publica automaticamente. Basta fazer push na branch `main`.

---

## Licença

⚠️ **TODOS OS DIREITOS RESERVADOS** — Este projeto é protegido por direitos autorais.

Este repositório é disponibilizado **apenas para visualização**. Você **NÃO** tem permissão para:
- Copiar, modificar ou redistribuir o código
- Usar o design, conceito ou estilo visual
- Criar projetos derivados ou similares
- Usar para fins comerciais ou educacionais

📄 Leia a licença completa em **[LICENSE.md](./LICENSE.md)**

Para solicitar permissão de uso, entre em contato: **asdgabrielmlopes@gmail.com**

---

**Desenvolvido por Gabriel Mendes Lopes**

[![GitHub](https://img.shields.io/badge/GitHub-ShybaPsY-181717?style=flat&logo=github)](https://github.com/ShybaPsY)
[![Portfolio](https://img.shields.io/badge/Portfolio-shybapsy.github.io-00d4ff?style=flat&logo=google-chrome)](https://shybapsy.github.io)
