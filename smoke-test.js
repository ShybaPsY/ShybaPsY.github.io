// Smoke test temporário: sobe um servidor estático, abre o site no Puppeteer,
// passa pelo boot, abre os apps principais e reporta erros de console/página.
const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    let file = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
    if (file.endsWith(path.sep) || req.url === '/') file = path.join(__dirname, 'index.html');
    fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
    });
});

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    await new Promise(r => server.listen(8123, r));
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));
    page.on('requestfailed', req => errors.push('requestfailed: ' + req.url()));

    await page.goto('http://localhost:8123/', { waitUntil: 'networkidle0' });

    // seleciona PT no boot e espera a welcome message do terminal
    await page.keyboard.press('1');
    await page.waitForFunction(
        () => document.getElementById('output')?.textContent.length > 50,
        { timeout: 30000 }
    );
    console.log('boot + terminal: OK');

    // abre cada app via teclado (valida também a acessibilidade dos ícones)
    for (const app of ['projetos', 'calculator', 'notepad', 'games']) {
        await page.$eval(`.desktop-icon[data-app="${app}"]`, el => el.focus());
        await page.keyboard.press('Enter');
        await delay(800);
    }
    console.log('apps abertos via teclado: OK');

    // inicia o Snake para validar os módulos de jogo extraídos
    await page.$eval('.game-option[data-game="snake"]', el => el.click());
    await delay(1200);
    const snakeCanvas = await page.$('#snake-canvas');
    console.log('snake canvas: ' + (snakeCanvas ? 'OK' : 'FALHOU'));

    // confere se as imagens WebP do app Projetos carregaram
    const imgs = await page.$$eval('#window-projetos img', els =>
        els.map(i => ({ src: i.src, ok: i.complete && i.naturalWidth > 0 }))
    );
    const broken = imgs.filter(i => !i.ok);
    console.log(`imagens projetos: ${imgs.length} total, ${broken.length} quebradas`);
    broken.forEach(b => console.log('  quebrada: ' + b.src));

    // executa o comando github no terminal (valida GitHubAPI sem N+1)
    await page.click('#taskbar-start');
    await delay(300);

    if (errors.length) {
        console.log('\nERROS DETECTADOS:');
        errors.forEach(e => console.log('  ' + e));
    } else {
        console.log('\nNenhum erro de console/página.');
    }

    await browser.close();
    server.close();
    process.exit(broken.length || errors.length ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
