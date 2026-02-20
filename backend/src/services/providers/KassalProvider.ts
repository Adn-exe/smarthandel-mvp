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
import { isStrictWordMatch } from '../../utils/matching.js';
import { BaseProvider, ProviderSearchOptions } from './BaseProvider.js';
import { aiService } from '../aiService.js';

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
    private readonly MAX_CONCURRENT = 5;

    private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
        const timeoutMs = 8000; // 8s per individual API attempt

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
            'sugar': 'sukker'
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

                // 1. Apply Heuristic Scoring (Fast)
                const processed = this.applyRelevanceScoring(normalized, mappedQuery, options, rawProducts);

                // 2. Apply AI Re-ranking for difficult staples (Smart)
                // If it's a staple search or we have specific locked preferences, use AI to verify relevance
                const stapleKeywords = ['melk', 'egg', 'smør', 'butter', 'milk', 'brød', 'ost', 'hvitost', 'kaffe', 'ris', 'pasta', 'kjøttdeig', 'kylling', 'laks', 'pølser', 'sukker', 'sugar', 'eple', 'banan', 'pære', 'druer', 'appelsin', 'agurk', 'tomat', 'løk', 'gulrot', 'potet', 'paprika'];
                const isStapleSearch = stapleKeywords.includes(mappedQuery.toLowerCase());
                const hasPreferences = options?.lockedStore || options?.lockedProduct;

                if (processed.length > 0 && (isStapleSearch || hasPreferences)) {
                    const topCandidates = processed.slice(0, 15); // Send top 15 results to Gemini for re-verification
                    const reRanked = await aiService.rankProductRelevance(mappedQuery, topCandidates, {
                        lockedStore: options?.lockedStore,
                        lockedProduct: options?.lockedProduct
                    });

                    // Merge back while keeping non-top candidates at the bottom
                    const others = processed.slice(15);
                    const final = [...reRanked, ...others];

                    cache.set(cacheKey, final, 3600);
                    return final;
                }

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
            chain: this.normalizeStoreName(p.store?.group || p.store?.code || p.store?.name || 'Unknown Chain'),
            image_url: p.image || '',
            unit: p.nutrition?.[0]?.unit || 'stk',
            address: p.store?.address,
            priceHistory: p.price_history,
            ingredients: (p as any).ingredients,
            allergens: (p as any).allergens?.map((a: any) => ({
                display_name: a.display_name,
                contains: a.contains === 'YES' || a.contains === true
            }))
        };
    }


    private applyRelevanceScoring(products: Product[], query: string, options: any, rawProducts: any[]): Product[] {
        const lowerQuery = query.toLowerCase().trim();
        const wordRegex = new RegExp(`\\b${lowerQuery}(\\b|\\d|\\s)`, 'i');
        const suggestedCategory = options?.suggestedCategory?.toLowerCase();

        // --- KEYWORD DEFINITIONS ---
        // Hoisted to avoid reference errors and ensure consistency
        const stapleKeywords = ['melk', 'egg', 'smør', 'butter', 'milk', 'brød', 'ost', 'hvitost', 'kaffe', 'ris', 'pasta', 'kjøttdeig', 'kylling', 'laks', 'pølser', 'pizza', 'taco', 'bacon', 'sukker', 'sugar'];
        const dessertKeywords = ['sjok', 'choco', 'muffins', 'is', 'kake', 'dessert', 'godteri', 'vanilje', 'jordbær', 'kaffe', 'litago', 'confecta', 'juice', 'nektar', 'saft', 'brus', 'farris', 'frus', 'friskis', 'kjeks', 'yoghurt', 'skyr', 'kesam', 'pudding', 'crumble', 'pai', 'pie', 'kompott', 'syltetøy', 'kanel', 'mad fish', 'snacks', 'chips', 'dip', 'gele', 'jelly', 'smudi', 'smoothie', 'pålegg', 'eyes', 'faces', 'perler', 'pynt', 'dekor', 'dekorasjon', 'strøssel', 'glimmer', 'glaze'];
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

            const hasFlavorAdditives = dessertKeywords.some(word => word !== lowerQuery && name.includes(word));
            const isProcessedFood = processedKeywords.some(word => name.includes(word));
            const isBabyFood = babyFoodKeywords.some(w => name.includes(w));
            const isNonFood = nonFoodKeywords.some(w => name.includes(w));

            // 3. Category & Quality Penalties
            // Strictly penalize juice/smoothie for produce searches (The "Raw Fruit" rule)
            if (isProduceSearch && (name.includes('juice') || name.includes('nektar') || name.includes('saft') || name.includes('smoothie') || name.includes('smudi') || name.includes('puré'))) {
                score += 15000;
            }

            if (hasFlavorAdditives && (isStapleSearch || isProduceSearch || isChickenSearch)) {
                score += 4000;
            }
            if (isProcessedFood && (isStapleSearch || isProduceSearch)) {
                score += 3000;
            }
            if (isBabyFood && !lowerQuery.includes('grøt') && !lowerQuery.includes('baby')) {
                score += 5000;
            }
            if (isNonFood && !lowerQuery.includes('såpe') && !lowerQuery.includes('rengjøring')) {
                score += 8000;
            }

            // 1. Basic Exact/Prefix Matching
            if (name === lowerQuery) score -= 5000;

            // Refined Prefix: Only reward if it's a standalone word at the start
            const prefixRegex = new RegExp(`^${lowerQuery}(\\b|\\d|\\s)`, 'i');
            if (prefixRegex.test(name)) {
                score -= 4000;
            }

            // 2. Head Noun Priority (The "Melk" vs "Havregrøt m/melk" fix)
            // If the query is found at the start, it's likely the primary product
            // 2. Head Noun Priority (The "Melk" vs "Havregrøt m/melk" fix)
            // If the query is found at the start exactly or as a word, it's likely the primary product
            if (name === lowerQuery) {
                score -= 10000; // Extra exact match bonus
            } else if (name.startsWith(lowerQuery + ' ') || name.startsWith(lowerQuery + ',')) {
                score -= 3000;
            }

            // 2b. Substring Match (For compound words like "Dansukker")
            if (name.includes(lowerQuery)) {
                score -= 500;
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
                score += 20000; // Increased from 10000 to be sure it's above 15000 threshold
            }

            // 7b. Mandatory Keyword Match (Ensure we don't return random items just because API did)
            // If the name doesn't contain the standalone word query, hit it hard.
            // Using a stricter word boundary match to avoid "Parmareggio" matching "egg"
            if (!isStrictWordMatch(p.name, query)) {
                score += 20000; // Force above 15000 threshold
            } else {
                score -= 500; // Bonus for actually containing the word
            }

            // 8. Specific penalties for highly deceptive items
            if (name.includes('farris') || name.includes('frus') || name.includes('friskis')) {
                score += 30000;
            }
            if (name.includes('smudi') || name.includes('smoothie')) {
                score += 30000;
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

            // --- SPECIFIC STAPLE REFINEMENTS (User Feedback) ---

            // 1. Sugar Correction
            const isSugarSearch = lowerQuery === 'sukker' || lowerQuery === 'sugar';
            if (isSugarSearch) {
                const deceptiveSugar = [
                    'sukkerfri', 'sugarfree', 'no sugar', 'uten sukker', 'u/sukker', 'null sukker',
                    'sukkererter', 'sukkerkulør', 'melis', 'brunt', 'bruntsukker',
                    'dekor', 'eyes', 'perler', 'pasta', 'brød', 'hjerter', 'pynt'
                ];
                if (deceptiveSugar.some(word => name.includes(word))) {
                    score += 30000;
                }
                if (name.includes('sukker') || name.includes('sugar') || name.includes('dansukker')) {
                    score -= 5000; // Broad boost for anything actually containing sugar/brand
                }
                if (name === 'sukker' || name.startsWith('sukker 1kg') || name.startsWith('hvitt sukker') || name.startsWith('strøsukker')) {
                    score -= 15000; // Massive boost for pure items
                }
            }

            // 2. Banana Correction
            const isBananaSearch = lowerQuery === 'banan' || lowerQuery === 'banana' || lowerQuery === 'bananer';
            if (isBananaSearch) {
                const bananaByproducts = ['juice', 'nektar', 'drikk', 'smoothie', 'yoghurt', 'skum', 'godt', 'chips', 'kake'];
                if (bananaByproducts.some(word => name.includes(word))) {
                    score += 30000;
                }
                if (name.includes('klase') || name.includes('bama') || name.includes('vekt') || name.includes('first price')) {
                    score -= 3000;
                }
            }

            // 3. Potato Correction
            const isPotatoSearch = lowerQuery === 'potet' || lowerQuery === 'potato' || lowerQuery === 'poteter';
            if (isPotatoSearch) {
                const potatoByproducts = ['med potet', 'fløte', 'gratinerte', 'mos ', 'stappe', 'chips', 'gull', 'frites', 'salat', 'blanding', 'suppe', 'gryte'];
                if (potatoByproducts.some(word => name.includes(word))) {
                    score += 30000;
                }
                if (name.includes('kg') || name.includes('pose') || name.includes('nett') || name.includes('løsvekt') || name.includes('norsk') || name.includes('vasket')) {
                    score -= 3000;
                }
            }

            if (wordRegex.test(name)) score -= 1000;

            p.relevanceScore = score + (name.length * 5);
        });

        return products
            .filter(p => (p.relevanceScore || 0) <= 15000) // Looser threshold (up from 5000) to ensure availability
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
