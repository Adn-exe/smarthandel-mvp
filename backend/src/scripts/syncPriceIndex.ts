import dataAggregator from '../services/providers/DataAggregator.js';
import priceIndexService, { PriceIndexEntry } from '../services/PriceIndexService.js';
import { KassalProvider } from '../services/providers/KassalProvider.js';
import { Product, Store } from '../types/index.js';

const CANONICAL_MAPPING = [
    { id: 'milk', queries: ['Melk', 'Tine Melk', 'Q-meieriene Melk'], category: 'Dairy' },
    { id: 'bread', queries: ['Brød', 'Kneipp', 'Grovbrød'], category: 'Bakery' },
    { id: 'eggs', queries: ['Egg', 'Prior Egg'], category: 'Dairy' },
    { id: 'cheese', queries: ['Gulost', 'Norvegia', 'Jarlsberg'], category: 'Dairy' },
    { id: 'chicken', queries: ['Kyllingfilet', 'Kylling'], category: 'Meat' },
    { id: 'minced_meat', queries: ['Kjøttdeig', 'Karbonadedeig'], category: 'Meat' },
    { id: 'salmon', queries: ['Laks', 'Laksefilet'], category: 'Fish' },
    { id: 'apple', queries: ['Epler', 'Pink Lady', 'Granny Smith'], category: 'Fruit' },
    { id: 'banana', queries: ['Bananer'], category: 'Fruit' },
    { id: 'carrot', queries: ['Gulrøtter'], category: 'Vegetables' },
    { id: 'potato', queries: ['Poteter'], category: 'Vegetables' },
    { id: 'tomato', queries: ['Tomater'], category: 'Vegetables' },
    { id: 'cucumber', queries: ['Agurk'], category: 'Vegetables' },
    { id: 'broccoli', queries: ['Brokkoli'], category: 'Vegetables' },
    { id: 'pasta', queries: ['Pasta', 'Spaghetti', 'Fusilli'], category: 'Dry Goods' },
    { id: 'rice', queries: ['Ris', 'Jasminris'], category: 'Dry Goods' },
    { id: 'coffee', queries: ['Kaffe', 'Evergood', 'Friele'], category: 'Dry Goods' },
    { id: 'orange_juice', queries: ['Appelsinjuice'], category: 'Drinks' },
    { id: 'sausages', queries: ['Pølser', 'Grillpølser', 'Wienerpølser'], category: 'Meat' },
    { id: 'pizza', queries: ['Grandiosa', 'Pizza'], category: 'Frozen' },
    { id: 'taco', queries: ['Taco', 'Tacokrydder', 'Tortilla'], category: 'Dry Goods' },
    { id: 'soda', queries: ['Brus', 'Coca-Cola', 'Pepsi Max'], category: 'Drinks' }
];

const CHAINS = ['REMA 1000', 'KIWI', 'MENY', 'COOP EXTRA', 'SPAR', 'JOKER'];

