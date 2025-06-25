const puppeteer = require('puppeteer');

const sessionId = "test123";

(async () => {
  const clients = [];

  for (let i = 0; i < 30; i++) {
    const browser = await puppeteer.launch({ headless: false }); // headless: false pour voir les onglets
    const page = await browser.newPage();

    await page.goto('http://10.10.212.162:8000/interface_web_hybride.html'); // Remplace par ton IP / serveur
    await page.waitForSelector('#sessionId');

    await page.type('#sessionId', sessionId);
    await page.click('#joinBtn');

    clients.push({ browser, page });
  }

  console.log("✅ 30 clients simulés.");
})();
