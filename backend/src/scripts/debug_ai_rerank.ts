import { KassalProvider } from '../services/providers/KassalProvider.js';

async function testAiRerank() {
    const provider = new KassalProvider();

    console.log('--- SEARCHING FOR "milk" (HEURISTIC ONLY) ---');
    const products = await provider.searchProducts('milk');
    console.log(`Found ${products.length} products total.`);

    const jokerProducts = products.filter(p => p.store.includes('Joker'));
    console.log(`Joker products found in standard results: ${jokerProducts.length}`);
    jokerProducts.slice(0, 3).forEach(p => console.log(`- [${p.store}] ${p.name} (Heuristic Score: ${p.relevanceScore})`));

    console.log('\n--- TESTING AI RE-RANKING WITH LOCKED STORE (Joker) ---');
    const prefProducts = await provider.searchProducts('milk', {
        lockedStore: 'Joker'
    });

    console.log('Top 10 Results with AI Preference:');
    prefProducts.slice(0, 10).forEach(p => console.log(`- [${p.store}] ${p.name} (Final Score: ${p.relevanceScore})`));

    const bestForJoker = prefProducts.find(p => p.store.includes('Joker'));
    if (bestForJoker) {
        const index = prefProducts.indexOf(bestForJoker);
        console.log(`\nBest Joker product rank: ${index + 1}`);
        if (index < 3) {
            console.log('✅ SUCCESS: Joker product promoted to top via AI Re-ranking.');
        } else {
            console.log('❌ FAILURE: Joker product exists but not prioritized highly enough.');
        }
    } else {
        console.log('\n❌ FAILURE: No Joker product found in results.');
    }
}

testAiRerank().catch(console.error);
