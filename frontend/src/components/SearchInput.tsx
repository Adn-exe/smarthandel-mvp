import { useState, useRef, useEffect, memo } from 'react';
import { Search, X, Loader2, ArrowRight, Check } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SearchInputProps {
    onSearch: (query: string) => void;
    loading?: boolean;
    placeholder?: string;
    className?: string;
}

// Predefined products with translation keys
const PRODUCTS = [
    { id: 'milk', nameKey: 'products.milk', emoji: '🥛' },
    { id: 'bread', nameKey: 'products.bread', emoji: '🍞' },
    { id: 'eggs', nameKey: 'products.eggs', emoji: '🥚' },
    { id: 'cheese', nameKey: 'products.cheese', emoji: '🧀' },
    { id: 'chicken', nameKey: 'products.chicken', emoji: '🍗' },
    { id: 'minced_meat', nameKey: 'products.minced_meat', emoji: '🥩' },
    { id: 'salmon', nameKey: 'products.salmon', emoji: '🐟' },
    { id: 'apple', nameKey: 'products.apple', emoji: '🍎' },
    { id: 'banana', nameKey: 'products.banana', emoji: '🍌' },
    { id: 'carrot', nameKey: 'products.carrot', emoji: '🥕' },
    { id: 'potato', nameKey: 'products.potato', emoji: '🥔' },
    { id: 'tomato', nameKey: 'products.tomato', emoji: '🍅' },
    { id: 'cucumber', nameKey: 'products.cucumber', emoji: '🥒' },
    { id: 'broccoli', nameKey: 'products.broccoli', emoji: '🥦' },
    { id: 'pasta', nameKey: 'products.pasta', emoji: '🍝' },
    { id: 'rice', nameKey: 'products.rice', emoji: '🍚' },
    { id: 'coffee', nameKey: 'products.coffee', emoji: '☕' },
    { id: 'orange_juice', nameKey: 'products.orange_juice', emoji: '🧃' },
    { id: 'butter', nameKey: 'products.butter', emoji: '🧈' },
    { id: 'flour', nameKey: 'products.flour', emoji: '🌾' },
    { id: 'onion', nameKey: 'products.onion', emoji: '🧅' },
    { id: 'soda', nameKey: 'products.soda', emoji: '🥤' }
];

export const SearchInput = memo(function SearchInput({
    onSearch,
    loading = false,
    placeholder,
    className
}: SearchInputProps) {
    const { t } = useTranslation();
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Construct search query from selected items
    const handleSubmit = () => {
        if (selectedItems.size === 0) return;

        // Map selected IDs back to translated names
        const queryParts = Array.from(selectedItems).map(id => {
            const product = PRODUCTS.find(p => p.id === id);
            return product ? t(product.nameKey) : '';
        }).filter(Boolean);

        const query = queryParts.join(', ');
        if (query && !loading) {
            onSearch(query);
            setIsDropdownOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedItems(new Set());
    };

    return (
        <div ref={containerRef} className={twMerge("w-full max-w-2xl mx-auto relative z-50", className)}>
            <div
                className={clsx(
                    "relative group transition-all duration-300 ease-in-out",
                    "bg-white rounded-2xl shadow-lg border-2",
                    isDropdownOpen ? "border-primary shadow-primary/10" : "border-transparent shadow-gray-200"
                )}
            >
                {/* Input Area (Clickable trigger) */}
                <div
                    className="relative flex flex-col min-h-[80px] p-4 sm:p-6 cursor-text"
                    onClick={() => setIsDropdownOpen(true)}
                >
                    <div className="flex items-start gap-3 mb-2">
                        <Search className={clsx(
                            "w-6 h-6 mt-1 transition-colors duration-300 shrink-0",
                            isDropdownOpen ? "text-primary" : "text-gray-400"
                        )} />

                        <div className="flex-grow min-w-0">
                            {selectedItems.size === 0 ? (
                                <span className="text-xl sm:text-2xl text-gray-300 block py-1 truncate">
                                    {placeholder || t('home.placeholder')}
                                </span>
                            ) : (
                                <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                                    {Array.from(selectedItems).map(id => {
                                        const product = PRODUCTS.find(p => p.id === id);
                                        if (!product) return null;
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium animate-in zoom-in duration-200 border border-primary/20 shadow-sm whitespace-nowrap"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleItem(id);
                                                }}
                                            >
                                                <span>{product.emoji}</span>
                                                <span>{t(product.nameKey)}</span>
                                                <X className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Area */}
                    <div className="mt-4 flex items-end justify-between gap-4">
                        <span className="text-xs font-medium text-gray-400">
                            {selectedItems.size} {t('storeCard.items', 'items')} selected
                        </span>

                        <div className="flex items-center gap-2">
                            {selectedItems.size > 0 && (
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmit();
                                }}
                                disabled={selectedItems.size === 0 || loading}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    selectedItems.size > 0 && !loading
                                        ? "bg-primary text-white hover:bg-red-600 shadow-md hover:shadow-lg transform active:scale-95"
                                        : "bg-gray-100 text-gray-400"
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
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dropdown Panel */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 animate-in fade-in slide-in-from-top-4 duration-200 z-50 max-h-[400px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                                {t('common.describe_need', 'Select items')}
                            </h3>
                            <button
                                onClick={() => setIsDropdownOpen(false)}
                                className="text-gray-400 hover:text-dark p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                            {PRODUCTS.map((product) => {
                                const isSelected = selectedItems.has(product.id);
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => toggleItem(product.id)}
                                        className={clsx(
                                            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left border",
                                            isSelected
                                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                : "bg-gray-50 border-transparent text-gray-600 hover:bg-white hover:shadow-md hover:border-gray-100"
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
                    </div>
                )}
            </div>

            {/* Hint Text */}
            {!isDropdownOpen && (
                <p className="mt-3 text-center text-sm text-gray-400 animate-in fade-in duration-500">
                    <Trans i18nKey="common.press_enter">
                        Click to select items from the list
                    </Trans>
                </p>
            )}
        </div>
    );
});
