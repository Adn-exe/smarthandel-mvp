import { routeService } from '../services/routeService.js';
import { Product, Store, ShoppingItem } from '../types/index.js';

// Mock data
const mockLocation = { lat: 59.9139, lng: 10.7522 }; // Oslo
const mockStores: Store[] = [
    { id: 'rema1', name: 'Rema 1000 Grønland', chain: 'REMA 1000', address: 'Grønland 1', location: { lat: 59.9130, lng: 10.7580 }, distance: 500, open_now: true }
];

const mockProducts: Record<string, Product[]> = {
    'melk': [{ id: 'm1', name: 'Melk 1L', price: 20, store: 'REMA 1000 Grønland', image_url: '', unit: 'L' }],
    'brød': [{ id: 'b1', name: 'Brød', price: 30, store: 'REMA 1000 Grønland', image_url: '', unit: 'stk' }],
    'egg': [{ id: 'e1', name: 'Egg 12stk', price: 40, store: 'REMA 1000 Grønland', image_url: '', unit: 'pk' }],
    'ris': [{ id: 'r1', name: 'Ris 1kg', price: 25, store: 'REMA 1000 Grønland', image_url: '', unit: 'kg' }]
};

async function runVerification() {
    console.log('--- Verification: Store Consistency ---');

    const items3: ShoppingItem[] = [
        { name: 'melk', quantity: 1 },
        { name: 'brød', quantity: 1 },
        { name: 'egg', quantity: 1 }
    ];

    const items4: ShoppingItem[] = [...items3, { name: 'ris', quantity: 1 }];

    // We simulate the RouteService internal mapping
    const map3: Record<string, Product[]> = {
        'melk': mockProducts['melk'],
        'brød': mockProducts['brød'],
        'egg': mockProducts['egg']
    };

    const map4: Record<string, Product[]> = { ...map3, 'ris': mockProducts['ris'] };

    console.log('Testing 3 items...');
    const result3 = (routeService as any).calculateBestSingleStores(items3, mockLocation, mockStores, map3, {});
    console.log(`Candidates for 3 items: ${result3.length}`);
    if (result3.length === 0 || result3[0].items.length < 3) {
        console.error('❌ FAILED: Should have found the store with all 3 items.');
    } else {
        console.log('✅ SUCCESS: Found store with 3/3 items.');
    }

    console.log('\nTesting 4 items...');
    const result4 = (routeService as any).calculateBestSingleStores(items4, mockLocation, mockStores, map4, {});
    console.log(`Candidates for 4 items: ${result4.length}`);
    if (result4.length === 0 || result4[0].items.length < 4) {
        console.error('❌ FAILED: Should have found the store with all 4 items.');
    } else {
        console.log('✅ SUCCESS: Found store with 4/4 items.');
    }

    console.log('\n--- Verification: Recommendation Balance ---');
    // Mock multi-store with 10 NOK savings
    const single = result4[0];
    const multi = {
        stores: [{ store: mockStores[0], items: single.items, cost: single.totalCost - 10, distance: single.distance }],
        totalCost: single.totalCost - 10,
        travelCost: single.travelCost,
        totalDistance: single.distance
    };

    const rec = (routeService as any).generateRecommendation(single, multi);
    console.log(`Recommendation with 10 NOK savings: ${rec.recommendation}`);
    if (rec.recommendation !== 'single') {
        console.error('❌ FAILED: Should recommend "single" for small savings (convenience)');
    } else {
        console.log('✅ SUCCESS: Correctly balanced for convenience.');
    }

    // Mock multi-store with 50 NOK savings
    const multiBig = { ...multi, totalCost: single.totalCost - 50 };
    const recBig = (routeService as any).generateRecommendation(single, multiBig);
    console.log(`Recommendation with 50 NOK savings: ${recBig.recommendation}`);
    if (recBig.recommendation !== 'multi') {
        console.error('❌ FAILED: Should recommend "multi" for significant savings (>30)');
    } else {
        console.log('✅ SUCCESS: Correctly recommends multi for large savings.');
    }
}

runVerification().catch(console.error);
