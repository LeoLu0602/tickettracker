import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import cron from "node-cron";

const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Add stealth plugin to puppeteer.
puppeteer.use(StealthPlugin());

/**
 * @param {string} url
 * @param {number} quantity
 * @return {Promise<string>}
 */
async function getLowestPrice(url, quantity) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a realistic user-agent to avoid detection.
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

    // Navigate the page to a URL.
    await page.goto(url);
    await page.waitForSelector("#filter-bar-quantity");
    await page.select("#filter-bar-quantity", quantity.toString());

    // Locate the lowest price.
    const lowestPriceSelector = await page.waitForSelector("#quickpick-buy-button-qp-0");
    const lowestPrice = await lowestPriceSelector?.evaluate(el => el.textContent) ?? "";

    return lowestPrice;
}

/**
 * @param {string} url
 * @param {number} quantity
 * @return {Promise<void>}
 */
function startTracking(url, quantity) {
    cron.schedule("0 * * * * *", async () => {
        const lowestPrice = await getLowestPrice(url, quantity);

        console.log(`[${new Date().toLocaleString()}] ${quantity} ticket${quantity > 1 ? "s" : ""} ${lowestPrice}`);
    });
}

app.post("/api/v1/trackers", async (req, res) => {
    const { url, quantity } = req.body;

    startTracking(url, quantity);

    res.json({
        message: "Your tracker was created successfully!"
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
