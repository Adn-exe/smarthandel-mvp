import { useState, useEffect } from 'react';
import {
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    ChevronDown,
    ChevronUp,
    Lock,
    Check,
    Store,
    Info
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useShoppingList } from '../context/ShoppingListContext';
import { api } from '../services/api';

interface RegionalProduct {
    id: string; // Unique ID for the product offer
    name: string;
    store: string; // Name of the store where it's found
    price: number;
    imageUrl?: string;
    ingredients?: string;
    allergens?: { display_name: string; contains: boolean }[];
    // The original fields like minPrice, maxPrice, storeCount, chains are no longer directly used in the rendering loop
    // as the list now shows individual product offers.
    // If the backend still returns aggregated brand data, the mapping in fetchProducts needs to adapt.
    // For now, I'll assume the API returns individual product offers matching this interface.
}

interface ItemCardProps {
    item: {
        name: string;
        originalName?: string;
        englishName?: string;
        quantity: number;
        category?: string;
        lockedBrand?: string;
    };
    onUpdateQuantity: (delta: number) => void;
    onRemove: () => void;
    onLockBrand: (brandName: string | undefined, productId?: string, productDetails?: any, lockedStore?: string) => void;
}

export function ItemCard({ item, onUpdateQuantity, onRemove, onLockBrand }: ItemCardProps) {
    const { t } = useTranslation();
    const { location: userLocation } = useShoppingList();
    const [isExpanded, setIsExpanded] = useState(false);
    const [products, setProducts] = useState<RegionalProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set()); // Changed to string for product IDs

    const toggleIngredients = (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIngredients(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    };

    // Reset state if item changes to prevent state leakage from React key reuse
    useEffect(() => {
        setProducts([]);
        setHasAttemptedFetch(false);
        setExpandedIngredients(new Set()); // Reset expanded ingredients too
    }, [item.name, item.englishName]);

    // Fetch products when expanded or when location/item becomes available
    useEffect(() => {
        const canFetch = isExpanded && (products.length === 0 || !hasAttemptedFetch);
        if (canFetch) {
            fetchProducts();
        }
    }, [isExpanded, products.length, userLocation, item.name, item.englishName, hasAttemptedFetch]); // Added hasAttemptedFetch to dependency array

    const fetchProducts = async () => {
        setLoadingProducts(true);
        setHasAttemptedFetch(true);
        try {
            // Fetch regional brand variations
            const brandResults = await api.getBrands(
                item.englishName || item.name,
                userLocation?.lat,
                userLocation?.lng
            );

            // Map the API response to the RegionalProduct interface
            const mapped: RegionalProduct[] = brandResults.map((p: any) => ({
                id: p.name, // Use name as ID for locking since that's how we track it
                name: p.name,
                store: p.chains && p.chains.length > 0 ? p.chains.join(', ') : 'Unknown',
                price: p.minPrice,
                imageUrl: p.imageUrl,
                ingredients: p.ingredients,
                allergens: p.allergens
            }));

            setProducts(mapped);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:border-slate-200">
            {/* Main Item Row */}
            <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-indigo-50/50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100/50 transition-colors group-hover:bg-indigo-50">
                        <ShoppingBag className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div className="truncate">
                        <h3 className="font-heading font-bold text-lg text-slate-900 truncate tracking-tight">
                            {item.originalName || item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                {item.category || 'Essentials'}
                            </span>
                            {item.lockedBrand && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    <Lock className="w-2.5 h-2.5" />
                                    {item.lockedBrand}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <button
                            onClick={() => onUpdateQuantity(-1)}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-slate-900 text-base tabular-nums">
                            {item.quantity}
                        </span>
                        <button
                            onClick={() => onUpdateQuantity(1)}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={onRemove}
                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Product Selection Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={clsx(
                    "w-full px-6 py-2.5 border-t border-slate-50 flex items-center justify-between transition-colors",
                    isExpanded ? "bg-indigo-50/30" : "hover:bg-slate-50/50"
                )}
            >
                <span className={clsx(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors",
                    isExpanded ? "text-indigo-600" : "text-slate-400"
                )}>
                    <Store className="w-3.5 h-3.5" />
                    {item.lockedBrand ? t('itemCard.change_selection') : t('itemCard.products_available')}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Product Selection Panel */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 bg-gray-50/50 border-t border-gray-50">
                            <div className="space-y-3 mt-4">
                                {loadingProducts ? (
                                    <div className="py-10 text-center">
                                        <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('itemCard.searching_area')}</p>
                                    </div>
                                ) : products.length > 0 ? (
                                    <>
                                        {/* "Best Optimization" Option */}
                                        <button
                                            onClick={() => {
                                                onLockBrand(undefined, undefined, undefined, undefined);
                                                setIsExpanded(false);
                                            }}
                                            className={clsx(
                                                "w-full p-4 rounded-xl flex items-center justify-between border transition-all text-left group",
                                                !item.lockedBrand
                                                    ? "bg-slate-100 border-slate-200 text-slate-900 shadow-sm"
                                                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm"
                                            )}
                                        >
                                            <div>
                                                <p className={clsx("font-bold text-sm", !item.lockedBrand ? "text-slate-900" : "text-dark")}>
                                                    {t('itemCard.leave_flexible')}
                                                </p>
                                                <p className={clsx("text-xs mt-0.5", !item.lockedBrand ? "text-slate-500" : "text-gray-400 font-medium")}>
                                                    {t('itemCard.flexible_desc')}
                                                </p>
                                            </div>
                                            {!item.lockedBrand && <Check className="w-5 h-5 flex-shrink-0 text-slate-900" />}
                                        </button>

                                        {/* Regional Product List */}
                                        <div className="space-y-2">
                                            {products.map((product, bIdx) => {
                                                const isLocked = item.lockedBrand === product.name;
                                                return (
                                                    <div key={bIdx} className="overflow-hidden bg-white border border-slate-50 rounded-xl hover:border-indigo-100 hover:shadow-sm transition-all group">
                                                        <button
                                                            onClick={() => {
                                                                // When unlocking/locking, pass specific product details
                                                                // If unlocking (isLocked=true), pass undefined
                                                                // If locking (isLocked=false), pass product.name (as ID), product.name (as brand), and the full product object
                                                                onLockBrand(
                                                                    isLocked ? undefined : product.name,
                                                                    isLocked ? undefined : product.name,
                                                                    isLocked ? undefined : product
                                                                );
                                                                setIsExpanded(false);
                                                            }}
                                                            className={clsx(
                                                                "w-full p-4 flex items-center gap-4 text-left",
                                                                isLocked && "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm"
                                                            )}
                                                        >
                                                            {/* Product Image */}
                                                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                                                                {product.imageUrl ? (
                                                                    <img
                                                                        src={product.imageUrl}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-contain p-1"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = '';
                                                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-gray-300"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <ShoppingBag className="w-6 h-6 text-gray-200" />
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col flex-1 min-w-0 mr-3">
                                                                <span className={clsx(
                                                                    "text-sm font-medium truncate transition-colors",
                                                                    isLocked ? "text-indigo-900" : "text-dark"
                                                                )}>
                                                                    {product.name}
                                                                </span>
                                                                <div className="flex items-center gap-2 text-xs mt-1">
                                                                    <span className={clsx(
                                                                        "font-medium",
                                                                        isLocked ? "text-indigo-700" : "text-slate-500"
                                                                    )}>
                                                                        {product.store}
                                                                    </span>
                                                                    {product.ingredients && (
                                                                        <button
                                                                            onClick={(e) => toggleIngredients(product.id, e)}
                                                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-1.5 py-0.5 rounded ml-2 z-10 relative"
                                                                        >
                                                                            <Info className="w-3 h-3" />
                                                                            {t('itemCard.viewIngredients')}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <span className={clsx(
                                                                    "text-sm font-bold whitespace-nowrap px-2 py-1 rounded-lg transition-colors",
                                                                    isLocked
                                                                        ? "bg-indigo-100 text-indigo-700"
                                                                        : "bg-slate-50 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                                                )}>
                                                                    {product.price.toFixed(2)} kr
                                                                </span>
                                                                {isLocked ? <Lock className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-300 -rotate-90 group-hover:text-indigo-600 transition-transform" />}
                                                            </div>
                                                        </button>

                                                        {/* Ingredients Expansion */}
                                                        <AnimatePresence>
                                                            {expandedIngredients.has(product.id) && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                                                                >
                                                                    <div className="px-4 pb-4 pt-3 text-xs">
                                                                        {product.ingredients && (
                                                                            <div className="mb-3">
                                                                                <span className="font-bold text-slate-700 block mb-1 uppercase tracking-wider text-[10px]">{t('itemCard.ingredients')}:</span>
                                                                                <p className="text-slate-600 leading-relaxed capitalize">{product.ingredients}</p>
                                                                            </div>
                                                                        )}

                                                                        {product.allergens && product.allergens.length > 0 && product.allergens.some(a => a.contains) && (
                                                                            <div>
                                                                                <span className="font-bold text-slate-700 block mb-2 uppercase tracking-wider text-[10px]">{t('itemCard.contains')}:</span>
                                                                                <div className="flex flex-wrap gap-1.5">
                                                                                    {product.allergens.filter(a => a.contains).map((allergen, idx) => (
                                                                                        <span key={idx} className="bg-orange-50 text-orange-700 border border-orange-100 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">
                                                                                            {allergen.display_name}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                        <Store className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('itemCard.no_options')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
