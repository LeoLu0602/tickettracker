import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

const app = express();
const port = 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Add stealth plugin to puppeteer.
puppeteer.use(StealthPlugin());

/**
 * @param {string} url
 * @return {Promise<string>}
 */
async function startTracking(url, quantity) {
    console.log("Launching browser...");

    const browser = await puppeteer.launch({ headless: true });

    console.log("Creating new page...");

    const page = await browser.newPage();
    
    // Set a realistic user-agent to avoid detection.
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate the page to a URL.
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
    console.log("Waiting for selector #filter-bar-quantity...");
    await page.waitForSelector("#filter-bar-quantity");
    console.log(`Select ${quantity} ticket${quantity > 1 ? "s" : ""}`);
    await page.select("#filter-bar-quantity", quantity.toString());

    // Locate the lowest price.
    console.log("Waiting for the selector #quickpick-buy-button-qp-0...");
    const lowestPriceSelector = await page.waitForSelector("#quickpick-buy-button-qp-0");
    const lowestPrice = await lowestPriceSelector?.evaluate(el => el.textContent) ?? "";

    // Print the lowest price.
    if (lowestPrice !== "") {
        console.log(`The lowest price for ${quantity} ticket${quantity > 1 ? "s" : ""} is ${lowestPrice}`,);
    } else {
        console.log("Oops! Something went wrong.");
    }

    return lowestPrice;
}

app.post("/api/v1/trackers", async (req, res) => {
    const { url, quantity } = req.body;
    const lowestPrice = await startTracking(url, quantity);

    res.json({ lowestPrice });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
