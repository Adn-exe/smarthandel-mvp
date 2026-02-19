import { KassalProvider } from '../services/providers/KassalProvider.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function debugFruitSearch() {
    const provider = new KassalProvider();
    const query = 'eple'; // Norwegian for apple
    console.log(`--- DEBUG SEARCH: "${query}" ---`);

    try {
        const products = await provider.searchProducts(query);
        console.log(`Found ${products.length} products total.`);

        // Show top 20 with scores
        products.slice(0, 20).forEach((p, idx) => {
            console.log(`${idx + 1}. ${p.name} - ${p.price} NOK - Score: ${p.relevanceScore}`);
        });

        const juices = products.filter(p => p.name.toLowerCase().includes('juice') || p.name.toLowerCase().includes('nektar'));
        console.log(`\nJuice results in total list: ${juices.length}`);
        if (juices.length > 0) {
            console.log(`First juice score: ${juices[0].relevanceScore}`);
        }

        const realFruit = products.filter(p => !p.name.toLowerCase().includes('juice') && !p.name.toLowerCase().includes('nektar') && !p.name.toLowerCase().includes('saft'));
        console.log(`Real fruit results in total list: ${realFruit.length}`);
        if (realFruit.length > 0) {
            console.log(`First real fruit: ${realFruit[0].name} - Score: ${realFruit[0].relevanceScore}`);
        }

    } catch (error) {
        console.error("Search failed:", error);
    }
}

debugFruitSearch();
