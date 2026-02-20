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

    const sId = String(store.id);
    const sName = store.name.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const sChain = store.chain.toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

    // 0. ID Matching (Absolute match for indexed products)
    if (pStore === sId) {
        return MatchLevel.BRANCH;
    }

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
// Shared mappings for normalization
export const QUERY_MAPPINGS: Record<string, string> = {
    'apple': 'epler', 'apples': 'epler', 'eple': 'epler',
    'banana': 'bananer', 'bananas': 'bananer', 'banan': 'bananer',
    'pear': 'pærer', 'pears': 'pærer', 'pære': 'pærer',
    'orange': 'appelsiner', 'oranges': 'appelsiner', 'appelsin': 'appelsiner',
    'grapes': 'druer', 'drue': 'druer',
    'lemon': 'sitron', 'lemons': 'sitroner',
    'lime': 'lime', 'limes': 'lime',
    'carrot': 'gulrøtter', 'carrots': 'gulrøtter', 'gulrot': 'gulrøtter',
    'potato': 'poteter', 'potatoes': 'poteter', 'potet': 'poteter',
    'tomato': 'tomater', 'tomatoes': 'tomater', 'tomat': 'tomater',
    'cucumber': 'agurk', 'cucumbers': 'agurk',
    'broccoli': 'brokkoli',
    'onion': 'løk', 'onions': 'løk',
    'garlic': 'hvitløk',
    'paprika': 'paprika', 'peppers': 'paprika',
    'bread': 'brød',
    'pasta': 'pasta',
    'rice': 'ris',
    'milk': 'melk',
    'cheese': 'hvitost',
    'butter': 'smør',
    'eggs': 'egg', 'egg': 'egg',
    'kneipp': 'kneippbrød',
    'chicken': 'kylling',
    'minced meat': 'kjøttdeig', 'ground meat': 'kjøttdeig',
    'minced beef': 'karbonadedeig',
    'salmon': 'laks',
    'sausages': 'pølser', 'sausage': 'pølser', 'pølse': 'pølser',
    'bacon': 'bacon',
    'coffee': 'kaffe',
    'pizza': 'pizza',
    'taco': 'taco',
    'soda': 'brus',
    'orange juice': 'appelsinjuice',
    'flour': 'hvetemel', 'wheat flour': 'hvetemel',
    'sugar': 'sukker',
    'salt': 'salt',
    'pepper': 'pepper',
    'oil': 'olje', 'cooking oil': 'matolje',
    'cream': 'fløte',
    'sour cream': 'rømme',
    'yogurt': 'yoghurt',
    'yeast': 'gjær',
    'baking powder': 'bakepulver',
    'vanilla sugar': 'vaniljesukker',
    'cinnamon': 'kanel',
    'cardamom': 'kardemomme',
    'oats': 'havregryn', 'oatmeal': 'havregryn',
    'corn': 'mais',
    'noodles': 'nudler',
    'tuna': 'tunfisk',
    'ham': 'skinke',
    'salami': 'salami',
    'jam': 'syltetøy',
    'honey': 'honning',
    'ketchup': 'ketchup',
    'mustard': 'sennep',
    'mayonnaise': 'majones',
    'soap': 'såpe', 'hand soap': 'håndsåpe',
    'shampoo': 'sjampo',
    'conditioner': 'balsam',
    'toilet paper': 'toalettpapir',
    'diapers': 'bleier',
    'toothpaste': 'tannkrem',
    'toothbrush': 'tannbørste',
    'shave': 'barber', 'shaving': 'barber',
    'deodorant': 'deodorant',
    'laundry detergent': 'vaskemiddel',
    'dishwasher tablets': 'oppvaskmaskin',
    'cleaning spray': 'rengjøringsspray',
};

/**
 * Ensures that a query word exists as a standalone word in the product name.
 * Prevents "Mellomleggspapir" from matching "egg".
 */
export function isStrictWordMatch(productName: string, query: string): boolean {
    const normalizedName = productName.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const mappedQuery = QUERY_MAPPINGS[normalizedQuery] || normalizedQuery;

    // Word boundary regex: \bquery\b
    // We also allow the word to be followed by numbers (e.g. "egg 12pk") or spaces
    const strictRegex = new RegExp(`\\b${mappedQuery}(\\b|\\d|\\s|-)`, 'i');
    return strictRegex.test(normalizedName);
}

