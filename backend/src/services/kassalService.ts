import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config/index.js';
import cache from '../utils/cache.js';
import { calculateDistance, sortStoresByDistance } from '../utils/distance.js';
import {
    Product,
    Store,
    KassalProduct,
    Location
} from '../types/index.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Service to interact with Kassal.app API
 */
class KassalService {
    private api: AxiosInstance;
    private readonly BASE_URL = 'https://kassal.app/api/v1';

    constructor() {
        this.api = axios.create({
            baseURL: this.BASE_URL,
            headers: {
                'Authorization': `Bearer ${config.kassalApiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 seconds timeout
        });

        // Request logging in development
        if (config.nodeEnv === 'development') {
            this.api.interceptors.request.use(req => {
                console.log(`[Kassal API Request] ${req.method?.toUpperCase()} ${req.url}`);
                return req;
            });
        }
    }

    /**
     * Helper to execute requests with simple retry logic
     */
    private async withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                console.warn(`[Kassal API] Request failed, retrying... (${retries} left)`);
                // Exponential backoff: 300ms, 600ms
                await new Promise(res => setTimeout(res, (3 - retries) * 300));
                return this.withRetry(fn, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Search for products by name
     */
    public async searchProducts(query: string, options?: { suggestedCategory?: string, location?: { lat: number, lng: number }, radius?: number, [key: string]: any }): Promise<Product[]> {
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

                const lowerQuery = query.toLowerCase().trim();
                const wordRegex = new RegExp(`\\b${lowerQuery}(\\b|\\d|\\s)`, 'i');
                const isBabySearch = lowerQuery.includes('baby') || lowerQuery.includes('mnd') || lowerQuery.includes('måned');
                const babyTerms = ['mnd', 'måneder', 'månader', 'baby', 'semper', 'hipp', 'nestle', 'småfolk'];

                // Expanded irrelevant/negative terms for staples
                const stapleNegativeTerms: Record<string, string[]> = {
                    'melk': ['sjokolade', 'is', 'kjeks', 'dessert', 'godteri', 'smil', 'freia', 'nidar', 'stratos', 'minde', 'melki', 'sjokolademelk', 'yoghurt', 'yogurt', 'rømme', 'fløte', 'kesam', 'smør'],
                    'milk': ['sjokolade', 'is', 'kjeks', 'dessert', 'godteri', 'smil', 'freia', 'nidar', 'stratos', 'minde', 'melki', 'sjokolademelk', 'yoghurt', 'yogurt', 'rømme', 'fløte', 'kesam', 'smør'],
                    'brød': ['sticks', 'krutonger', 'crumbs', 'mel', 'mix', 'bake', 'røre', 'brødrene', 'ringstad'],
                    'bread': ['sticks', 'krutonger', 'crumbs', 'mel', 'mix', 'bake', 'røre', 'brødrene', 'ringstad'],
                    'egg': ['sjokolade', 'surprise', 'kinder', 'glass'],
                    'smør': ['kniv', 'boks', 'papir'],
                    'butter': ['kniv', 'boks', 'papir'],
                    'ris': ['nutrisse', 'hår', 'farge', 'kosmetikk', 'velvære', 'shampoo'],
                    'rice': ['nutrisse', 'hår', 'farge', 'kosmetikk', 'velvære', 'shampoo'],
                };

                const stapleCategories: Record<string, string[]> = {
                    'melk': ['meieri', 'melk', 'dairy', 'drikke'],
                    'milk': ['meieri', 'melk', 'dairy', 'drikke'],
                    'brød': ['bakeri', 'brød', 'bakery'],
                    'bread': ['bakeri', 'brød', 'bakery'],
                    'egg': ['egg', 'meieri'],
                    'kjøtt': ['kjøtt', 'meat'],
                    'frukt': ['frukt', 'grønt', 'fruit', 'vegetable'],
                };

                const processedTerms = ['suppe', 'gryte', 'salat', 'blanding', 'stuing', 'juice', 'pesto', 'smøremyk', 'postei', 'nuggets', 'pinner', 'panert'];
                const nonFoodSectors = ['skjønnhet og velvære', 'apotek', 'hårpleie', 'kosmetikk', 'kroppspleie', 'personlig pleie', 'rengjøring', 'vaskemiddel', 'tøyvask', 'husholdning'];
                const groceryStaples = ['melk', 'milk', 'brød', 'bread', 'egg', 'ris', 'rice', 'smør', 'butter', 'kjøtt', 'meat', 'fisk', 'fish', 'kylling', 'chicken', 'pasta', 'mel', 'sukker', 'kaffe'];

                const suggestedCategory = options?.suggestedCategory?.toLowerCase();

                // Calculate and store relevance score (lower is better)
                normalized.forEach((p, idx) => {
                    const raw = rawProducts[idx];
                    const name = p.name.toLowerCase();
                    const category = (raw.category?.name || '').toLowerCase();
                    const parentCategory = (raw.category?.parent?.name || '').toLowerCase();
                    let score = 0;

                    // 1. Exact match (Absolute highest priority)
                    if (name === lowerQuery) {
                        score -= 5000;
                    }

                    // 2. Full Word at Start Boost (Strict)
                    // Matches "Melk 1L" or "Lettmelk" but NOT "Melkesjokolade"
                    const isFullStart = name.startsWith(lowerQuery + ' ') || name.startsWith(lowerQuery + ',') || name === lowerQuery;
                    if (isFullStart) {
                        score -= 3000;
                    }

                    // 3. Category Boost (AI Powered)
                    if (suggestedCategory) {
                        const matchesCategory = category.includes(suggestedCategory) || parentCategory.includes(suggestedCategory);
                        const isStapleQuery = stapleCategories[lowerQuery]?.some(c => suggestedCategory.includes(c));

                        if (matchesCategory) {
                            score -= 4000; // Massive boost for category match
                        } else if (suggestedCategory === 'melk' || suggestedCategory === 'meieri') {
                            // If user wants milk, and it's candy/chocolate/yogurt, penalize heavily
                            if (category.includes('godteri') || category.includes('sjokolade') || name.includes('sjokolade') || name.includes('godteri') || name.includes('yoghurt') || name.includes('yogurt')) {
                                score += 15000; // Nuclear penalty for chocolate/yogurt when seeking milk
                            }
                        }
                    }

                    // 4. Manual Staple Category Boost (Fallback)
                    const relevantCategories = stapleCategories[lowerQuery] || [];
                    const hasRelevantCategory = relevantCategories.some(cat => category.includes(cat) || parentCategory.includes(cat));
                    if (hasRelevantCategory) {
                        score -= 1500;
                    }

                    // 5. Negative Term Penalty (Staple specific)
                    const negatives = stapleNegativeTerms[lowerQuery] || [];
                    if (negatives.some(neg => name.includes(neg))) {
                        score += 20000; // Extreme penalty for blacklisted terms
                    }

                    // 6. Whole word match boost
                    if (wordRegex.test(name)) {
                        score -= 1000;
                    }

                    // 7. Baby food penalty
                    if (!isBabySearch && babyTerms.some(term => name.includes(term))) {
                        score += 3000;
                    }

                    // 8. Processed food / Ingredient penalty
                    if (processedTerms.some(term => name.includes(term)) && !lowerQuery.includes('suppe') && !lowerQuery.includes('gryte')) {
                        score += 2000;
                    }

                    // 9. Sector Protection (Nuclear Penalty for Food vs Non-Food mismatch)
                    const isGroceryQuery = groceryStaples.includes(lowerQuery) || (suggestedCategory && !nonFoodSectors.some(s => suggestedCategory.includes(s)));
                    const isNonFoodProduct = nonFoodSectors.some(sector => category.includes(sector) || parentCategory.includes(sector));

                    if (isGroceryQuery && isNonFoodProduct) {
                        score += 40000; // Nuclear penalty: Non-food items (hair dye, detergent) should NEVER match grocery staples
                    }

                    // 10. Short Query Purity check (e.g., "ris" in "Nutrisse")
                    if (lowerQuery.length <= 3 && name.includes(lowerQuery)) {
                        const isStandaloneWord = wordRegex.test(name);
                        if (!isStandaloneWord) {
                            score += 15000; // Heavy penalty if small query is hidden inside a larger word
                        }
                    }

                    // 11. Purity Boost (Favor shorter names that contain THE QUERY)
                    if (name.includes(lowerQuery)) {
                        const wordCount = name.split(/\s+/).length;
                        if (wordCount === 1) score -= 1000;
                        else if (wordCount <= 2) score -= 500;
                        else if (wordCount <= 3) score -= 200;
                    }

                    // 10. Length penalty
                    score += (name.length * 10);

                    p.relevanceScore = score;
                });

                // Filter out irrelevant results based on a hard threshold (e.g. 1500)
                // This ensures products with extreme penalties (like chocolate for milk) are dropped entirely
                const filtered = normalized.filter(p => (p.relevanceScore || 0) <= 1500);

                // Sort by the stored relevance score
                const sorted = filtered.sort((a, b) => (a.relevanceScore || 0) - (b.relevanceScore || 0));

                cache.set(cacheKey, sorted, 3600); // 1 hour TTL
                return sorted;
            } catch (error) {
                this.handleError(error, 'Searching products');
            }
        });
    }

    /**
     * Get stores nearby a location
     */
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
                const mappedStores: Store[] = rawStores.map((s: any) => {
                    const lat = parseFloat(s.position?.lat || s.lat || '0');
                    const lng = parseFloat(s.position?.lng || s.lng || '0');

                    return {
                        id: s.id,
                        name: this.normalizeStoreName(s.name || s.group),
                        chain: this.normalizeStoreName(s.group || s.name),
                        address: s.address,
                        location: { lat, lng },
                        distance: 0, // Will be set by sortStoresByDistance
                        open_now: s.is_open || false
                    };
                });

                const sorted = sortStoresByDistance(mappedStores, location);

                cache.set(cacheKey, sorted, 86400); // 24 hours TTL for store locations
                return sorted;
            } catch (error) {
                this.handleError(error, 'Getting nearby stores');
            }
        });
    }

    /**
     * Get product details by ID
     */
    public async getProductById(id: string | number): Promise<Product> {
        const cacheKey = `kassal:product:${id}`;
        const cached = cache.get<Product>(cacheKey);
        if (cached) return cached;

        return this.withRetry(async () => {
            try {
                const response = await this.api.get(`/products/${id}`);
                const normalized = this.normalizeProduct(response.data.data);

                cache.set(cacheKey, normalized, 3600); // 1 hour TTL
                return normalized;
            } catch (error) {
                this.handleError(error, `Getting product ${id}`);
            }
        });
    }

    /**
     * Normalize KassalProduct to local Product interface
     */
    private normalizeProduct(p: KassalProduct): Product {
        // Extract price from various possible fields
        let price = p.price || 0;

        if (p.current_price !== undefined) {
            if (typeof p.current_price === 'number') {
                price = p.current_price;
            } else if (typeof p.current_price === 'object' && p.current_price?.price) {
                price = p.current_price.price;
            }
        } else if (p.price_history && p.price_history.length > 0) {
            price = p.price_history[0].price;
        }

        return {
            id: p.id,
            name: p.name,
            price: price,
            store: p.store?.name || 'Unknown Store',
            image_url: p.image || '',
            unit: p.nutrition?.[0]?.unit || 'stk', // Fallback unit
            priceHistory: p.price_history
        };
    }

    /**
     * Standard error handler for API calls
     */
    private handleError(error: any, context: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<any>;
            const status = axiosError.response?.status || 502;
            const message = axiosError.response?.data?.message || axiosError.message;

            throw new ApiError(status, `Kassal API Error (${context}): ${message}`);
        }

        throw new ApiError(500, `Internal Error during Kassal API call: ${context}`);
    }

    /**
     * Checks if the Kassal API is responsive.
     */
    public async checkHealth(): Promise<boolean> {
        try {
            if (!config.kassalApiKey) return false;
            // Simple request to search with empty query to test connectivity
            await this.api.get('/products', { params: { search: 'ping', size: 1 } });
            return true;
        } catch (error) {
            console.error('[KassalService] Health check failed:', error);
            return false;
        }
    }
    /**
     * Helper to clean store names (remove REMA_1000, suffixes etc)
     */
    private normalizeStoreName(name: string): string {
        if (!name) return '';

        let clean = name.replace(/_/g, ' ');

        // Remove common technical suffixes
        clean = clean.replace(/\sNO$/i, '');
        clean = clean.replace(/\sSE$/i, '');
        clean = clean.replace(/\sDK$/i, '');

        // Casing normalization: UPPER CASE -> Title Case
        if (clean === clean.toUpperCase()) {
            clean = clean.toLowerCase().split(' ').map(word => {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }).join(' ');
        }

        return clean.trim();
    }
}

export const kassalService = new KassalService();
export default kassalService;
