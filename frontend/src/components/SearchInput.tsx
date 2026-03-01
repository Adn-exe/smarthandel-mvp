import { useState, useRef, useEffect, memo, useMemo } from 'react';
import { Search, X, Loader2, Plus, Check } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SearchInputProps {
    onSearch: (query: string) => void;
    loading?: boolean;
    placeholder?: string;
    className?: string;
    variant?: 'default' | 'compact';
    initialOpen?: boolean;
    isStatic?: boolean;
}

interface Product {
    id: string;
    nameKey: string;
    emoji: string;
    keywords: string[];
    category: 'groceries' | 'fruit' | 'vegetable' | 'meat' | 'dairy' | 'bakery' | 'pantry' | 'snack' | 'beverage' | 'frozen';
}

// Predefined products with translation keys and keywords for strict matching
const PRODUCTS: Product[] = [
    // GROCERIES (Essentials - 12 items)
    { id: 'milk', nameKey: 'products.milk', emoji: '🥛', keywords: ['melk', 'milk', 'tine', 'lettmelk'], category: 'groceries' },
    { id: 'bread', nameKey: 'products.bread', emoji: '🍞', keywords: ['brød', 'bread', 'grovbrød', 'kneipp'], category: 'groceries' },
    { id: 'eggs', nameKey: 'products.eggs', emoji: '🥚', keywords: ['egg', 'eggs', 'prior'], category: 'groceries' },
    { id: 'cheese', nameKey: 'products.cheese', emoji: '🧀', keywords: ['ost', 'cheese', 'norvegia', 'hvitost'], category: 'groceries' },
    { id: 'butter', nameKey: 'products.butter', emoji: '🧈', keywords: ['smør', 'butter', 'bremykt'], category: 'groceries' },
    { id: 'coffee', nameKey: 'products.coffee', emoji: '☕', keywords: ['kaffe', 'coffee', 'friele', 'evergood'], category: 'groceries' },
    { id: 'pasta', nameKey: 'products.pasta', emoji: '🍝', keywords: ['pasta', 'spaghetti', 'fusilli'], category: 'groceries' },
    { id: 'rice', nameKey: 'products.rice', emoji: '🍚', keywords: ['ris', 'rice', 'jasminris'], category: 'groceries' },
    { id: 'sugar', nameKey: 'products.sugar', emoji: '🥡', keywords: ['sukker', 'sugar'], category: 'groceries' },
    { id: 'salt', nameKey: 'products.salt', emoji: '🧂', keywords: ['salt'], category: 'groceries' },
    { id: 'oil', nameKey: 'products.oil', emoji: '🌻', keywords: ['olje', 'oil', 'rapsolje'], category: 'groceries' },
    { id: 'flour', nameKey: 'products.flour', emoji: '🌾', keywords: ['mel', 'flour', 'hvetemel'], category: 'groceries' },

    // FRUIT
    { id: 'apple', nameKey: 'products.apple', emoji: '🍎', keywords: ['eple', 'apple', 'pink lady', 'granny smith'], category: 'fruit' },
    { id: 'banana', nameKey: 'products.banana', emoji: '🍌', keywords: ['banan', 'banana'], category: 'fruit' },
    { id: 'grapes', nameKey: 'products.grapes', emoji: '🍇', keywords: ['druer', 'grapes', 'grønne druer'], category: 'fruit' },
    { id: 'orange', nameKey: 'products.orange', emoji: '🍊', keywords: ['appelsin', 'orange', 'sitrus'], category: 'fruit' },
    { id: 'pear', nameKey: 'products.pear', emoji: '🍐', keywords: ['pære', 'pear'], category: 'fruit' },
    { id: 'kiwi', nameKey: 'products.kiwi', emoji: '🥝', keywords: ['kiwi'], category: 'fruit' },
    { id: 'mango', nameKey: 'products.mango', emoji: '🥭', keywords: ['mango'], category: 'fruit' },
    { id: 'lemon', nameKey: 'products.lemon', emoji: '🍋', keywords: ['sitron', 'lemon'], category: 'fruit' },
    { id: 'lime', nameKey: 'products.lime', emoji: '🍋‍🟩', keywords: ['lime'], category: 'fruit' },
    { id: 'avocado', nameKey: 'products.avocado', emoji: '🥑', keywords: ['avokado', 'avocado'], category: 'fruit' },

    // VEGETABLES
    { id: 'potato', nameKey: 'products.potato', emoji: '🥔', keywords: ['potet', 'potato', 'mandelpotet', 'beate'], category: 'vegetable' },
    { id: 'carrot', nameKey: 'products.carrot', emoji: '🥕', keywords: ['gulrot', 'carrot', 'gulrøtter'], category: 'vegetable' },
    { id: 'cucumber', nameKey: 'products.cucumber', emoji: '🥒', keywords: ['agurk', 'cucumber'], category: 'vegetable' },
    { id: 'tomato', nameKey: 'products.tomato', emoji: '🍅', keywords: ['tomat', 'tomato', 'cherrytomat'], category: 'vegetable' },
    { id: 'onion', nameKey: 'products.onion', emoji: '🧅', keywords: ['løk', 'onion', 'rødløk', 'gul løk'], category: 'vegetable' },
    { id: 'garlic', nameKey: 'products.garlic', emoji: '🧄', keywords: ['hvitløk', 'garlic'], category: 'vegetable' },
    { id: 'pepper', nameKey: 'products.pepper', emoji: '🫑', keywords: ['paprika', 'pepper', 'rød paprika'], category: 'vegetable' },
    { id: 'broccoli', nameKey: 'products.broccoli', emoji: '🥦', keywords: ['brokkoli', 'broccoli'], category: 'vegetable' },
    { id: 'lettuce', nameKey: 'products.lettuce', emoji: '🥬', keywords: ['salat', 'lettuce', 'isberg'], category: 'vegetable' },
    { id: 'corn', nameKey: 'products.corn', emoji: '🌽', keywords: ['mais', 'corn'], category: 'vegetable' },

    // MEAT
    { id: 'chicken', nameKey: 'products.chicken', emoji: '🍗', keywords: ['kylling', 'chicken', 'filet'], category: 'meat' },
    { id: 'minced_meat', nameKey: 'products.minced_meat', emoji: '🥩', keywords: ['kjøttdeig', 'minced meat', 'karbonadedeig'], category: 'meat' },
    { id: 'salmon', nameKey: 'products.salmon', emoji: '🐟', keywords: ['laks', 'salmon', 'filet'], category: 'meat' },
    { id: 'pork', nameKey: 'products.pork', emoji: '🐖', keywords: ['svinekjøtt', 'pork', 'koteletter'], category: 'meat' },
    { id: 'beef', nameKey: 'products.beef', emoji: '🍖', keywords: ['storfekjøtt', 'beef', 'biff'], category: 'meat' },
    { id: 'sausage', nameKey: 'products.sausage', emoji: '🌭', keywords: ['pølse', 'sausage', 'grillpølse'], category: 'meat' },
    { id: 'bacon', nameKey: 'products.bacon', emoji: '🥓', keywords: ['bacon', 'spekeskinke'], category: 'meat' },

    // DAIRY
    { id: 'yogurt', nameKey: 'products.yogurt', emoji: '🥣', keywords: ['yoghurt', 'yogurt', 'skogsbær'], category: 'dairy' },
    { id: 'cream', nameKey: 'products.cream', emoji: '🥛', keywords: ['fløte', 'cream', 'kremfløte', 'matfløte'], category: 'dairy' },
    { id: 'sour_cream', nameKey: 'products.sour_cream', emoji: '🥣', keywords: ['rømme', 'sour cream', 'lettrømme'], category: 'dairy' },
    { id: 'cheese_spread', nameKey: 'products.cheese_spread', emoji: '🧀', keywords: ['smøreost', 'kavli'], category: 'dairy' },

    // BAKERY
    { id: 'baguette', nameKey: 'products.baguette', emoji: '🥖', keywords: ['baguette', 'franskbrød'], category: 'bakery' },
    { id: 'croissant', nameKey: 'products.croissant', emoji: '🥐', keywords: ['croissant'], category: 'bakery' },
    { id: 'buns', nameKey: 'products.buns', emoji: '🥯', keywords: ['boller', 'buns', 'sjokoladebolle'], category: 'bakery' },
    { id: 'cinnamon_roll', nameKey: 'products.cinnamon_roll', emoji: '🌀', keywords: ['kanelbolle', 'skillingsbolle'], category: 'bakery' },

    // PANTRY
    { id: 'taco', nameKey: 'products.taco', emoji: '🌮', keywords: ['taco', 'lefser', 'skjell'], category: 'pantry' },
    { id: 'jam', nameKey: 'products.jam', emoji: '🍓', keywords: ['syltetøy', 'nora'], category: 'pantry' },
    { id: 'pasta', nameKey: 'products.pasta', emoji: '🍝', keywords: ['pasta', 'spaghetti', 'makaroni'], category: 'pantry' },
    { id: 'pizza', nameKey: 'products.pizza', emoji: '🍕', keywords: ['pizza', 'grandiosa'], category: 'pantry' },

    // SNACKS
    { id: 'chips', nameKey: 'products.chips', emoji: '🍟', keywords: ['chips', 'potetgull', 'snacks'], category: 'snack' },
    { id: 'chocolate', nameKey: 'products.chocolate', emoji: '🍫', keywords: ['sjokolade', 'chocolate', 'kvikk lunsj'], category: 'snack' },
    { id: 'nuts', nameKey: 'products.nuts', emoji: '🥜', keywords: ['nøtter', 'nuts', 'peanøtter'], category: 'snack' },
    { id: 'cookies', nameKey: 'products.cookies', emoji: '🍪', keywords: ['kjeks', 'cookies', 'safari'], category: 'snack' },

    // BEVERAGE
    { id: 'soda', nameKey: 'products.soda', emoji: '🥤', keywords: ['brus', 'soda', 'cola', 'pepsi'], category: 'beverage' },
    { id: 'orange_juice', nameKey: 'products.orange_juice', emoji: '🧃', keywords: ['appelsinjuice', 'juice'], category: 'beverage' },
    { id: 'water', nameKey: 'products.water', emoji: '💧', keywords: ['vann', 'water', 'farris'], category: 'beverage' },
    { id: 'energy_drink', nameKey: 'products.energy_drink', emoji: '⚡', keywords: ['energidrikk', 'energy drink', 'red bull'], category: 'beverage' },

    // FROZEN FOOD
    { id: 'frozen_pizza', nameKey: 'products.frozen_pizza', emoji: '🍕', keywords: ['pizza', 'grandiosa', 'frossen pizza'], category: 'frozen' },
    { id: 'frozen_peas', nameKey: 'products.frozen_peas', emoji: '🫛', keywords: ['erter', 'peas', 'frosne erter'], category: 'frozen' },
    { id: 'frozen_berries', nameKey: 'products.frozen_berries', emoji: '🫐', keywords: ['bær', 'berries', 'frosne bær'], category: 'frozen' },
    { id: 'fish_sticks', nameKey: 'products.fish_sticks', emoji: '🐟', keywords: ['fiskepinner', 'fish sticks', 'findus'], category: 'frozen' }
];