export function calculateRelevanceScore(productName: string, query: string): number {
    const normalizedName = productName.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    // Unmap the query if possible (e.g. "milk" -> "melk")
    const mappedQuery = QUERY_MAPPINGS[normalizedQuery] || normalizedQuery;

    let score = 0;

    // 0. VISUAL NOISE REMOVAL (Ignore volume/weight for matching)
    const cleanName = normalizedName.replace(/\d+(g|kg|ml|l|pk|stk)/g, '').trim();

    // 1. Exact Match (Highest Priority)
    if (normalizedName === mappedQuery || cleanName === mappedQuery) {
        score += 100;
    }
    // 2. Starts With (High Priority)
    else if (normalizedName.startsWith(mappedQuery)) {
        score += 80;
    }
    // 3. Ends With (High Priority - e.g. "Kylling")
    else if (normalizedName.endsWith(mappedQuery) || normalizedName.split(' ').some(w => w.endsWith(mappedQuery))) {
        score += 75;
    }
    // 4. Exact Word Match (Medium Priority)
    else if (normalizedName.split(' ').includes(mappedQuery)) {
        score += 60;
    }
    // 5. Contains (Low Priority)
    else if (normalizedName.includes(mappedQuery)) {
        score += 40;
    }

    // 5b. SEARCH INTEGRITY GUARD: Mandatory word boundary match
    // If the word isn't a standalone word (e.g. "egg" inside "Mellomleggspapir"), apply massive penalty
    if (!isStrictWordMatch(productName, query)) {
        score -= 10000; // Force it below any reasonable threshold
    }

    // 6. Length penalty (shorter names preferred) to avoid specific variations when generic requested
    score -= (normalizedName.length - mappedQuery.length) * 0.5;

    // 7. Contextual Boosts/Penalties (STAPLE PROTECTION)

    // RICE PROTECTION
    if (mappedQuery === 'ris' || mappedQuery === 'rice') {
        const RICE_BYPRODUCTS = ['kake', 'kjeks', 'grøt', 'mel', 'melk', 'drikk', 'nudler', 'chips', 'snacks', 'pudding', 'risotto', 'ferdig', 'miks'];
        if (RICE_BYPRODUCTS.some(b => normalizedName.includes(b))) {
            score -= 2000;
        }

        const RAW_RICE = ['basmati', 'jasmin', 'middag', 'middagsris', 'boil', 'tørr', 'langkornet', 'fullkorn'];
        if (RAW_RICE.some(r => normalizedName.includes(r))) {
            score += 500;
        }

        // Literal exact matches for 'ris' 
        if (normalizedName === 'ris' || normalizedName.startsWith('ris 1kg') || normalizedName.startsWith('ris 2kg')) {
            score += 800;
        }
    }

    // GENERIC FRUIT PROTECTION
    const FRUITS = ['epler', 'appelsiner', 'pærer', 'druer', 'sitron', 'sitroner', 'lime', 'mandariner', 'klementiner', 'mango', 'kiwi'];
    if (FRUITS.includes(mappedQuery) || FRUITS.includes(mappedQuery + 'er')) {
        const FRUIT_BYPRODUCTS = [
            'juice', 'saft', 'nektar', 'syltetøy', 'mos', 'smoothie',
            'yoghurt', 'is ', 'kake', 'pai', 'snacks', 'gull', 'chips',
            'vann', 'drikke', 'limonade', 'terte', 'godteri', 'pastill'
        ];

        if (FRUIT_BYPRODUCTS.some(b => normalizedName.includes(b))) {
            score -= 2000;
        }

        const RAW_FRUIT_SIGNALS = ['løsvekt', 'kurv', 'bama', 'norske', 'nett', 'stk', 'kg', 'importert', 'bunt'];
        if (RAW_FRUIT_SIGNALS.some(s => normalizedName.includes(s))) {
            score += 300;
        }
    }

    // Baby Food / Non-Staple Penalty
    // If query is a staple, avoid baby food or ready meals
    if (['kylling', 'laks', 'kjøttdeig', 'fisk', 'torsk'].includes(mappedQuery)) {
        const BABY_FOOD_SIGNALS = ['6mnd', '8mnd', '12mnd', 'nestle', 'småfolk', 'hipp', 'klemmepose', 'grøt', 'smoothie'];
        const MEAL_SIGNALS = ['søtpotetkylling', 'søtpotet&kylling', 'kylling&', 'kyllingsuppe', 'kyllinggryte', 'tikka', 'tandoori', 'panne', 'ferdig', 'salat', 'pålegg', 'skivet', 'mama', 'nudler', 'ramen', 'saus', 'bulljong', 'krydder', 'marinade', 'kraft', 'toro', 'satay', 'wok']; // Processed meals/sides

        if (BABY_FOOD_SIGNALS.some(s => normalizedName.includes(s))) {
            score -= 2000; // MASSIVE PENALTY - Block it
        }

        if (MEAL_SIGNALS.some(s => normalizedName.includes(s))) {
            score -= 1000; // Major penalty
        }
        // Prioritize raw ingredients (Huge boost to override price differences)
        if (normalizedName.includes('filet') || normalizedName.includes('bryst') || normalizedName.includes('lår') || normalizedName.includes('hel') || normalizedName.includes('kjøttdeig')) {
            score += 2000;
        }
    }

    if (mappedQuery === 'egg') {
        const BAD_EGG_SIGNALS = ['innlegg', 'salat', 'nudler', 'hvite', 'plomme', 'likør', 'sjokolade', 'bacon', 'gele', 'krem', 'røre', 'vaffel', 'pannekake', 'kaviar', 'majones'];

        // "Truseinnlegg" check
        if (BAD_EGG_SIGNALS.some(s => normalizedName.includes(s))) {
            score -= 2000;
        }

        // BOOST Actual Eggs
        if (normalizedName.includes('6pk') || normalizedName.includes('12pk') || normalizedName.includes('18pk') || normalizedName.includes(' 6 ') || normalizedName.includes(' 12 ') || normalizedName.includes(' 18 ') || normalizedName.includes('frittgående') || normalizedName.includes('solegg') || normalizedName.includes('økologisk')) {
            score += 500;
        }

        // Extra boost if name starts with "Egg" or "Prior Egg"
        if (normalizedName.startsWith('egg ') || normalizedName.startsWith('prior egg') || normalizedName.startsWith('first price egg') || normalizedName.startsWith('x-tra egg')) {
            score += 200;
        }
    }

    if (mappedQuery === 'melk') {
        if (normalizedName.includes('helmelk') || normalizedName.includes('lettmelk') || normalizedName.includes('skummet') || normalizedName.includes('ekstra lett')) {
            score += 50;
        }
        if (normalizedName.includes('sjokolade') || normalizedName.includes('jordbær') || normalizedName.includes('rull')) {
            score -= 50;
        }
    }

    if (mappedQuery === 'kaffe') {
        if (normalizedName.includes('filterkaffe') || normalizedName.includes('kokekaffe')) {
            score += 30;
        }
        if (normalizedName.includes('iskaffe')) {
            score -= 20;
        }
    }

    // SUGAR PROTECTION
    if (mappedQuery === 'sukker' || mappedQuery === 'sugar') {
        if (normalizedName.includes('sukkerfri') || normalizedName.includes('sugarfree') || normalizedName.includes('no sugar') || normalizedName.includes('uten sukker') || normalizedName.includes('null sukker')) {
            score -= 2000;
        }
        if (normalizedName.includes('sukkererter') || normalizedName.includes('sukkerkulør')) {
            score -= 2000;
        }
        if (normalizedName === 'sukker' || normalizedName === 'sukker 1kg' || normalizedName.includes('hvitt sukker') || normalizedName.includes('strøsukker')) {
            score += 500;
        }
    }

    // BANANA PROTECTION
    if (mappedQuery === 'banan' || mappedQuery === 'banana') {
        const NOT_BANANA = ['skum', 'godt', 'sjokolade', 'kake', 'shake', 'smoothie', 'yoghurt', 'juice', 'nektar', 'drikk', 'chips'];
        if (NOT_BANANA.some(s => normalizedName.includes(s))) {
            score -= 2000;
        }
        if (normalizedName.includes('klase') || normalizedName.includes('bama') || normalizedName.includes('first price') || normalizedName.includes('løsvekt')) {
            score += 500;
        }
    }

    // VEGETABLE PROTECTION
    const VEGGIES = ['løk', 'potet', 'agurk', 'gulrot', 'gulrøtter', 'tomat', 'paprika', 'salat', 'hvitløk', 'ingefær', 'chili'];
    if (VEGGIES.includes(mappedQuery) || VEGGIES.includes(mappedQuery.replace(/er$/, ''))) {
        const BYPRODUCT_SIGNALS = [
            'potetgull', 'chips', 'godt', 'snacks', 'frites', 'stappe', 'mos',
            'sprøstekt', 'krydder', 'miks', 'mix', 'blanding', 'suppe', 'gryte',
            'fryst', 'frossen', 'skivet', 'terning',
            'sylte', 'lake', 'salat',
            'juice', 'saft', 'drikk',
            'purre'
        ];

        if (BYPRODUCT_SIGNALS.some(s => normalizedName.includes(s))) {
            score -= 1000;
        }

        const RAW_SIGNALS = ['løsvekt', 'kg', 'pk', 'bunt', 'nett', 'stk', 'norsk', 'importert', 'vasket', 'knask'];
        if (RAW_SIGNALS.some(s => normalizedName.includes(s))) {
            score += 200;
        }

        if (normalizedName === mappedQuery || normalizedName === mappedQuery + 'er' || normalizedName.startsWith(mappedQuery + ' ')) {
            score += 300;
        }
    }

    // DROPDOWN CATEGORY PROTECTION
    if (mappedQuery === 'nøtter' || mappedQuery === 'nuts' || mappedQuery === 'peanøtter') {
        if (normalizedName.includes('donuts') || normalizedName.includes('sjokolade') || normalizedName.includes('kake')) {
            score -= 1000;
        }
    }

    if (mappedQuery === 'pizza') {
        if (normalizedName.includes('saus') || normalizedName.includes('krydder') || normalizedName.includes('fyll') || normalizedName.includes('bunn') || normalizedName.includes('deig')) {
            score -= 2000;
        }
    }

    if (mappedQuery === 'pasta') {
        if (normalizedName.includes('salat') || normalizedName.includes('saus') || normalizedName.includes('ferdig') || normalizedName.includes('carbonara') || normalizedName.includes('bolognese')) {
            score -= 1000;
        }
    }

    if (mappedQuery === 'sjokolade' || mappedQuery === 'chocolate') {
        const CHOCO_BYPRODUCTS = ['kake', 'cake', 'cookie', 'kjeks', 'mousse', 'pudding', 'is ', 'bolle', 'donut', 'pålegg', 'drikk', 'melk', 'propud', 'protein', 'shake', 'musli', 'granola', 'muffin', 'brownie'];
        if (CHOCO_BYPRODUCTS.some(b => normalizedName.includes(b))) {
            score -= 1000;
        }
    }

    if (mappedQuery === 'ost' || mappedQuery === 'cheese') {
        if (normalizedName.includes('doodles') || normalizedName.includes('popcorn') || normalizedName.includes('snacks') || normalizedName.includes('burger') || normalizedName.includes('pølse')) {
            score -= 2000;
        }
    }

    if (mappedQuery === 'brød' || mappedQuery === 'bread') {
        if (normalizedName.includes('flatbrød') || normalizedName.includes('knekkebrød') || normalizedName.includes('pita') || normalizedName.includes('hamburger')) {
            score -= 100;
        }
    }

    return score;
}

