import dataAggregator from '../services/providers/DataAggregator.js';
import routeService from '../services/routeService.js';
import { ShoppingItem } from '../types/index.js';

async function debugChicken() {
    const userLocation = { lat: 63.4305, lng: 10.3951 }; // Trondheim Center
    const items: ShoppingItem[] = [{ name: 'Kylling', quantity: 1 }];

    console.log('--- SEARCHING FOR "Kylling" ---');

    // 1. Check raw search results from DataAggregator
    const { products } = await dataAggregator.searchProductsWithChainVariety(['Kylling'], [], { location: userLocation });

    console.log(`Found ${products.length} products. Top 10:`);
    products.slice(0, 10).forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} (${p.store}) - ${p.price} NOK`);
    });

    // 2. Check RouteService selection logic
    console.log('\n--- ROUTE SERVICE SELECTION ---');
    const stores = await dataAggregator.getStoresNearby(userLocation, 5);
    const result = await routeService.calculateOptimalRoute(items, userLocation, stores);

    if (result.singleStoreCandidates && result.singleStoreCandidates.length > 0) {
        const topStore = result.singleStoreCandidates[0];
        const chickenItem = topStore.items.find(i => i.originalQueryName === 'Kylling');

        console.log(`Top Store: ${topStore.store.name}`);
        if (chickenItem) {
            console.log(`Selected "Chicken" Item: ${chickenItem.name}`);
            console.log(`Price: ${chickenItem.price}`);
        } else {
            console.log('No chicken item found in top store solution.');
        }
    } else {
        console.log('No route found.');
    }
}

debugChicken().catch(console.error);
