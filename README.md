Portfólio Interativo — Gabriel Mendes Lopes
==========================================

Portfólio pessoal em formato de terminal interativo, com tema escuro, efeito de digitação e histórico de comandos. 100% front‑end (HTML, CSS e JavaScript puro).

- Acesse: https://shybapsy.github.io

Recursos
- Terminal interativo com histórico (setas ↑/↓) e cursor customizado
- Efeito “Matrix” ativável com o comando `matrix` (desativa com `clear`)
- Comandos úteis: `help`, `sobre`, `experiencia`, `projetos`, `skills`, `cursos`, `idiomas`, `contato`, `download cv`, `clear`, `bemvindo`
- Favicon configurado (favicon.ico) e tipografia com Fira Code

Como usar (local)
- Opção simples: abra `index.html` no navegador
- Opção com servidor: `python -m http.server 8080` e acesse http://localhost:8080

Personalização rápida
- Conteúdos dos comandos: edite o objeto `commands` em `index.html:492`
- Seções específicas (exemplos):
  - Sobre: `index.html:507`
  - Experiência: `index.html:518`
  - Skills: `index.html:541`
- Currículo: substitua o arquivo `Currículo - Gabriel Lopes.pdf` na raiz; se renomear, atualize o link em `index.html:586`
- Favicon: troque `favicon.ico` na raiz, se desejar

Tecnologias
- HTML, CSS, JavaScript (sem frameworks)
- Google Fonts (Fira Code)

Deploy
- Este repositório segue o padrão `usuario.github.io`, então o GitHub Pages publica automaticamente o site.
- Basta fazer commit/push na branch padrão (geralmente `main`).

Licença
- Uso pessoal. Entre em contato caso queira reutilizar partes do projeto.