export const SearchInput = memo(function SearchInput({
    onSearch,
    loading = false,
    placeholder,
    className,
    variant = 'default',
    initialOpen = false,
    isStatic = false
}: SearchInputProps) {
    const { t } = useTranslation();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [selectedCategory, setSelectedCategory] = useState<string>('groceries');
    const [isDropdownOpen, setIsDropdownOpen] = useState(initialOpen);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter products based on input value
    const filteredProducts = useMemo(() => {
        const query = inputValue.toLowerCase().trim();

        let filtered = PRODUCTS;

        // If searching, ignore category filter (show global search)
        // If NOT searching, filter by category
        if (!query) {
            if (selectedCategory !== 'all') {
                filtered = filtered.filter(p => p.category === selectedCategory);

                // If category is "groceries", we also include items that are effectively groceries from other cats? 
                // Or just keep the strict manual assignment? Manual is safer for now.
            }
        } else {
            // Search mode
            filtered = filtered.filter(product => {
                const name = t(product.nameKey).toLowerCase();
                return name.includes(query) || product.keywords.some(kw => kw.toLowerCase().includes(query));
            });
        }

        return filtered;
    }, [inputValue, selectedCategory, t]);

    // Toggle item selection
    const toggleItem = (productId: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
        setInputValue(''); // Clear input after selection
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isStatic) return; // Never close if static
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isStatic]);

    // Construct search query from both selected items and current input text
    const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault();

        const queryParts: string[] = [];

        // 1. Add explicitly selected items from dropdown
        if (selectedItems.size > 0) {
            const selectedNames = Array.from(selectedItems).map(id => {
                const product = PRODUCTS.find(p => p.id === id);
                return product ? t(product.nameKey) : '';
            }).filter(Boolean);
            queryParts.push(...selectedNames);
        }

        // 2. Add current input text
        if (inputValue.trim()) {
            queryParts.push(inputValue.trim());
        }

        if (queryParts.length > 0 && !loading) {
            onSearch(queryParts.join(', '));
            if (!isStatic) setIsDropdownOpen(false);
            setInputValue(''); // Clear input after successful submit
            setSelectedItems(new Set()); // Clear selection after successful submit
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItems(new Set());
        setInputValue('');
        inputRef.current?.focus();
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDropdownOpen(true);
    };

    return (
        <div ref={containerRef} className={twMerge("w-full max-w-2xl mx-auto relative z-50", className)}>
            <form
                onSubmit={handleSubmit}
                className={clsx(
                    "relative group transition-all duration-300 ease-in-out",
                    "bg-white rounded-2xl shadow-sm border",
                    isDropdownOpen ? "border-indigo-300 ring-4 ring-indigo-50/50" : "border-slate-200",
                    variant === 'compact' ? "shadow-none" : "shadow-slate-100"
                )}
            >
                {/* Input Area */}
                <div
                    className={clsx(
                        "relative flex flex-col cursor-text",
                        variant === 'compact' ? "p-3 sm:p-4 min-h-[60px]" : "p-4 sm:p-6 min-h-[80px]"
                    )}
                    onClick={() => inputRef.current?.focus()}
                >
                    <div className="flex items-start gap-3">
                        <Search className={clsx(
                            "transition-colors duration-300 shrink-0",
                            variant === 'compact' ? "w-5 h-5 mt-0.5" : "w-6 h-6 mt-1",
                            isDropdownOpen ? "text-indigo-400" : "text-slate-300"
                        )} />

                        <div className="flex-grow min-w-0">
                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                {Array.from(selectedItems).map(id => {
                                    const product = PRODUCTS.find(p => p.id === id);
                                    if (!product) return null;
                                    return (
                                        <span
                                            key={id}
                                            className={clsx(
                                                "inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-bold animate-in zoom-in-95 duration-200 border border-indigo-100 shadow-sm whitespace-nowrap",
                                                variant === 'compact' ? "px-2 py-1 text-[10px] uppercase tracking-wider" : "px-3 py-1.5 text-sm"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleItem(id);
                                            }}
                                        >
                                            <span>{product.emoji}</span>
                                            <span>{t(product.nameKey)}</span>
                                            <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                                        </span>
                                    );
                                })}

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    onClick={handleInputClick}
                                    placeholder={selectedItems.size === 0 ? (placeholder || t('home.placeholder')) : ""}
                                    className={clsx(
                                        "flex-grow min-w-[150px] bg-transparent border-none focus:ring-0 p-0 outline-none placeholder:text-slate-300 tabular-nums",
                                        variant === 'compact' ? "text-sm py-0.5" : "text-xl sm:text-2xl",
                                        selectedItems.size > 0 && variant !== 'compact' && "text-base sm:text-lg py-1"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Button for compact mode inside the input row */}
                        {variant === 'compact' && (
                            <button
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.nativeEvent.stopImmediatePropagation();
                                    handleSubmit();
                                }}
                                disabled={(selectedItems.size === 0 && !inputValue.trim()) || loading}
                                className={clsx(
                                    "p-2 rounded-xl transition-all duration-300 disabled:opacity-30",
                                    (selectedItems.size > 0 || inputValue.trim()) && !loading
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                        : "bg-slate-50 text-slate-400"
                                )}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </button>
                        )}
                    </div>

                    {/* Dropdown Relist Button (Compact Mode) - REMOVED per user request */}
                </div>

                {/* Footer Area - Only show in default mode */}
                {variant !== 'compact' && (
                    <div className="mt-4 flex items-end justify-between gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                            {selectedItems.size} {t('storeCard.items', 'items')} selected
                        </span>

                        <div className="flex items-center gap-2">
                            {(selectedItems.size > 0 || inputValue) && (
                                <button
                                    onClick={handleClear}
                                    className="p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-full transition-all"
                                    type="button"
                                    aria-label="Clear selection"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={(selectedItems.size === 0 && !inputValue.trim()) || loading}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 text-sm",
                                    "disabled:opacity-30 disabled:cursor-not-allowed",
                                    (selectedItems.size > 0 || inputValue.trim()) && !loading
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transform active:scale-95"
                                        : "bg-slate-50 text-slate-400"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('common.thinking')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('common.shop')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>

            {/* Dropdown Panel */}
            {isDropdownOpen && (
                <div className={clsx(
                    "bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 animate-in fade-in slide-in-from-top-4 duration-200 z-50 overflow-y-auto custom-scrollbar",
                    isStatic ? "mt-6 relative shadow-sm border-slate-200" : "absolute top-full left-0 right-0 mt-4 max-h-[400px]"
                )}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {filteredProducts.length > 0
                                ? (inputValue ? t('common.matches', 'Matches found') : t('common.describe_need', 'Select items'))
                                : t('common.ai_fallback', 'No matches?')}
                        </h3>
                        {!isStatic && (
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(false)}
                                className="text-gray-400 hover:text-dark p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Category Selection (2-row Grid) */}
                    {!inputValue && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-8">
                            {[
                                { id: 'groceries', icon: '🛒', label: 'Groceries', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                                { id: 'fruit', icon: '🍎', label: 'Fruit', color: 'bg-red-50 text-red-600 border-red-100' },
                                { id: 'vegetable', icon: '🥕', label: 'Veggies', color: 'bg-green-50 text-green-600 border-green-100' },
                                { id: 'meat', icon: '🥩', label: 'Meat', color: 'bg-rose-50 text-rose-600 border-rose-100' },
                                { id: 'dairy', icon: '🥛', label: 'Dairy', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                                { id: 'bakery', icon: '🍞', label: 'Bakery', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                                { id: 'pantry', icon: '🍝', label: 'Pantry', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
                                { id: 'snack', icon: '🍫', label: 'Snack', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                                { id: 'beverage', icon: '🥤', label: 'Drinks', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
                                { id: 'frozen', icon: '❄️', label: 'Frozen', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCategory(cat.id);
                                    }}
                                    className={clsx(
                                        "flex items-center gap-2.5 p-2.5 rounded-xl text-[11px] font-bold transition-all border duration-300",
                                        selectedCategory === cat.id
                                            ? `${cat.color} shadow-sm border-transparent transform scale-[1.02] ring-1 ring-current/10`
                                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    <span className="text-xl shrink-0">{cat.icon}</span>
                                    <span className="truncate">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Separator Line */}
                    {!inputValue && (
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px flex-grow bg-slate-100"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            <div className="h-px flex-grow bg-slate-100"></div>
                        </div>
                    )}

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                            {filteredProducts.map((product) => {
                                const isSelected = selectedItems.has(product.id);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => toggleItem(product.id)}
                                        className={clsx(
                                            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left border",
                                            isSelected
                                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                                                : "bg-slate-50 border-transparent text-slate-600 hover:bg-white hover:shadow-sm hover:border-slate-100"
                                        )}
                                    >
                                        <span className="text-2xl">{product.emoji}</span>
                                        <span className="font-medium text-sm sm:text-base truncate">
                                            {t(product.nameKey)}
                                        </span>
                                        {isSelected && (
                                            <Check className="w-4 h-4 ml-auto" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                                "{inputValue}" not in list.
                            </p>
                            <p className="text-sm text-gray-400">
                                Press Enter to search with AI.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Hint Text */}
            {!isDropdownOpen && (
                <p className="mt-3 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest animate-in fade-in duration-700">
                    <Trans i18nKey="common.press_enter">
                        Click to select items or type what you need
                    </Trans>
                </p>
            )}
        </div>
    );
});


