const puppeteer = require('puppeteer');
const path = require('path');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generatePDF() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new'
    });

    const page = await browser.newPage();

    // Load the CV HTML file (use cv-en.html for English version)
    const cvPath = path.join(__dirname, 'cv-en.html');
    console.log(`Loading CV from: ${cvPath}`);

    await page.goto(`file://${cvPath}`, {
        waitUntil: 'networkidle0'
    });

    // Wait for fonts and images to load
    await delay(2000);

    // Generate PDF
    const outputPath = path.join(__dirname, 'CV - Gabriel Mendes Lopes (EN).pdf');
    console.log(`Generating PDF: ${outputPath}`);

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '0',
            right: '0',
            bottom: '0',
            left: '0'
        },
        preferCSSPageSize: true
    });

    await browser.close();
    console.log('PDF generated successfully!');
}

generatePDF().catch(console.error);
