const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generatePDF(cvFile, outputFile) {
    console.log(`\nGenerating ${outputFile}...`);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport to match A4 proportions
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    const cvPath = path.join(__dirname, cvFile);
    console.log(`Loading: ${cvPath}`);

    await page.goto(`file://${cvPath}`, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    // Use screen media type to preserve dark theme colors
    await page.emulateMediaType('screen');

    // Add pdf-mode class to body to hide print button and fix min-height
    await page.evaluate(() => {
        document.body.classList.add('pdf-mode');
    });

    // Wait for styles to apply
    await delay(1000);

    // Generate PDF
    const outputPath = path.join(__dirname, outputFile);

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
        }
    });

    console.log(`Created: ${outputFile}`);
    await browser.close();
}

async function generateAllPDFs() {
    console.log('=== CV PDF Generator ===\n');

    await generatePDF('cv.html', 'CV - Gabriel Mendes Lopes.pdf');
    await generatePDF('cv-en.html', 'CV - Gabriel Mendes Lopes (EN).pdf');

    console.log('\n=== All PDFs generated successfully! ===');
}

generateAllPDFs().catch(err => {
    console.error('Error generating PDFs:', err);
    process.exit(1);
});
