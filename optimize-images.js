// Converte os screenshots de projetos para WebP, comprime a foto de perfil
// e gera a imagem de Open Graph. Rodar com: npm run optimize-images
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(__dirname, 'assets', 'img', 'projects');
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;

async function convertProjectImages() {
    const pngs = [];
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (/\.(png|jpe?g)$/i.test(entry.name)) pngs.push(full);
        }
    };
    walk(PROJECTS_DIR);

    for (const file of pngs) {
        const out = file.replace(/\.(png|jpe?g)$/i, '.webp');
        const before = fs.statSync(file).size;
        await sharp(file)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: WEBP_QUALITY })
            .toFile(out);
        const after = fs.statSync(out).size;
        fs.unlinkSync(file);
        console.log(`${path.relative(__dirname, file)}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
    }
}

async function compressProfile() {
    const file = path.join(__dirname, 'assets', 'img', 'profile.jpg');
    if (!fs.existsSync(file)) return;
    const tmp = file + '.tmp';
    const before = fs.statSync(file).size;
    await sharp(file)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(tmp);
    fs.renameSync(tmp, file);
    console.log(`profile.jpg: ${(before / 1024).toFixed(0)}KB -> ${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
}

// JPEG para o og:image por compatibilidade com scrapers de redes sociais
async function generateOgImage() {
    const source = path.join(PROJECTS_DIR, 'portfolio', 'terminal.webp');
    const out = path.join(__dirname, 'assets', 'img', 'og-image.jpg');
    if (!fs.existsSync(source)) return;
    await sharp(source)
        .resize({ width: 1200, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(out);
    console.log(`og-image.jpg: ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
}

(async () => {
    await convertProjectImages();
    await compressProfile();
    await generateOgImage();
})();
