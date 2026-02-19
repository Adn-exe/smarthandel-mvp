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

    private activeRequests = 0;
    private readonly MAX_CONCURRENT = 3;

    private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
        let retries = maxRetries;

        while (true) {
            // Simple Concurrency Throttling
            while (this.activeRequests >= this.MAX_CONCURRENT) {
                console.log(`[Kassal Provider] Throttling active requests (${this.activeRequests}/${this.MAX_CONCURRENT}), waiting...`);
                await new Promise(res => setTimeout(res, 500 + Math.random() * 500));
            }

            this.activeRequests++;
            try {
                const result = await fn();
                this.activeRequests--; // Release slot after success
                return result;
            } catch (error: any) {
                this.activeRequests--; // Release slot before retry/sleep
                const isRateLimit = axios.isAxiosError(error) && error.response?.status === 429;

                if (retries > 0) {
                    const delayMs = isRateLimit
                        ? (maxRetries - retries + 1) * 2000 + Math.random() * 1000 // Heavy backoff for 429
                        : (maxRetries - retries + 1) * 500 + Math.random() * 200;  // Standard backoff

                    console.warn(`[Kassal Provider] Request failed (${isRateLimit ? '429 Rate Limit' : 'Error'}), retrying in ${Math.round(delayMs)}ms... (${retries} left)`);
                    await new Promise(res => setTimeout(res, delayMs));
                    retries--;
                    continue;
                }
                throw error;
            }
        }
    }

    private getMappedQuery(query: string): string {
        let cleanedQuery = query.toLowerCase().trim();

        // Strip common chain prefixes that might be added by DataAggregator
        const chainPrefixes = ['rema 1000', 'rema', 'kiwi', 'meny', 'coop extra', 'coop', 'spar', 'joker', 'extra'];
        for (const prefix of chainPrefixes) {
            if (cleanedQuery.startsWith(prefix)) {
                const afterPrefix = cleanedQuery.slice(prefix.length).trim();
                if (afterPrefix) {
                    cleanedQuery = afterPrefix;
                    break;
                }
            }
        }

        const QUERY_MAPPINGS: Record<string, string> = {
            // Fruits
            'apple': 'epler', 'apples': 'epler', 'eple': 'epler',
            'banana': 'bananer', 'bananas': 'bananer', 'banan': 'bananer',
            'pear': 'pærer', 'pears': 'pærer', 'pære': 'pærer',
            'orange': 'appelsiner', 'oranges': 'appelsiner', 'appelsin': 'appelsiner',
            'grapes': 'druer', 'drue': 'druer',
            'lemon': 'sitron', 'lemons': 'sitroner',
            'lime': 'lime', 'limes': 'lime',

            // Vegetables
            'carrot': 'gulrøtter', 'carrots': 'gulrøtter', 'gulrot': 'gulrøtter',
            'potato': 'poteter', 'potatoes': 'poteter', 'potet': 'poteter',
            'tomato': 'tomater', 'tomatoes': 'tomater', 'tomat': 'tomater',
            'cucumber': 'agurk', 'cucumbers': 'agurk',
            'broccoli': 'brokkoli',
            'onion': 'løk', 'onions': 'løk',
            'garlic': 'hvitløk',
            'paprika': 'paprika', 'peppers': 'paprika',

            // Bakery / Staples
            'bread': 'brød',
            'pasta': 'pasta',
            'rice': 'ris',
            'milk': 'melk',
            'cheese': 'hvitost',
            'butter': 'smør',
            'eggs': 'egg', 'egg': 'egg',
            'kneipp': 'kneippbrød',

            // Meat / Fish
            'chicken': 'kylling',
            'minced meat': 'kjøttdeig', 'ground meat': 'kjøttdeig',
            'minced beef': 'karbonadedeig',
            'salmon': 'laks',
            'sausages': 'pølser', 'sausage': 'pølser', 'pølse': 'pølser',
            'bacon': 'bacon',

            // Misc
            'coffee': 'kaffe',
            'pizza': 'pizza',
            'taco': 'taco',
            'soda': 'brus',
            'orange juice': 'appelsinjuice',

        };

        const result = QUERY_MAPPINGS[cleanedQuery] || cleanedQuery;

        // If we stripped a prefix, return the original query IF no mapping was found
        if (cleanedQuery !== query.toLowerCase().trim() && !QUERY_MAPPINGS[cleanedQuery]) {
            return query;
        }

        return result;
    }

    public async searchProducts(query: string, options?: ProviderSearchOptions): Promise<Product[]> {
        const mappedQuery = this.getMappedQuery(query);
        const cacheKey = `kassal:search:${mappedQuery}:${JSON.stringify(options || {})}`;
        const cached = config.nodeEnv === 'production' ? cache.get<Product[]>(cacheKey) : null;
        if (cached) return cached;

        return this.withRetry(async () => {
            try {
                // Use mappedQuery for the API call to ensure we get Norwegian results
                const response = await this.api.get('/products', {
                    params: {
                        size: 100,
                        search: mappedQuery,
                        lat: options?.location?.lat,
                        lng: options?.location?.lng,
                        km: options?.radius,
                        store_id: options?.storeId
                    }
                });

                const rawProducts: KassalProduct[] = response.data.data || [];
                const normalized = rawProducts
                    .map(p => this.normalizeProduct(p))
                    .filter(p => p.price > 0);

                // Pass mappedQuery to scoring so it checks against the Norwegian term
                const processed = this.applyRelevanceScoring(normalized, mappedQuery, options, rawProducts);

                cache.set(cacheKey, processed, 3600);
                return processed;
            } catch (error) {
                return this.handleError(error, 'Searching products');
            }
        });
    }

    public async getStoresNearby(location: Location, radiusKm = 5): Promise<Store[]> {
        const cacheKey = `kassal:stores:${location.lat}:${location.lng}:${radiusKm}`;
        const cached = config.nodeEnv === 'production' ? cache.get<Store[]>(cacheKey) : null;
        if (cached) return cached;

        return this.withRetry(async () => {
            try {
                const response = await this.api.get('/physical-stores', {
                    params: {
                        lat: location.lat,
                        lng: location.lng,
                        km: radiusKm,
                        size: 100
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
                return this.handleError(error, 'Getting nearby stores');
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
                return this.handleError(error, `Getting product ${id}`);
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
            chain: p.store?.code || p.store?.group || p.store?.name || 'Unknown Chain',
            image_url: p.image || '',
            unit: p.nutrition?.[0]?.unit || 'stk',
            address: p.store?.address,
            priceHistory: p.price_history
        };
    }


    private applyRelevanceScoring(products: Product[], query: string, options: any, rawProducts: any[]): Product[] {
        const lowerQuery = query.toLowerCase().trim();
        const wordRegex = new RegExp(`\\b${lowerQuery}(\\b|\\d|\\s)`, 'i');
        const suggestedCategory = options?.suggestedCategory?.toLowerCase();

        // --- KEYWORD DEFINITIONS ---
        // Hoisted to avoid reference errors and ensure consistency
        const stapleKeywords = ['melk', 'egg', 'smør', 'butter', 'milk', 'brød', 'ost', 'hvitost', 'kaffe', 'ris', 'pasta', 'kjøttdeig', 'kylling', 'laks', 'pølser', 'pizza', 'taco', 'bacon'];
        const dessertKeywords = ['sjoko', 'choco', 'muffins', 'is', 'kake', 'dessert', 'godteri', 'vanilje', 'jordbær', 'kaffe', 'litago', 'confecta', 'juice', 'nektar', 'saft', 'brus', 'farris', 'frus', 'friskis', 'kjeks', 'yoghurt', 'skyr', 'kesam', 'pudding', 'crumble', 'pai', 'pie', 'kompott', 'syltetøy', 'kanel', 'sukker', 'mad fish', 'snacks', 'chips', 'dip', 'gele', 'jelly', 'smudi', 'smoothie', 'pålegg'];
        const produceKeywords = ['brokkoli', 'gulrot', 'potet', 'blomkål', 'broccoli', 'carrot', 'potato', 'cauliflower', 'banan', 'eple', 'banana', 'apple', 'pære', 'druer', 'appelsin', 'agurk', 'tomat', 'løk', 'bananer', 'epler', 'pærer', 'appelsiner', 'gulrøtter', 'poteter', 'tomater', 'hvitløk', 'paprika', 'sitron', 'lime'];
        const processedKeywords = ['suppe', 'rett i koppen', 'gryte', 'pose', 'mix', 'toro', 'pulver', 'marinert', 'krydret', 'soltørket', 'lår', 'vinger', 'vinge', 'vingeklubb', 'burger', 'pølse', 'salat', 'slider', 'ferdigrett', 'grateng', 'saus', 'buljong', 'fyll', 'bunn', 'majones', 'reker', 'pepper', 'ringe', 'beger'];
        const babyFoodKeywords = ['ellas', 'semper', 'hipp', 'nestle', 'småfolk', 'grøt', 'mos', 'barnemat', 'klemmepose', 'smoothie', 'bubs', 'skids'];
        const nonFoodKeywords = ['shampoo', 'balsam', 'maske', 'såpe', 'krem', 'lotion', 'serviett', 'bleie', 'vask', 'rengjøring'];

        products.forEach((p, idx) => {
            const raw = rawProducts[idx];
            const name = p.name.toLowerCase();
            const category = (raw.category?.name || '').toLowerCase();
            let score = 0;

            // --- BOOLEAN FLAGS ---
            const isStapleSearch = stapleKeywords.includes(lowerQuery) ||
                (suggestedCategory === 'meieri' || suggestedCategory === 'egg');
            const isProduceSearch = produceKeywords.includes(lowerQuery) || (suggestedCategory === 'frukt & grønt');
            const isChickenSearch = lowerQuery === 'kylling' || lowerQuery === 'chicken' || lowerQuery === 'kyllingfilet';
            const isPizzaSearch = lowerQuery === 'pizza';

            const hasFlavorAdditives = dessertKeywords.some(word => name.includes(word));
            const isProcessedFood = processedKeywords.some(word => name.includes(word));
            const isBabyFood = babyFoodKeywords.some(w => name.includes(w));
            const isNonFood = nonFoodKeywords.some(w => name.includes(w));

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

            // 4a. Baby Food & Non-Food Penalty
            if ((isBabyFood || isNonFood) && !babyFoodKeywords.includes(lowerQuery) && !nonFoodKeywords.includes(lowerQuery)) {
                score += 15000;
            }

            // 4b. Produce Plural/Compound Bonus
            // CRITICAL: Only apply if NOT juice/nectar
            if (isProduceSearch && name.includes(lowerQuery) && !hasFlavorAdditives) {
                score -= 1500; // Bonus for containing the fruit name even as part of a word

                // Extra bonus if it starts with the fruit name (e.g. "Bananklase")
                if (name.startsWith(lowerQuery)) {
                    score -= 2000;
                }
            } else if (isProduceSearch && hasFlavorAdditives) {
                // If it's a produce search and it's juice, hit it even harder
                score += 25000;
            }

            // 5. Compound Word, Flavor & Category Penalty
            if (isStapleSearch && hasFlavorAdditives) {
                score += 15000; // Massive penalty for chocolate/coffee milk or egg-juice when pure products are wanted
            }

            // Check produce search too for flavor additives (e.g. "Banana Split", "Apple Cake")
            if (isProduceSearch && hasFlavorAdditives) {
                score += 15000;
            }

            if ((isStapleSearch || isProduceSearch || isChickenSearch || isPizzaSearch) && isProcessedFood) {
                score += 12000; // Penalize soups/mixes or seasoned chicken parts when fresh items are wanted
            }

            // Naturell Bonus for meat/poultry
            if (isChickenSearch && (name.includes('naturell') || name.includes('filet'))) {
                score -= 3000;
            }

            // 6. Category Matching (AI hint)
            if (suggestedCategory && (category.includes(suggestedCategory))) {
                score -= 4000;
            }

            // 7. Strict Word Filtering (The "Coconut Oil vs Milk" Fix)
            const antiMatches = ['olje', 'kokos', 'oil', 'coconut', 'smør', 'butter'];
            const unintendedMatch = antiMatches.some(word =>
                name.includes(word) && !lowerQuery.includes(word)
            );

            // Special handling for cheese vs liver paste ("postei" contains "ost")
            if (lowerQuery === 'ost' && (name.includes('postei') || name.includes('leverpostei'))) {
                score += 20000; // Nuclear penalty
            }

            if (unintendedMatch && (lowerQuery === 'melk' || suggestedCategory === 'melk' || suggestedCategory === 'meieri')) {
                score += 10000;
            }

            // 8. Specific penalties for highly deceptive items
            if (name.includes('farris') || name.includes('frus') || name.includes('friskis')) {
                score += 20000;
            }
            if (name.includes('smudi') || name.includes('smoothie')) {
                score += 20000;
            }

            // Special fix for "Brødrene" / "Brødr" matching "brød"
            if (lowerQuery === 'brød' && (name.includes('brødrene') || name.includes('brødr'))) {
                score += 5000;
            }

            // User Request: Ban specific deceptive chicken items (Den Stolte Hane, Soltørket Tomat)
            // User says "this isnt chicken" for generic search context.
            if (isChickenSearch && (name.includes('soltørket') || name.includes('hane'))) {
                score += 50000; // Total ban threshold for practical purposes
            }

            // User Request: Ban baby food from matching generic "laks" (salmon)
            const isSalmonSearch = lowerQuery === 'laks' || lowerQuery.includes('laks');
            if (isSalmonSearch && (name.includes('naturnes') || name.includes('nestle') || name.includes('8md') || name.includes('12md'))) {
                score += 30000; // High penalty to demote below real fish
            }

            // 8. Beverage vs Dairy Priority
            if (isStapleSearch && category.includes('drikke') && !name.includes('melk')) {
                score += 5000; // Push soft drinks/coffees down even if they match partially
            }

            if (wordRegex.test(name)) score -= 1000;

            p.relevanceScore = score + (name.length * 5);
        });

        return products
            .filter(p => (p.relevanceScore || 0) <= 20000) // Loosened threshold to allow variants for AI mapping
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
