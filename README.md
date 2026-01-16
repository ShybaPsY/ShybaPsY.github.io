# Portfolio Interativo — Gabriel Mendes Lopes

Portfolio pessoal em formato de sistema operacional interativo. Uma experiência desktop completa rodando no navegador, com terminal, jogos, calculadora e muito mais.

🔗 **Acesse:** https://shybapsy.github.io

---

## Sobre o Projeto

Desenvolvi este portfolio como um "sistema operacional" que roda no navegador. A ideia era criar algo diferente dos portfolios tradicionais e mostrar minhas habilidades como desenvolvedor fullstack na prática.

São mais de **10.000 linhas de JavaScript puro**, sem frameworks, organizadas em módulos ES6 com separação clara de responsabilidades.

---

## Funcionalidades

### Sistema de Janelas
- Gerenciador de janelas customizado (arrastar, redimensionar, minimizar, maximizar)
- Snap-to-edge nas bordas da tela
- Múltiplas janelas simultâneas com foco e z-index

### Terminal Interativo
- Mais de 25 comandos disponíveis
- Tab completion e fuzzy search
- Histórico de comandos (setas ↑/↓)
- Efeito Matrix ativável
- Comandos: `help`, `sobre`, `experiencia`, `projetos`, `skills`, `github`, `quote`, `matrix`...

### Aplicativos
- **Calculadora** — 4 modos: básico, científico, programador (hex/bin/oct), cálculo (derivadas/integrais)
- **Notepad** — Editor de texto com salvamento local
- **Music Player** — Player de rádios lo-fi
- **ASCII Player** — Converte vídeos em arte ASCII
- **Themes** — 10+ temas de cores
- **Projetos** — Showcase dos meus projetos com cards 3D

### Mini Games (11 jogos)
Snake, Pong, Tetris, Breakout, Space Invaders, Asteroids, Dino Run, 2048, Flappy, Minesweeper, Memory

### Extras
- Spotlight search (Ctrl+Espaço)
- Desktop pet animado
- Boot sequence com animação
- Particle effects
- Sistema de conquistas
- Integração com GitHub API

---

## Tecnologias

- **JavaScript ES6** — Módulos, classes, async/await
- **CSS3** — Variáveis, gradientes, animações, grid, flexbox
- **Canvas API** — Jogos e efeitos visuais
- **HTML5** — Semântico e acessível
- **Algebrite + MathJax** — Cálculo simbólico na calculadora

---

## Estrutura do Projeto

```
├── css/
│   ├── base.css, variables.css, effects.css...
│   └── apps.css, games.css, terminal.css...
├── js/
│   ├── main.js (entry point)
│   ├── core/ (window-manager, theme-manager, keyboard-shortcuts)
│   ├── apps/ (calculator, notepad, music-player, projetos...)
│   ├── terminal/ (terminal, commands, tab-completion, fuzzy-search)
│   ├── features/ (spotlight, achievements, desktop-pet, wallpaper)
│   ├── effects/ (particles, matrix, boot-sequence)
│   └── ui/ (taskbar, context-menu, desktop-icons)
└── index.html
```

---

## Rodar Localmente

```bash
# Opção 1: Servidor Python
python -m http.server 8080
# Acesse: http://localhost:8080

# Opção 2: VS Code Live Server
# Instale a extensão e clique em "Go Live"
```

> **Nota:** Abrir diretamente o `index.html` não funciona por causa de restrições de CORS com ES modules.

---

## Deploy

Este repositório segue o padrão `usuario.github.io`, então o GitHub Pages publica automaticamente. Basta fazer push na branch `main`.

---

## Licença

Uso pessoal. Entre em contato caso queira reutilizar partes do projeto.

---

**Desenvolvido por Gabriel Mendes Lopes**