// Negative keywords to filter out irrelevant matches for specific products
const NEGATIVE_KEYWORDS: Record<string, string[]> = {
    'milk': ['pulver', 'erstatning', 'sjokolade', 'sjoko', 'choco', 'kakao', 'maskin', 'steking', 'mousse', 'smoothie', 'smudi', 'm/', 'med ', 'kokos', 'havre', 'mandel', 'ris', 'soya', 'is', 'muffins', 'shake', 'ringe', 'syret', 'kaffefløte'],
    'breads': ['smør', 'pålagg', 'skjærer', 'pose', 'skive', 'mix', 'mel', 'pølsebrød', 'hamburgerbrød', 'wienerbrød', 'rundstykke'],
    'eggs': ['eggehvite', 'eggeplomme', 'beger', 'salat', 'nudler', 'smoothie', 'smudi', 'juice', 'nektar', 'mango', 'frukt', 'pålegg', 'stryhns', 'salat', 'truseinnlegg', 'pastasaus', 'saus', 'reker', 'majones'],
    'chicken': ['suppe', 'nuggets', 'pølse', 'postei', 'gryte', 'lår', 'vinger', 'vinge', 'vingeklubb', 'marinert', 'krydret', 'soltørket', 'hane', 'lever', 'buljong', 'satay', 'fyll', 'couscous', 'salat', 'skiver'],
    'minced_meat': ['kake', 'bolle', 'deig-krydder', 'toro', 'saus', 'gryte', 'fyll', 'boller', 'pasta'],
    'salmon': ['salat', 'postei', 'suppe', 'mousse', 'beger', 'smøreost', 'naturnes', 'nestle', '8md', '12md'],
    'banana': ['måneder', 'ella\'s', 'ella', 'smoothie', 'juice', 'chips', 'mink', 'smudi', 'pære', 'kiwi', 'eple'],
    'apple': ['måneder', 'ella\'s', 'ella', 'smoothie', 'juice', 'chips', 'sidra', 'vineddik', 'smudi', 'nektar'],
    'rice': ['farris', 'friskis', 'frus', 'rislunsj', 'grøt', 'smoothie', 'smudi', 'is', 'kake', 'dessert', 'paprika', 'taco', 'saus', 'boil', 'risotto'],
    'soda': ['sirup', 'maskin', 'kullsyre', 'boks', 'flaske', 'juice', 'nektar'],
    'pizza': ['fyll', 'bunn', 'saus', 'topping', 'ost', 'skive', 'krydder', 'steinovnsbakt', 'deig']
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sync() {
    console.log('[SyncJob] Starting price index synchronization...');
    const allNewEntries: PriceIndexEntry[] = [];
    const timestamp = new Date().toISOString();

    // 1. Network Expansion: Fetch all physical stores first
    console.log('[SyncJob] Fetching nearby physical stores for network expansion...');
    const kassalProvider = new KassalProvider();
    const centerLocation = { lat: 63.4305, lng: 10.3951 };

    let nearbyStores: Store[] = [];
    try {
        nearbyStores = await kassalProvider.getStoresNearby(centerLocation, 10);
        console.log(`[SyncJob] Found ${nearbyStores.length} physical stores nearby.`);
    } catch (e) {
        console.error('[SyncJob] Failed to fetch nearby stores, falling back to chain-only mode:', e);
    }

    // Helper to normalize chain names for matching (e.g. "MENY_NO" -> "MENY", "REMA_1000" -> "REMA 1000")
    const normalizeChainKey = (chain: string) => {
        return chain.toUpperCase()
            .replace(/_NO$/, '')
            .replace(/_/g, ' ')
            .trim();
    };

    // Group stores by chain for easy lookup
    const storesByChain = new Map<string, Store[]>();
    for (const store of nearbyStores) {
        const chainKey = normalizeChainKey(store.chain);
        if (!storesByChain.has(chainKey)) {
            storesByChain.set(chainKey, []);
        }
        storesByChain.get(chainKey)?.push(store);
    }

    for (const item of CANONICAL_MAPPING) {
        console.log(`[SyncJob] Processing canonical ID: ${item.id}...`);

        for (const query of item.queries) {
            await sleep(500); // Rate limiting
            try {
                // Fetch products for this query across all chains
                const response = await dataAggregator.searchProductsWithChainVariety(
                    [query],
                    CHAINS,
                    {
                        location: { lat: 63.4305, lng: 10.3951 },
                        radius: 10,
                        bypassIndex: true // MUST bypass to get fresh live data for the index
                    }
                );
                const products = response.products;

                for (const p of products) {
                    const nameLower = p.name.toLowerCase();

                    // 1. Check Negative Keywords
                    const negatives = NEGATIVE_KEYWORDS[item.id] || [];
                    if (negatives.some(neg => nameLower.includes(neg))) {
                        continue;
                    }

                    // 2. Extra Guards for deceptive items
                    if (item.id === 'milk' && (nameLower.includes('ringe') || nameLower.includes('beger') || nameLower.includes('choco'))) continue;
                    if (item.id === 'rice' && (nameLower.includes('farris') || nameLower.includes('frus') || nameLower.includes('is'))) continue;
                    if (item.id === 'pizza' && (nameLower.includes('fyll') || nameLower.includes('saus') || nameLower.includes('bunn') || nameLower.includes('topping'))) continue;
                    if (item.id === 'bread' && (nameLower.includes('wiener') || nameLower.includes('rund'))) continue;
                    if (item.id === 'chicken' && (nameLower.includes('lår') || nameLower.includes('ving') || nameLower.includes('postei'))) continue;

                    // 3. Price Reasonability (Guard against errors/extremes)
                    if (p.price <= 1 || p.price > 2000) continue;

                    // 3. Explode Chain Price to Specific Stores
                    const rawChain = typeof p.chain === 'string' ? p.chain : '';
                    const chainKey = normalizeChainKey(rawChain);
                    const physicalStores = storesByChain.get(chainKey);

                    if (physicalStores && physicalStores.length > 0) {
                        // We have specific stores for this chain! Create an entry for EACH physical store.
                        for (const store of physicalStores) {
                            allNewEntries.push({
                                store_id: store.name, // Specific Store Name (e.g. "Rema 1000 Torvet")
                                canonical_product_id: item.id,
                                product_name: p.name,
                                price: p.price,
                                last_updated: timestamp,
                                availability: true,
                                chain: p.chain // Keep the chain grouping (e.g. "REMA 1000")
                            });
                        }
                    } else {
                        // Fallback: No specific stores found (or chain mismatch), index as generic chain entry
                        allNewEntries.push({
                            store_id: p.chain, // Fallback to Chain Name as Store ID
                            canonical_product_id: item.id,
                            product_name: p.name,
                            price: p.price,
                            last_updated: timestamp,
                            availability: true,
                            chain: p.chain
                        });
                    }
                }
            } catch (error) {
                console.error(`[SyncJob] Failed to sync query "${query}" for ${item.id}:`, error);
            }
        }
    }

    // De-duplicate: Keep only the best (usually cheapest) entry per canonical ID per store/chain
    const uniqueEntries = new Map<string, PriceIndexEntry>();
    for (const entry of allNewEntries) {
        // Unique per product per specific store
        const key = `${entry.canonical_product_id}-${entry.store_id}`;
        const existing = uniqueEntries.get(key);
        if (!existing || entry.price < existing.price) {
            uniqueEntries.set(key, entry);
        }
    }

    const finalEntries = Array.from(uniqueEntries.values());

    if (finalEntries.length < 10) { // Safety threshold
        console.error('[SyncJob] CRITICAL: Too few unique entries found. Aborting to prevent data corruption.');
        return;
    }

    priceIndexService.updateEntries(finalEntries);

    console.log(`[SyncJob] Sync complete. Indexed ${finalEntries.length} unique price points.`);
}

// Check if running directly
if (import.meta.url.endsWith(process.argv[1])) {
    sync().catch(console.error);
}

export { sync };
