
import { KassalProvider } from '../services/providers/KassalProvider.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import { Product } from '../types/index.js';

async function debugStaples() {
    const aggregator = dataAggregator;

    const testQueries = ['sugar', 'sukker', 'banana', 'banan', 'potato', 'potet'];

    console.log('--- STARTING STAPLE RELEVANCE TEST ---');

    for (const query of testQueries) {
        console.log(`\n--- SEARCHING FOR "${query}" ---`);
        const results = await aggregator.searchProducts(query);

        console.log(`Found ${results.length} products.`);

        console.log('Top 10 Most Relevant:');
        results
            .sort((a, b) => (a.relevanceScore || 0) - (b.relevanceScore || 0))
            .slice(0, 10)
            .forEach((p, i) => {
                console.log(`${i + 1}. [${p.relevanceScore}] ${p.name} (${p.store}) - ${p.price} NOK`);
            });

        console.log('Top 5 Cheapest:');
        results
            .sort((a, b) => a.price - b.price)
            .slice(0, 5)
            .forEach((p, i) => {
                console.log(`${i + 1}. [${p.relevanceScore}] ${p.name} (${p.store}) - ${p.price} NOK`);
            });
    }
}

debugStaples().catch(console.error);