export function selectBestProductForStore(products: Product[], store: Store, queryIds: string[]): { product: Product, level: MatchLevel } | null {
    const scoredCandidates = products
        .map(p => ({ product: p, level: getProductMatchLevel(p, store) }))
        .filter(c => c.level !== MatchLevel.NONE && queryIds.includes(String(c.product.id)));

    if (scoredCandidates.length === 0) return null;

    const best = scoredCandidates.reduce((best, curr) => {
        if (curr.level > best.level) return curr;
        if (curr.level < best.level) return best;

        const sChain = store.chain.toLowerCase().trim();
        const bestIsHouse = best.product.name.toLowerCase().includes(sChain) || (sChain.includes('kiwi') && best.product.name.toLowerCase().includes('first price'));
        const currIsHouse = curr.product.name.toLowerCase().includes(sChain) || (sChain.includes('kiwi') && curr.product.name.toLowerCase().includes('first price'));

        if (currIsHouse && !bestIsHouse) return curr;
        if (bestIsHouse && !currIsHouse) return best;

        const scoreA = best.product.relevanceScore ?? 0;
        const scoreB = curr.product.relevanceScore ?? 0;
        const scoreDiff = scoreB - scoreA;

        if (scoreDiff > 500) return curr;
        if (scoreDiff < -500) return best;

        return curr.product.price < best.product.price ? curr : best;
    });

    return { product: best.product, level: best.level };
}

export function selectBestProductForStoreWithQuery(
    products: Product[],
    store: Store,
    queryIds: string[],
    originalQuery: string
): { product: Product, level: MatchLevel } | null {
    const scoredCandidates = products
        .map(p => {
            const dynamicRelevance = calculateRelevanceScore(p.name, originalQuery);
            return {
                product: { ...p, relevanceScore: dynamicRelevance },
                level: getProductMatchLevel(p, store)
            };
        })
        .filter(c => c.level !== MatchLevel.NONE && queryIds.includes(String(c.product.id)));

    if (scoredCandidates.length === 0) return null;

    const best = scoredCandidates.reduce((best, curr) => {
        const scoreA = best.product.relevanceScore ?? 0;
        const scoreB = curr.product.relevanceScore ?? 0;

        if (scoreB > 0 && scoreA < -500) return curr;
        if (scoreA > 0 && scoreB < -500) return best;
        if ((scoreB - scoreA) > 1000) return curr;

        if (curr.level > best.level) return curr;
        if (curr.level < best.level) return best;

        return curr.product.price < best.product.price ? curr : best;
    });

    return { product: best.product, level: best.level };
}

