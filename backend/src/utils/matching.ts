import { Product, Store } from '../types/index.js';

/**
 * Centeralized logic to determine if a product belongs to a specific store instance or its chain.
 * This ensures consistency across ComparisonService and RouteService.
 */
export enum MatchLevel {
    NONE = 0,
    PARENT = 1,
    CHAIN = 2,
    BRANCH = 3
}

/**
 * Centeralized logic to determine the match quality between a product and a store.
 */
export function getProductMatchLevel(product: Product, store: Store): MatchLevel {
    const pStore = product.store.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const pChain = (product.chain || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    const sName = store.name.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const sChain = store.chain.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Branch Specific Matching (Best: Name or Address check)
    // PRODUCT must be as specific or more specific than the STORE (e.g. "Rema 1000 Grünerløkka")
    const pAddress = (product.address || '').toLowerCase().trim();
    const sAddress = (store.address || '').toLowerCase().trim();

    const isNameSpecificMatch = pStore === sName || pStore.includes(sName);
    const isAddressMatch = sAddress && pAddress && (pAddress.includes(sAddress) || sAddress.includes(pAddress));

    if (isNameSpecificMatch || isAddressMatch) {
        return MatchLevel.BRANCH;
    }


    // 2. Chain Level Matching (Fallback: e.g. "Rema 1000" matches "REMA")
    if (pStore.includes(sChain) || sChain.includes(pStore) || pChain.includes(sChain) || sChain.includes(pChain)) {
        return MatchLevel.CHAIN;
    }

    // 3. Parent Group Matching (Loose Fallback)
    const PARENT_GROUPS: Record<string, string[]> = {
        'norgesgruppen': ['meny', 'spar', 'kiwi', 'joker', 'nærkjøp'],
        'coop': ['coop', 'extra', 'prix', 'obs', 'mega', 'marked'],
        'reitan': ['rema 1000', 'rema', '7-eleven', 'narvesen']
    };

    for (const [parent, children] of Object.entries(PARENT_GROUPS)) {
        const isParentInProduct = pStore.includes(parent) || pChain.includes(parent);
        const isStoreInGroup = children.some(child => sChain.includes(child) || sName.includes(child));

        if (isParentInProduct && isStoreInGroup) {
            return MatchLevel.PARENT;
        }
    }

    return MatchLevel.NONE;
}

/**
 * Legacy wrapper for boolean matching.
 */
export function matchProductToStore(product: Product, store: Store): boolean {
    return getProductMatchLevel(product, store) !== MatchLevel.NONE;
}

/**
 * Selects the best product from a list for a specific store.
 * Prioritizes MatchLevel, then Relevance, then Price.
 */
export function selectBestProductForStore(products: Product[], store: Store, queryIds: string[]): Product | null {
    const scoredCandidates = products
        .map(p => ({ product: p, level: getProductMatchLevel(p, store) }))
        .filter(c => c.level !== MatchLevel.NONE && queryIds.includes(String(c.product.id)));

    if (scoredCandidates.length === 0) return null;

    return scoredCandidates.reduce((best, curr) => {
        // Priority 1: Match Level (Branch > Chain > Parent)
        if (curr.level > best.level) return curr;
        if (curr.level < best.level) return best;

        // Priority 2: House Brand Bonus (Chain name in product name)
        const sChain = store.chain.toLowerCase().trim();
        const bestHasChain = best.product.name.toLowerCase().includes(sChain);
        const currHasChain = curr.product.name.toLowerCase().includes(sChain);

        // Special case for KIWI (First Price is their house brand)
        const isKiwiHouseBrand = (name: string) => name.toLowerCase().includes('first price');
        const bestIsKiwiHouse = sChain.includes('kiwi') && isKiwiHouseBrand(best.product.name);
        const currIsKiwiHouse = sChain.includes('kiwi') && isKiwiHouseBrand(curr.product.name);

        const bestIsHouse = bestHasChain || bestIsKiwiHouse;
        const currIsHouse = currHasChain || currIsKiwiHouse;

        if (currIsHouse && !bestIsHouse) return curr;
        if (bestIsHouse && !currIsHouse) return best;

        // Priority 3: Relevance Score
        const scoreA = best.product.relevanceScore ?? 0;
        const scoreB = curr.product.relevanceScore ?? 0;
        const scoreDiff = scoreB - scoreA;

        if (scoreDiff < -2000) return curr;
        if (scoreDiff > 2000) return best;

        // Priority 3: Price (Cheaper is better)
        return curr.product.price < best.product.price ? curr : best;
    }).product;
}

