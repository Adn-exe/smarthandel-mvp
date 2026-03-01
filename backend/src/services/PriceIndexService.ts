import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product, Store } from '../types/index.js';

// Lazily import sync to avoid circular dependencies
let syncFn: (() => Promise<void>) | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PriceIndexEntry {
    store_id: string | number;
    branch_id?: string | number;
    canonical_product_id: string;
    product_name: string;
    price: number;
    last_updated: string;
    availability: boolean;
    chain: string;
}

export interface PriceIndex {
    metadata: {
        lastGlobalUpdate: string;
        version: string;
    };
    entries: PriceIndexEntry[];
}

const CANONICAL_SYNONYMS: Record<string, string> = {
    'melk': 'milk', 'tine_melk': 'milk', 'q-meieriene_melk': 'milk',
    'brød': 'bread', 'kneipp': 'bread', 'grovbrød': 'bread',
    'egg': 'eggs', 'prior_egg': 'eggs',
    'gulost': 'cheese', 'norvegia': 'cheese', 'jarlsberg': 'cheese',
    'kyllingfilet': 'chicken', 'kylling': 'chicken',
    'kjøttdeig': 'minced_meat', 'karbonadedeig': 'minced_meat', 'kjøtt': 'minced_meat',
    'laks': 'salmon', 'laksefilet': 'salmon',
    'epler': 'apple', 'pink_lady': 'apple', 'granny_smith': 'apple',
    'bananer': 'banana', 'banan': 'banana',
    'gulrøtter': 'carrot', 'gulrot': 'carrot',
    'poteter': 'potato', 'potet': 'potato',
    'tomater': 'tomato', 'tomat': 'tomato',
    'agurk': 'cucumber',
    'brokkoli': 'broccoli',
    'pasta': 'pasta', 'spaghetti': 'pasta', 'fusilli': 'pasta',
    'ris': 'rice', 'jasminris': 'rice',
    'kaffe': 'coffee', 'evergood': 'coffee', 'friele': 'coffee',
    'appelsinjuice': 'orange_juice', 'juice': 'orange_juice',
    'pølser': 'sausages', 'grillpølser': 'sausages', 'wienerpølser': 'sausages',
    'grandiosa': 'pizza', 'pizza': 'pizza',
    'taco': 'taco', 'tacokrydder': 'taco', 'tortilla': 'taco',
    'brus': 'soda', 'coca-cola': 'soda', 'pepsi_max': 'soda'
};

const ENGLISH_DISPLAY_NAMES: Record<string, string> = {
    'milk': 'Milk', 'bread': 'Bread', 'eggs': 'Eggs', 'cheese': 'Cheese',
    'chicken': 'Chicken', 'minced_meat': 'Minced Meat', 'salmon': 'Salmon',
    'apple': 'Apple', 'banana': 'Banana', 'carrot': 'Carrot', 'potato': 'Potato',
    'tomato': 'Tomato', 'cucumber': 'Cucumber', 'broccoli': 'Broccoli',
    'pasta': 'Pasta', 'rice': 'Rice', 'coffee': 'Coffee', 'orange_juice': 'Orange Juice',
    'sausages': 'Sausages', 'pizza': 'Pizza', 'taco': 'Taco', 'soda': 'Soda'
};

/**
 * Service to manage the local price index JSON file.
 * Provides rapid lookups for canonical grocery items across stores.
 */
class PriceIndexService {
    private readonly INDEX_PATH = path.join(__dirname, '../data/store_price_index.json');
    private index: PriceIndex | null = null;

    constructor() {
        this.loadIndex();
    }

