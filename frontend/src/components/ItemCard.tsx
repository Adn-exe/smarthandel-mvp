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
    Info,
    Tag
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useShoppingList } from '../context/ShoppingListContext';
import { api } from '../services/api';

interface RegionalProduct {
    id: string | number; // Unique ID for the product offer
    name: string;
    store: string; // Name of the store where it's found
    price: number;
    imageUrl?: string;
    ingredients?: string;
    allergens?: { display_name: string; contains: boolean }[];
    isPromotional?: boolean;
    promotions?: { chain: string; label: string; discount_type: string; product_name: string; final_price?: number; }[];
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
        lockedProductDetails?: any;
        lockedOffer?: {
            chain: string;
            label: string;
            discount_type: string;
            product_name: string;
            final_price?: number;
        };
    };
    onUpdateQuantity: (delta: number) => void;
    onRemove: () => void;
    onLockBrand: (brandName: string | undefined, productId?: string, productDetails?: any, lockedStore?: string, offer?: any) => void;
}

export function ItemCard({ item, onUpdateQuantity, onRemove, onLockBrand }: ItemCardProps) {
    const { t } = useTranslation();
    const { location: userLocation } = useShoppingList();
    const [isExpanded, setIsExpanded] = useState(false);
    const [products, setProducts] = useState<RegionalProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
    const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());
    const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
    const [selectedOffer, setSelectedOffer] = useState<any>(item.lockedOffer || null);

    const toggleOffers = (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedOffers(prev => {
            const next = new Set(prev);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    };

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
        setExpandedIngredients(new Set());
        setExpandedOffers(new Set());
        setSelectedOffer(item.lockedOffer || null);
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
                id: p.id || p.name, // Use the real ID for perfect locked matching
                name: p.name,
                store: p.chains && p.chains.length > 0 ? p.chains.join(', ') : 'Unknown',
                price: p.minPrice,
                imageUrl: p.imageUrl,
                ingredients: p.ingredients,
                allergens: p.allergens,
                isPromotional: p.isPromotional,
                promotions: p.promotions
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
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm transition-all group-hover:bg-indigo-50/50 overflow-hidden">
                        {item.lockedProductDetails?.image_url ? (
                            <img
                                src={item.lockedProductDetails.image_url}
                                alt={item.lockedBrand}
                                className="w-full h-full object-contain p-1 animate-in fade-in duration-500"
                            />
                        ) : (
                            <ShoppingBag className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        )}
                    </div>
                    <div className="truncate">
                        <h3 className="font-heading font-bold text-lg text-slate-900 truncate tracking-tight">
                            {item.originalName || item.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {item.lockedBrand && (
                                <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-indigo-700 uppercase tracking-[0.15em] bg-indigo-50/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm animate-in slide-in-from-left-2 duration-300">
                                    <Lock className="w-2.5 h-2.5 fill-indigo-700/10" />
                                    <span className="truncate max-w-[120px] sm:max-w-none">{item.lockedBrand}</span>
                                </span>
                            )}
                        </div>
                        {selectedOffer && (
                            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-red-600 uppercase tracking-[0.1em] bg-red-50/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-200 shadow-sm animate-in slide-in-from-left-2 duration-300">
                                <Tag className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[100px] sm:max-w-none">{selectedOffer.label}</span>
                            </span>
                        )}
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
                                                setSelectedOffer(null);
                                                onLockBrand(undefined, undefined, undefined, undefined, undefined);
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
                                                        <div
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(e) => {
                                                                // Only fire lock if the click target is NOT a nested button
                                                                if ((e.target as HTMLElement).closest('button')) return;
                                                                setSelectedOffer(null); // Clear offer when brand changes
                                                                onLockBrand(
                                                                    isLocked ? undefined : product.name,
                                                                    isLocked ? undefined : String(product.id),
                                                                    isLocked ? undefined : product,
                                                                    undefined,
                                                                    undefined
                                                                );
                                                                setIsExpanded(false);
                                                            }}
                                                            className={clsx(
                                                                "w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 text-left cursor-pointer",
                                                                isLocked && "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm"
                                                            )}
                                                        >
                                                            {/* Product Image */}
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-gray-100 shadow-sm transition-transform group-hover:scale-105">
                                                                {product.imageUrl ? (
                                                                    <img
                                                                        src={product.imageUrl}
                                                                        alt={product.name}
                                                                        className="w-full h-full object-contain p-1"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = '';
                                                                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-gray-300"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-200" />
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className={clsx(
                                                                        "text-[13px] sm:text-sm font-semibold truncate",
                                                                        isLocked ? "text-indigo-900" : "text-dark"
                                                                    )}>
                                                                        {product.name}
                                                                    </span>
                                                                    {product.isPromotional && product.promotions && product.promotions.length > 0 && (
                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                            <button
                                                                                onClick={(e) => toggleOffers(String(product.id), e)}
                                                                                className="flex items-center gap-1.5 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase rounded border border-red-100 shadow-sm transition-colors w-fit"
                                                                            >
                                                                                <Tag className="w-2.5 h-2.5" />
                                                                                {expandedOffers.has(String(product.id)) ? t('itemCard.hide_offers', 'Hide Offers') : t('itemCard.show_offers', 'Offers')}
                                                                                <span className="bg-red-200/50 px-1.5 py-0.5 rounded text-[8px]">{product.promotions.length}</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                                                                    <span className={clsx(
                                                                        "text-[11px] sm:text-xs font-medium",
                                                                        isLocked ? "text-indigo-700" : "text-slate-500"
                                                                    )}>
                                                                        {product.store}
                                                                    </span>
                                                                    <span className={clsx(
                                                                        "text-[10px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded transition-colors",
                                                                        isLocked
                                                                            ? "bg-indigo-100 text-indigo-700"
                                                                            : "bg-slate-50 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                                                    )}>
                                                                        {selectedOffer?.final_price && isLocked ? (
                                                                            <span className="flex items-center gap-1.5">
                                                                                <span className="line-through text-slate-400 font-medium">{product.price.toFixed(2)}</span>
                                                                                <span className="text-red-600 font-black">{selectedOffer.final_price} kr</span>
                                                                            </span>
                                                                        ) : (
                                                                            <>{product.price.toFixed(2)} kr</>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5 sm:gap-2 tracking-tight shrink-0">
                                                                {product.ingredients && (
                                                                    <button
                                                                        onClick={(e) => toggleIngredients(String(product.id), e)}
                                                                        className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 hover:bg-emerald-100 px-1.5 sm:px-2 py-1 rounded-lg z-10 relative whitespace-nowrap shrink-0"
                                                                    >
                                                                        <Info className="w-3.5 h-3.5 shrink-0" />
                                                                        <span className="hidden sm:inline">{t('itemCard.viewIngredients')}</span>
                                                                        <span className="sm:hidden">{t('itemCard.ingredients')}</span>
                                                                    </button>
                                                                )}
                                                                {isLocked ? <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-300 -rotate-90 group-hover:text-indigo-600 transition-transform shrink-0" />}
                                                            </div>
                                                        </div>

                                                        {/* Ingredients Expansion */}
                                                        <AnimatePresence>
                                                            {expandedIngredients.has(String(product.id)) && (
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

                                                        {/* Offers Expansion */}
                                                        <AnimatePresence>
                                                            {expandedOffers.has(String(product.id)) && product.promotions && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden bg-red-50/10 border-t border-red-50"
                                                                >
                                                                    <div className="px-4 pb-4 pt-3 flex flex-col gap-2">
                                                                        {product.promotions.map((promo: any, idx: number) => {
                                                                            const isOfferSelected = selectedOffer?.product_name === promo.product_name && selectedOffer?.chain === promo.chain && selectedOffer?.label === promo.label;
                                                                            return (
                                                                                <button
                                                                                    key={idx}
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        e.nativeEvent.stopImmediatePropagation();
                                                                                        // Toggle offer selection
                                                                                        const newOffer = isOfferSelected ? null : {
                                                                                            chain: promo.chain,
                                                                                            label: promo.label,
                                                                                            discount_type: promo.discount_type,
                                                                                            product_name: promo.product_name,
                                                                                            final_price: promo.final_price
                                                                                        };
                                                                                        // Update local state immediately for instant UI
                                                                                        setSelectedOffer(newOffer);
                                                                                        // Sync to context
                                                                                        onLockBrand(
                                                                                            product.name,
                                                                                            String(product.id),
                                                                                            product,
                                                                                            undefined,
                                                                                            newOffer || undefined
                                                                                        );
                                                                                    }}
                                                                                    className={clsx(
                                                                                        "w-full p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-2 text-left transition-all",
                                                                                        isOfferSelected
                                                                                            ? "bg-red-50 border-red-300 ring-2 ring-red-200"
                                                                                            : "bg-white border-red-100 hover:border-red-200 hover:bg-red-50/30"
                                                                                    )}
                                                                                >
                                                                                    <div>
                                                                                        <p className="text-xs font-bold text-dark">{promo.product_name}</p>
                                                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{promo.chain}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={clsx(
                                                                                            "px-2.5 py-1.5 rounded-lg font-black text-xs border whitespace-nowrap text-center sm:text-right",
                                                                                            isOfferSelected
                                                                                                ? "bg-red-600 text-white border-red-600"
                                                                                                : "bg-red-50 text-red-600 border-red-100"
                                                                                        )}>
                                                                                            {promo.label}
                                                                                        </div>
                                                                                        {isOfferSelected && <Check className="w-4 h-4 text-red-600 shrink-0" />}
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
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
