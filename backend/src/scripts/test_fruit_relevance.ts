import axios from 'axios';

async function testFruitRelevance() {
    const fruits = ['apple', 'banana', 'sitron'];
    for (const q of fruits) {
        console.log(`\n--- Testing relevance for: ${q} ---`);
        try {
            const response = await axios.post(`http://localhost:3001/api/products/compare`, {
                items: [q],
                location: { lat: 63.4305, lng: 10.3951 },
                radius: 10
            });

            const comparison = response.data.comparison;

            // Find the key in a case-insensitive way
            const actualKey = Object.keys(comparison.byItem).find(k => k.toLowerCase() === q.toLowerCase());

            if (!actualKey) {
                console.log(`No products found for ${q}. Keys in byItem:`, Object.keys(comparison.byItem));
                continue;
            }

            const itemResults = comparison.byItem[actualKey];

            if (!itemResults || !itemResults.products || itemResults.products.length === 0) {
                console.log(`No products in itemResults for ${q}`);
                continue;
            }

            console.log(`Top results for ${q}:`);
            itemResults.products.slice(0, 10).forEach((p: any, i: number) => {
                const name = p.product.name.toLowerCase();
                const isJuice = name.includes('juice') || name.includes('nektar') || name.includes('saft') || name.includes('smoothie') || name.includes('smudi') || name.includes('puré');
                const status = isJuice ? '❌ JUICE DETECTED' : '✅ PURE FRUIT';
                console.log(`${i + 1}. [${p.store.name}] ${p.product.name} - ${status} (Score: ${p.product.relevanceScore})`);
            });
        } catch (err: any) {
            console.error(`Error searching for ${q}:`, err.response?.data || err.message);
        }
    }
}

testFruitRelevance();
