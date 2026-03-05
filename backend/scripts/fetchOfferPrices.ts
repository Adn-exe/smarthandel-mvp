import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { allOffers } from '../src/data/allOffersData.js';
import { KassalProvider } from '../src/services/providers/KassalProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, '../src/data/offerPrices.json');

const kassalProvider = new KassalProvider();

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllPrices() {
    console.log(`Starting price fetch for ${allOffers.length} offers...`);
    const priceMap: Record<string, number> = {};

    // Load existing so we don't refetch everything if it fails halfway
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
            Object.assign(priceMap, existing);
            console.log(`Loaded ${Object.keys(priceMap).length} existing prices from cache.`);
        } catch (e) {
            console.error('Failed to load existing cache', e);
        }
    }

    for (let i = 0; i < allOffers.length; i++) {
        const offer = allOffers[i];

        // Skip if we already have it
        if (priceMap[offer.product_name]) {
            continue;
        }

        try {
            console.log(`[${i + 1}/${allOffers.length}] Fetching price for: ${offer.product_name} (${offer.chain})`);

            // Search Kassal app for this product
            const results = await kassalProvider.searchProducts(offer.product_name, {
                radius: 50 // generous radius just to find any instance of the product
            });

            if (results && results.length > 0) {
                // Heuristic: Try to find a result that actually matches the chain if possible, otherwise use the first one
                const chainMatch = results.find(r => r.chain.toLowerCase() === offer.chain.toLowerCase());
                const bestMatch = chainMatch || results[0];

                priceMap[offer.product_name] = bestMatch.price;
                console.log(`   -> Found price: ${bestMatch.price} NOK`);
            } else {
                console.log(`   -> No results found.`);
            }

            // Save after every few requests to prevent total loss on crash
            if (i % 5 === 0) {
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(priceMap, null, 2));
            }

            // Respect rate limits - wait 1 second between requests
            await delay(1000);

        } catch (error: any) {
            console.error(`Error fetching ${offer.product_name}:`, error.message);
            // Longer delay on error just in case it's a rate limit
            await delay(5000);
        }
    }

    // Final save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(priceMap, null, 2));
    console.log(`\nFinished mapping prices. Saved ${Object.keys(priceMap).length} items to ${OUTPUT_FILE}`);
}

fetchAllPrices().catch(console.error);