    private loadIndex() {
        try {
            const dataDir = path.dirname(this.INDEX_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            if (fs.existsSync(this.INDEX_PATH)) {
                const raw = fs.readFileSync(this.INDEX_PATH, 'utf-8');
                this.index = JSON.parse(raw);
                console.log(`[PriceIndexService] Loaded ${this.index?.entries.length} price entries.`);
            } else {
                this.index = {
                    metadata: { lastGlobalUpdate: new Date().toISOString(), version: '1.0.0' },
                    entries: []
                };
                this.saveIndex();
            }
        } catch (error) {
            console.error('[PriceIndexService] Failed to load price index:', error);
        }
    }

    private async saveIndex() {
        if (!this.index) return;
        try {
            // M3: Use async write to avoid blocking the event loop during large syncs
            await fsPromises.writeFile(this.INDEX_PATH, JSON.stringify(this.index, null, 2));
        } catch (error) {
            console.error('[PriceIndexService] Failed to save price index:', error);
        }
    }

    public getPricesForCanonicalItem(queryOrId: string, storeFilter?: { id?: string | number, chain?: string }): PriceIndexEntry[] {
        if (!this.index) return [];

        const normalized = queryOrId.toLowerCase().trim().replace(/\s+/g, '_');
        const canonicalId = CANONICAL_SYNONYMS[normalized] || normalized;

        return this.index.entries.filter(entry => {
            const idMatch = entry.canonical_product_id.toLowerCase() === canonicalId.toLowerCase();
            if (!idMatch) return false;

            if (storeFilter?.chain) {
                return entry.chain.toLowerCase().includes(storeFilter.chain.toLowerCase());
            }
            if (storeFilter?.id) {
                return String(entry.store_id) === String(storeFilter.id);
            }
            return true;
        });
    }

    public getAllEntries(): PriceIndexEntry[] {
        return this.index?.entries || [];
    }

    public updateEntries(newEntries: PriceIndexEntry[]) {
        if (!this.index) return;

        // Merge or replace logic (Simple replace for now for atomic updates)
        this.index.entries = newEntries;
        this.index.metadata.lastGlobalUpdate = new Date().toISOString();
        this.saveIndex();
    }

    public isCanonical(itemName: string): boolean {
        const normalized = itemName.toLowerCase().trim().replace(/\s+/g, '_');

        const canonicalIds = [
            'milk', 'bread', 'eggs', 'cheese', 'chicken', 'minced_meat', 'salmon',
            'apple', 'banana', 'carrot', 'potato', 'tomato', 'cucumber', 'broccoli',
            'pasta', 'rice', 'coffee', 'orange_juice', 'sausages', 'pizza', 'taco', 'soda'
        ];

        return canonicalIds.includes(normalized) || !!CANONICAL_SYNONYMS[normalized];
    }

    public getEnglishName(query: string): string {
        const normalized = query.toLowerCase().trim().replace(/\s+/g, '_');
        const canonicalId = CANONICAL_SYNONYMS[normalized] || (this.isCanonical(normalized) ? normalized : null);

        if (canonicalId && ENGLISH_DISPLAY_NAMES[canonicalId]) {
            return ENGLISH_DISPLAY_NAMES[canonicalId];
        }

        // Return capitalized original if not canonical
        return query.charAt(0).toUpperCase() + query.slice(1);
    }

    /**
     * Set up automated synchronization
     */
    public async scheduleSync() {
        if (!syncFn) {
            const { sync } = await import('../scripts/syncPriceIndex.js');
            syncFn = sync;
        }

        const runSync = async () => {
            console.log('[PriceIndexService] Triggering scheduled price sync...');
            try {
                await syncFn!();
                console.log('[PriceIndexService] Scheduled sync completed successfully.');
            } catch (err) {
                console.error('[PriceIndexService] Scheduled sync failed:', err);
            }
        };

        // 1. Initial Sync if empty or older than 24h
        const now = new Date();
        const lastUpdate = this.index ? new Date(this.index.metadata.lastGlobalUpdate) : new Date(0);
        const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (!this.index || this.index.entries.length === 0 || hoursSinceUpdate > 24) {
            console.log(`[PriceIndexService] Index is empty or stale (${hoursSinceUpdate.toFixed(1)}h). Starting background sync...`);
            runSync(); // Run in background
        }

        // 2. Schedule Daily Sync (Every 24 hours)
        setInterval(runSync, 24 * 60 * 60 * 1000);
        console.log('[PriceIndexService] Daily synchronization scheduled.');
    }
}

export const priceIndexService = new PriceIndexService();
export default priceIndexService;
