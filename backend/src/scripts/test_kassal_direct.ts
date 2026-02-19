import { KassalProvider } from '../services/providers/KassalProvider.js';

async function testKassalDirect() {
    const provider = new KassalProvider();
    const queries = ['apple', 'banana', 'lemon'];

    for (const q of queries) {
        console.log(`\n--- Direct Search for: ${q} ---`);
        try {
            const results = await provider.searchProducts(q, {
                location: { lat: 63.4305, lng: 10.3951 },
                radius: 10
            });
            console.log(`Found ${results.length} results for ${q}`);
            if (results.length > 0) {
                console.log('Top 3:');
                results.slice(0, 3).forEach(p => {
                    const name = p.name.toLowerCase();
                    const isJuice = name.includes('juice') || name.includes('nektar') || name.includes('saft') || name.includes('smoothie');
                    console.log(`- ${p.name} (Score: ${p.relevanceScore}) ${isJuice ? '❌' : '✅'}`);
                });
            }
        } catch (err) {
            console.error(`Error searching for ${q}:`, err);
        }
    }
}

testKassalDirect();
