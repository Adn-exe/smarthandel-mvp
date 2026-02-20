
/**
 * Utility to provide emoji fallbacks or image placeholders for products
 * when actual images are unavailable.
 */

const keywordToEmoji: Record<string, string> = {
    'milk': '🥛',
    'melk': '🥛',
    'bread': '🍞',
    'brød': '🍞',
    'egg': '🥚',
    'eggs': '🥚',
    'cheese': '🧀',
    'ost': '🧀',
    'chicken': '🍗',
    'kylling': '🍗',
    'meat': '🥩',
    'kjøtt': '🥩',
    'minced': '🥩',
    'kjøttdeig': '🥩',
    'salmon': '🐟',
    'laks': '🐟',
    'fish': '🐟',
    'fisk': '🐟',
    'apple': '🍎',
    'eple': '🍎',
    'banana': '🍌',
    'banan': '🍌',
    'carrot': '🥕',
    'gulrot': '🥕',
    'potato': '🥔',
    'potet': '🥔',
    'tomato': '🍅',
    'tomat': '🍅',
    'cucumber': '🥒',
    'agurk': '🥒',
    'broccoli': '🥦',
    'pasta': '🍝',
    'rice': '🍚',
    'ris': '🍚',
    'coffee': '☕',
    'kaffe': '☕',
    'juice': '🧃',
    'butter': '🧈',
    'smør': '🧈',
    'flour': '🧑‍🍳',
    'mel': '🧑‍🍳',
    'onion': '🧅',
    'løk': '🧅',
    'soda': '🥤',
    'brus': '🥤',
    'water': '💧',
    'vann': '💧',
    'fruit': '🍎',
    'frukt': '🍎',
    'veg': '🥦',
    'grønnsak': '🥦',
    'snack': '🍿',
    'sweets': '🍬',
    'godteri': '🍬',
    'pizza': '🍕',
    'yogurt': '🍦',
    'yoghurt': '🍦',
    'candy': '🍬',
    'godt': '🍬',
    'chips': '🍿',
    'soap': '🧼',
    'såpe': '🧼',
    'toilet': '🧻',
    'papir': '🧻',
    'sausage': '🌭',
    'pølse': '🌭',
    'ham': '🍖',
    'skinke': '🍖',
    'bacon': '🥓',
    'jam': '🍯',
    'syltetøy': '🍯',
    'honey': '🍯',
    'honning': '🍯',
    'oil': '🧴',
    'olje': '🧴',
    'salt': '🧂',
    'pepper': '🌶️',
    'spice': '🌶️',
    'krydder': '🌶️',
    'tea': '🍵',
    'te': '🍵',
    'sugar': '🍬',
    'sukker': '🍬',
    'garlic': '🧄',
    'hvitløk': '🧄',
    'ginger': '🫚',
    'ingefær': '🫚',
    'lemon': '🍋',
    'sitron': '🍋',
    'lime': '🍋',
    'orange': '🍊',
    'appelsin': '🍊',
    'grapes': '🍇',
    'druer': '🍇',
    'strawberry': '🍓',
    'jordbær': '🍓'
};

/**
 * Returns either an emoji string or a path to a placeholder image.
 */
export function getProductFallback(name: string, forceEmoji = false): string {
    const lowerName = name.toLowerCase();

    // Check for exact word matches first
    for (const [keyword, emoji] of Object.entries(keywordToEmoji)) {
        if (lowerName.includes(keyword)) {
            return emoji;
        }
    }

    if (forceEmoji) return '📦'; // Universal item emoji

    // Default fallback: 2D Strike-through Bag (New)
    return '/images/not-available.png';
}

/**
 * Helper to determine if the fallback is a path or an emoji.
 */
export function isImageFallback(fallback: string): boolean {
    return fallback.startsWith('/');
}
