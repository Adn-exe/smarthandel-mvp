import routeService from '../services/routeService.js';
import dataAggregator from '../services/providers/DataAggregator.js';
import { Store, ShoppingItem, Location } from '../types/index.js';

async function deepResearch() {
    console.log("--- STARTING DEEP RESEARCH: ALTERNATE STORE RENDERING ---");

    const items: ShoppingItem[] = [
        { name: 'melk', quantity: 1 },
        { name: 'brød', quantity: 1 },
        { name: 'egg', quantity: 1 }
    ];

    const userLocation: Location = { lat: 59.9139, lng: 10.7522 };

    console.log("\n0. FETCHING REAL STORES NEARBY (10km)");
    const realStores = await dataAggregator.getStoresNearby(userLocation, 10);
    console.log(`- Found ${realStores.length} real stores within 10km`);

    // Limits the research to top 20 for performance in this debug script if needed, 
    // but the system will use all.
    const storesToUse = realStores.slice(0, 50);

    if (storesToUse.length > 0) {
        const furthest = storesToUse[storesToUse.length - 1];
        console.log(`- Sample furthest considered: ${furthest.name} at ${furthest.distance.toFixed(0)}m`);
    }

    try {
        console.log("\n1. FETCHING PRODUCTS DIRECTLY");
        const uniqueChains = Array.from(new Set(storesToUse.map((s: any) => s.chain)));
        const { products, queryMapping } = await dataAggregator.searchProductsWithChainVariety(
            items.map(i => i.name),
            uniqueChains as string[],
            { location: userLocation }
        );

        console.log(`- Found ${products.length} products`);
        const itemCoveragePerChain = new Map<string, string[]>();
        uniqueChains.forEach((chain: any) => {
            const chainProducts = products.filter(p => (p.chain || '').toLowerCase().includes(chain.toLowerCase()));
            const coveredItems = items.filter(i => {
                const queryIds = queryMapping.get(i.name) || [];
                return chainProducts.some(p => queryIds.includes(String(p.id)));
            }).map(i => i.name);
            itemCoveragePerChain.set(chain, coveredItems);
            console.log(`  - Chain "${chain}": Found ${coveredItems.length}/${items.length} items (${coveredItems.join(', ') || 'NONE'})`);
        });

        console.log("\n2. EXECUTING SCORE AND RANK");
        const rankedStores = (routeService as any).scoreAndRankStores(
            storesToUse,
            products,
            queryMapping,
            items,
            userLocation
        );

        console.log("\nALL RANKED STORES (Total: " + rankedStores.length + "):");
        rankedStores.forEach((rs: any, idx: number) => {
            if (idx < 5 || rs.distance > 2000) { // Show top 5 and anything further than 2km
                console.log(`${idx + 1}. ${rs.store.name} (${rs.store.chain})`);
                console.log(`   - Coverage: ${(rs.availabilityScore * 100).toFixed(0)}% (${rs.items.length}/${items.length})`);
                console.log(`   - Cost: ${rs.totalCost} NOK`);
                console.log(`   - Distance: ${rs.distance.toFixed(0)}m`);
            }
        });

        console.log("\n3. APPLYING ALTERNATIVES FILTER (current logic)");
        const bestSingleStore = rankedStores[0];
        const alternatives = rankedStores.slice(1).filter((store: any) => {
            const satisfiesAvailability = store.availabilityScore >= 0.30;
            const satisfiesCost = bestSingleStore ? store.totalCost <= bestSingleStore.totalCost * 2.0 : true;

            if (store.distance > 1000) {
                console.log(`Check ${store.store.name} (${store.distance.toFixed(0)}m): Avail=${(store.availabilityScore * 100).toFixed(0)}% (req 30%), Cost=${store.totalCost} (req <= ${(bestSingleStore?.totalCost * 2.0).toFixed(0)}) -> ${satisfiesAvailability && satisfiesCost ? 'KEEP' : 'REJECT'}`);
            }

            return satisfiesAvailability && satisfiesCost;
        });

        console.log("\nFINAL CANDIDATES TO RENDER:");
        const candidates = [bestSingleStore, ...alternatives].slice(0, 4);
        candidates.forEach((c: any, idx: number) => {
            if (!c) return;
            console.log(`${idx + 1}. ${c.store.name} (${c.store.chain}) at ${c.distance.toFixed(0)}m`);
        });

    } catch (error) {
        console.error("ERROR during research:", error);
    }
}

deepResearch();
