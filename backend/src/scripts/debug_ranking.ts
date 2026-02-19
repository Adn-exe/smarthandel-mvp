import routeService from '../services/routeService.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import { ShoppingItem } from '../types/index.js';

async function debugBias() {
    console.log('--- TEST 1: Generic Search ---');
    const items1: ShoppingItem[] = [
        { name: 'Melk', quantity: 1 },
        { name: 'Brød', quantity: 1 }
    ];

    const userLocation = { lat: 63.4305, lng: 10.3951 }; // Trondheim Center
    const stores = await dataAggregator.getStoresNearby(userLocation, 10);

    let result = await routeService.calculateOptimalRoute(items1, userLocation, stores);
    printTop(result, 5);

    console.log('\n--- FINDING SPAR MILK ID ---');

    // Try multiple queries to find a Spar product.
    // "Melk" is generic enough to find something at Spar usually.
    const queries = ['Melk', 'Helmelk'];
    let targetMilk: any = null;

    for (const q of queries) {
        if (targetMilk) break;
        console.log(`Searching for "${q}" at SPAR...`);
        // We bypass the variety logic here slightly to force a search for Spar results
        const { products } = await dataAggregator.searchProductsWithChainVariety([q], ['SPAR'], { location: userLocation });
        targetMilk = products.find(p => p.store.toUpperCase().includes('SPAR'));
    }

    if (targetMilk) {
        console.log(`Found Target: "${targetMilk.name}" (ID: ${targetMilk.id}) at "${targetMilk.store}"`);

        console.log(`\n\n--- TEST 3: LOCKED ITEM FETCHING ---`);
        console.log('Scenario: User locks this SPAR milk. We expect the route logic to fetch it explicitly if missing.');

        const items3: ShoppingItem[] = [
            {
                name: 'Melk',
                quantity: 1,
                lockedProductId: String(targetMilk.id),
                lockedStore: 'SPAR'
            },
            { name: 'Brød', quantity: 1 }
        ];

        result = await routeService.calculateOptimalRoute(items3, userLocation, stores);
        printTop(result, 5);
    } else {
        console.log('Failed to find a SPAR milk even with specific search. Cannot perform Test 3.');
        console.log('Maybe API key has issues?');
    }
}

function printTop(result: any, count: number) {
    result.singleStoreCandidates?.slice(0, count).forEach((c: any, idx: number) => {
        console.log(`${idx + 1}. ${c.store.name} (${c.store.chain})`);
        console.log(`   Cost: ${c.totalCost.toFixed(2)} NOK`);
        console.log(`   Availability: ${c.availabilityScore * 100}%`);
        console.log(`   Distance: ${c.distance.toFixed(0)}m`);
        console.log(`   Locked Matches: ${c._lockedItemsCount || 0}`);
        console.log('----------------------------');
    });
}

debugBias().catch(console.error);
