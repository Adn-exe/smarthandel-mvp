
/**
 * Utility to provide emoji fallbacks for product categories/names
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
    'yoghurt': '🍦'
};

export function getProductFallback(name: string): string {
    const lowerName = name.toLowerCase();

    // Check for exact word matches first
    for (const [keyword, emoji] of Object.entries(keywordToEmoji)) {
        if (lowerName.includes(keyword)) {
            return emoji;
        }
    }

    // Default fallback
    return '🛍️';
}
