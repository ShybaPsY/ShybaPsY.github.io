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
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            // câmera fake para testar o ASCII Mirror sem hardware
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));
    page.on('requestfailed', req => errors.push('requestfailed: ' + req.url()));

    await page.goto('http://localhost:8123/', { waitUntil: 'networkidle0' });

    // seleciona PT no boot
    await page.keyboard.press('1');

    // a intro do retrato ASCII deve aparecer e sumir sozinha
    await page.waitForSelector('#ascii-portrait-canvas', { timeout: 30000 });
    console.log('retrato ASCII: apareceu');
    await page.waitForSelector('#ascii-portrait-canvas', { hidden: true, timeout: 30000 });
    console.log('retrato ASCII: dispersou');

    // espera a welcome message do terminal
    await page.waitForFunction(
        () => document.getElementById('output')?.textContent.length > 50,
        { timeout: 30000 }
    );
    console.log('boot + terminal: OK');

    // fundo ASCII field deve estar desenhando no particle-canvas
    const fieldDrawing = await page.$eval('#particle-canvas', c => {
        const ctx = c.getContext('2d');
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
        return false;
    });
    console.log('fundo ASCII field: ' + (fieldDrawing ? 'OK' : 'FALHOU'));

    // comandos do terminal: theme com argumento, alias e quote local
    const runCmd = async (cmd) => {
        await page.waitForFunction(() => !document.getElementById('command-input').disabled, { timeout: 20000 });
        await page.evaluate(() => document.getElementById('command-input').focus());
        await page.type('#command-input', cmd);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('command-input').disabled, { timeout: 20000 });
    };

    await runCmd('theme dracula');
    const theme1 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('theme com argumento: ' + (theme1 === 'dracula' ? 'OK' : `FALHOU (${theme1})`));

    await runCmd('tema nord');
    const theme2 = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log('alias "tema": ' + (theme2 === 'nord' ? 'OK' : `FALHOU (${theme2})`));

    const themeSaved = await page.evaluate(() => localStorage.getItem('selected-theme'));
    console.log('tema persistido: ' + (themeSaved === 'nord' ? 'OK' : `FALHOU (${themeSaved})`));

    await runCmd('quote');
    const quoteShown = await page.evaluate(() =>
        document.getElementById('output').textContent.includes('—'));
    console.log('quote local: ' + (quoteShown ? 'OK' : 'FALHOU'));

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

    // ASCII Mirror com a câmera fake do Chrome
    await page.$eval('.desktop-icon[data-app="mirror"]', el => el.focus());
    await page.keyboard.press('Enter');
    await delay(500);
    await page.$eval('#mirror-start', el => el.click());
    await delay(2500);
    const mirrorDrawing = await page.$eval('#mirror-canvas', c => {
        if (!c.width) return false;
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 10 || data[i + 1] > 10 || data[i + 2] > 10) return true;
        }
        return false;
    });
    console.log('ascii mirror (câmera fake): ' + (mirrorDrawing ? 'OK' : 'FALHOU'));

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
