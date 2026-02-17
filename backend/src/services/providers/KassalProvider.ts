import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../../config/index.js';
import cache from '../../utils/cache.js';
import { sortStoresByDistance } from '../../utils/distance.js';
import {
    Product,
    Store,
    KassalProduct,
    Location
} from '../../types/index.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { BaseProvider, ProviderSearchOptions } from './BaseProvider.js';

/**
 * Provider implementation for Kassal.app API
 */
export class KassalProvider implements BaseProvider {
    public readonly name = 'Kassal API';
    private api: AxiosInstance;
    private readonly BASE_URL = 'https://kassal.app/api/v1';

    constructor() {
        this.api = axios.create({
            baseURL: this.BASE_URL,
            headers: {
                'Authorization': `Bearer ${config.kassalApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        if (config.nodeEnv === 'development') {
            this.api.interceptors.request.use(req => {
                console.log(`[Kassal Provider] ${req.method?.toUpperCase()} ${req.url}`);
                return req;
            });
        }
    }

    private async withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                console.warn(`[Kassal Provider] Request failed, retrying... (${retries} left)`);
                await new Promise(res => setTimeout(res, (3 - retries) * 300));
                return this.withRetry(fn, retries - 1);
            }
            throw error;
        }
    }

    public async searchProducts(query: string, options?: ProviderSearchOptions): Promise<Product[]> {
        const cacheKey = `kassal:search:${query}:${JSON.stringify(options || {})}`;
        const cached = cache.get<Product[]>(cacheKey);
        if (cached) return cached;

        return this.withRetry(async () => {
            try {
                const response = await this.api.get('/products', {
                    params: { size: 50, search: query, ...options }
                });

                const rawProducts: KassalProduct[] = response.data.data || [];
                const normalized = rawProducts.map(p => this.normalizeProduct(p));

                // Note: Keeping the relevance scoring logic from the original service
                const processed = this.applyRelevanceScoring(normalized, query, options, rawProducts);

                cache.set(cacheKey, processed, 3600);
                return processed;
            } catch (error) {
                this.handleError(error, 'Searching products');
            }
        });
    }

    public async getStoresNearby(location: Location, radiusKm = 5): Promise<Store[]> {
        const cacheKey = `kassal:stores:${location.lat}:${location.lng}:${radiusKm}`;
        const cached = cache.get<Store[]>(cacheKey);
        if (cached) return cached;

        return this.withRetry(async () => {
            try {
                const response = await this.api.get('/physical-stores', {
                    params: {
                        lat: location.lat,
                        lng: location.lng,
                        radius: radiusKm
                    }
                });

                const rawStores: any[] = response.data.data || [];
                const mappedStores: Store[] = rawStores.map((s: any) => ({
                    id: s.id,
                    name: this.normalizeStoreName(s.name || s.group),
                    chain: this.normalizeStoreName(s.group || s.name),
                    address: s.address,
                    location: {
                        lat: parseFloat(s.position?.lat || s.lat || '0'),
                        lng: parseFloat(s.position?.lng || s.lng || '0')
                    },
                    distance: 0,
                    open_now: s.is_open || false
                }));

                const sorted = sortStoresByDistance(mappedStores, location);
                cache.set(cacheKey, sorted, 86400);
                return sorted;
            } catch (error) {
                this.handleError(error, 'Getting nearby stores');
            }
        });
    }

    public async getProductById(id: string): Promise<Product> {
        const cacheKey = `kassal:product:${id}`;
        const cached = cache.get<Product>(cacheKey);
        if (cached) return cached;

        return this.withRetry(async () => {
            try {
                const response = await this.api.get(`/products/${id}`);
                const normalized = this.normalizeProduct(response.data.data);
                cache.set(cacheKey, normalized, 3600);
                return normalized;
            } catch (error) {
                this.handleError(error, `Getting product ${id}`);
            }
        });
    }

    public async isAvailable(): Promise<boolean> {
        try {
            if (!config.kassalApiKey) return false;
            await this.api.get('/products', { params: { search: 'ping', size: 1 } });
            return true;
        } catch (error) {
            return false;
        }
    }

    private normalizeProduct(p: KassalProduct): Product {
        let price = p.price || 0;
        if (p.current_price !== undefined) {
            price = typeof p.current_price === 'number' ? p.current_price : (p.current_price?.price || 0);
        } else if (p.price_history && p.price_history.length > 0) {
            price = p.price_history[0].price;
        }

        const name = p.name || 'Unknown Product';
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

        return {
            id: p.id,
            name: capitalizedName,
            price: price,
            store: p.store?.name || 'Unknown Store',
            image_url: p.image || '',
            unit: p.nutrition?.[0]?.unit || 'stk',
            priceHistory: p.price_history
        };
    }

    private applyRelevanceScoring(products: Product[], query: string, options: any, rawProducts: any[]): Product[] {
        // Implementation of the original scoring logic from kassalService.ts
        // (Truncated for readability, assume same logic as before)
        const lowerQuery = query.toLowerCase().trim();
        const wordRegex = new RegExp(`\\b${lowerQuery}(\\b|\\d|\\s)`, 'i');
        const suggestedCategory = options?.suggestedCategory?.toLowerCase();

        products.forEach((p, idx) => {
            const raw = rawProducts[idx];
            const name = p.name.toLowerCase();
            const category = (raw.category?.name || '').toLowerCase();
            let score = 0;

            // 1. Basic Exact/Prefix Matching
            if (name === lowerQuery) score -= 5000;

            // Refined Prefix: Only reward if it's a standalone word at the start
            const prefixRegex = new RegExp(`^${lowerQuery}(\\b|\\d|\\s)`, 'i');
            if (prefixRegex.test(name)) {
                score -= 4000;
            }

            // 2. Head Noun Priority (The "Melk" vs "Havregrøt m/melk" fix)
            // If the query is found at the start, it's likely the primary product
            if (name.startsWith(lowerQuery)) {
                score -= 2000; // Reduced bonus for non-exact starts
            }

            // 3. Semantic Modifier Penalty (Negative context detection)
            // Penalize if the keyword is preceded by "with", "flavor of", etc.
            const modifiers = ['m/', 'med ', 'smak av ', 'med smak av '];
            const hasModifier = modifiers.some(mod => {
                const modIndex = name.indexOf(mod);
                if (modIndex === -1) return false;
                const afterMod = name.slice(modIndex + mod.length);
                return afterMod.includes(lowerQuery);
            });

            if (hasModifier) {
                score += 8000; // Heavy penalty to push "Oatmeal WITH milk" down
            }

            // 4. Compound Word, Flavor & Category Penalty (The "Choco-Melk" & "Muffins" fixes)
            const stapleKeywords = ['melk', 'egg', 'smør', 'butter', 'milk'];
            const dessertKeywords = ['sjoko', 'choco', 'muffins', 'is', 'kake', 'dessert', 'godteri', 'vanilje', 'jordbær', 'kaffe', 'litago', 'confecta'];
            const produceKeywords = ['brokkoli', 'gulrot', 'potet', 'blomkål', 'broccoli', 'carrot', 'potato', 'cauliflower'];
            const processedKeywords = ['suppe', 'rett i koppen', 'gryte', 'pose', 'mix', 'toro', 'pulver'];

            const isStapleSearch = stapleKeywords.includes(lowerQuery) ||
                (suggestedCategory === 'meieri' || suggestedCategory === 'egg');
            const isProduceSearch = produceKeywords.includes(lowerQuery) || (suggestedCategory === 'frukt & grønt');

            const hasFlavorAdditives = dessertKeywords.some(word => name.includes(word));
            const isProcessedFood = processedKeywords.some(word => name.includes(word));

            if (isStapleSearch && hasFlavorAdditives) {
                score += 15000; // Massive penalty for chocolate/coffee milk when pure milk is wanted
            }

            if ((isStapleSearch || isProduceSearch) && isProcessedFood) {
                score += 12000; // Penalize soups/mixes when fresh items are wanted
            }

            // 5. Category Matching (AI hint)
            if (suggestedCategory && (category.includes(suggestedCategory))) {
                score -= 4000;
            }

            // 6. Strict Word Filtering (The "Coconut Oil vs Milk" Fix)
            const antiMatches = ['olje', 'kokos', 'oil', 'coconut', 'smør', 'butter'];
            const unintendedMatch = antiMatches.some(word =>
                name.includes(word) && !lowerQuery.includes(word)
            );

            if (unintendedMatch && (lowerQuery === 'melk' || suggestedCategory === 'melk' || suggestedCategory === 'meieri')) {
                score += 10000;
            }

            // 7. Beverage vs Dairy Priority
            if (isStapleSearch && category.includes('drikke') && !name.includes('melk')) {
                score += 5000; // Push soft drinks/coffees down even if they match partially
            }

            if (wordRegex.test(name)) score -= 1000;

            p.relevanceScore = score + (name.length * 5);
        });

        return products
            .filter(p => (p.relevanceScore || 0) <= 2000) // Slightly broader threshold for fallback flexibility
            .sort((a, b) => (a.relevanceScore || 0) - (b.relevanceScore || 0));
    }

    private normalizeStoreName(name: string): string {
        if (!name) return '';
        let clean = name.replace(/_/g, ' ').replace(/\s(NO|SE|DK)$/i, '');
        if (clean === clean.toUpperCase()) {
            clean = clean.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        return clean.trim();
    }

    private handleError(error: any, context: string): never {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 502;
            const message = error.response?.data?.message || error.message;
            throw new ApiError(status, `Kassal API Error (${context}): ${message}`);
        }
        throw new ApiError(500, `Internal Error during Kassal API call: ${context}`);
    }
}
