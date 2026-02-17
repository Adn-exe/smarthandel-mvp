import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Product, Store, Location } from '../../types/index.js';
import { BaseProvider, ProviderSearchOptions } from './BaseProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OfflineOffer {
    id: string;
    itemName: string;
    brand: string;
    price: number;
    chains: string[];
    unit: string;
    tags: string[];
}

/**
 * Provider that uses a local JSON dataset of weekly offers.
 * Primarily used as a fallback for high-demand items in Trondheim.
 */
export class OfflineProvider implements BaseProvider {
    public readonly name = 'Weekly Offers (Trondheim)';
    private data: { lastUpdated: string; offers: OfflineOffer[] } | null = null;
    private readonly DATA_PATH = path.join(__dirname, '../../data/trondheim-offers.json');

    constructor() {
        this.loadData();
    }

    private loadData() {
        try {
            if (fs.existsSync(this.DATA_PATH)) {
                const raw = fs.readFileSync(this.DATA_PATH, 'utf-8');
                this.data = JSON.parse(raw);
                console.log(`[Offline Provider] Loaded ${this.data?.offers.length} offers for Trondheim.`);
            }
        } catch (error) {
            console.error('[Offline Provider] Failed to load local dataset:', error);
        }
    }

    public async searchProducts(query: string, options?: ProviderSearchOptions): Promise<Product[]> {
        if (!this.data) return [];

        const lowerQuery = query.toLowerCase().trim();

        // Simple fuzzy matching against itemName and tags
        const matches = this.data.offers.filter(offer =>
            offer.itemName.toLowerCase().includes(lowerQuery) ||
            offer.tags.some(t => t.toLowerCase() === lowerQuery)
        );

        return matches.flatMap(offer => {
            // Create a virtual product for each chain that carries this item
            return offer.chains.map(chain => this.normalizeProduct({
                id: `${offer.id}-${chain.replace(/\s+/g, '-')}`,
                name: `${offer.itemName} (${offer.brand})`,
                price: offer.price,
                store: chain,
                image_url: '',
                unit: offer.unit,
                relevanceScore: offer.itemName.toLowerCase() === lowerQuery ? -5000 : 0
            }));
        });
    }

    public async getStoresNearby(location: Location, radiusKm = 5): Promise<Store[]> {
        // The offline provider doesn't strictly track physical store instances,
        // it relies on the chains existing in the search results.
        // However, we could return dummy stores for testing if needed.
        return [];
    }

    public async getProductById(id: string): Promise<Product> {
        // Fallback provider doesn't support direct ID lookup yet
        throw new Error('Product lookup by ID not supported in Offline Provider.');
    }

    public async isAvailable(): Promise<boolean> {
        return this.data !== null && this.data.offers.length > 0;
    }

    private normalizeProduct(p: any): Product {
        const name = p.name || 'Unknown Product';
        return {
            id: p.id,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            price: p.price,
            store: p.store || 'Trondheim Store',
            image_url: p.image_url || '',
            unit: p.unit || 'stk'
        };
    }
}
