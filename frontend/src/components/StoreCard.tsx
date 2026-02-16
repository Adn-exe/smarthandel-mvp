import { memo, useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ShoppingCart, Info, TrendingUp, ShoppingBag, Navigation, ChevronRight, Clock, CheckCircle2, AlertCircle, ExternalLink, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Store as StoreType, ProductWithPrice } from '../types';

interface StoreCardProps {
    store: StoreType;
    items: ProductWithPrice[];
    totalCost: number;
    distance: number;
    selected?: boolean;
    onSelect?: () => void;
    variant?: 'default' | 'detailed' | 'comparison';
    reasoningTag?: string;
    totalRequestedItems?: number;
    efficiencyTags?: string[];
    userLocation?: { lat: number; lng: number } | null;
}

export const StoreCard = memo(function StoreCard({
    store,
    items,
    distance,
    selected = false,
    onSelect,
    variant = 'default',
    reasoningTag,
    totalRequestedItems,
    efficiencyTags = [],
    userLocation
}: StoreCardProps) {
    const { t, i18n } = useTranslation();
    const [localQuantities, setLocalQuantities] = useState<Record<string | number, number>>(() =>
        items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
    );

    // Sync state if initial items change
    useEffect(() => {
        setLocalQuantities(items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {}));
    }, [items]);

    const handleIncrement = (itemId: string | number) => {
        setLocalQuantities(prev => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1
        }));
    };

    const handleDecrement = (itemId: string | number) => {
        setLocalQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) - 1)
        }));
    };

    const [hoveredItemId, setHoveredItemId] = useState<string | number | null>(null);

    const currentTotalCost = useMemo(() => {
        return items.reduce((acc, item) => {
            const qty = localQuantities[item.id] || item.quantity;
            return acc + (item.price * qty);
        }, 0);
    }, [items, localQuantities]);

    // Format currency
    const formatPriceParts = useMemo(() => {
        const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
        const formatter = new Intl.NumberFormat(locale, {
            style: 'decimal',
            maximumFractionDigits: 0
        });
        return (price: number) => ({
            amount: formatter.format(price),
            currency: 'NOK'
        });
    }, [i18n.language]);

    const isDetailed = variant === 'detailed';
    const isComparison = variant === 'comparison';

    // Calculate stock status
    const stockStatus = useMemo(() => {
        if (!totalRequestedItems) return null;
        const foundCount = items.length;
        const isFullStock = foundCount === totalRequestedItems;

        return {
            isFull: isFullStock,
            text: isFullStock
                ? t('storeCard.fullStock')
                : t('storeCard.missingItems', { count: totalRequestedItems - foundCount }),
            icon: isFullStock ? CheckCircle2 : AlertCircle
        };
    }, [items.length, totalRequestedItems, t]);

    const googleMapsUrl = useMemo(() => {
        const baseUrl = "https://www.google.com/maps/dir/?api=1";
        const destination = `&destination=${store.location.lat},${store.location.lng}`;
        const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : "";
        return `${baseUrl}${origin}${destination}&travelmode=driving`;
    }, [store.location, userLocation]);

    return (
        <div
            onClick={onSelect}
            className={clsx(
                "relative rounded-2xl border transition-all duration-300 bg-white",
                onSelect ? "cursor-pointer hover:shadow-xl hover:-translate-y-1" : "",
                selected ? "border-primary ring-2 ring-primary/20 shadow-xl" : "border-gray-100 shadow-sm",
                isDetailed ? "p-6" : "p-5"
            )}
        >
            {/* Efficiency & Reasoning Badges */}
            <div className="absolute top-0 right-0 flex flex-col items-end">
                {reasoningTag && (
                    <div className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm uppercase tracking-widest animate-in slide-in-from-right duration-500">
                        {reasoningTag}
                    </div>
                )}
                {efficiencyTags.map((tag, idx) => (
                    <div
                        key={idx}
                        className="mt-1 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-l-lg shadow-sm uppercase tracking-tighter"
                    >
                        {tag}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-start mb-3 pr-20">
                <div>
                    <h3 className="font-bold text-dark text-lg leading-tight flex items-center gap-2">
                        🏣 <span className="text-primary">{store.name}</span>
                    </h3>
                </div>
            </div>

            {/* Status Row: Open/Closed & Stock */}
            <div className="flex flex-wrap gap-2 mb-4">
                {/* Opening Status */}
                <div className={clsx(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                    store.open_now
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-gray-100 text-gray-500 border border-gray-200"
                )}>
                    <Clock className="w-3 h-3" />
                    {store.open_now ? t('storeCard.openNow') : t('storeCard.closed')}
                </div>

                {/* Stock Status */}
                {stockStatus && (
                    <div className={clsx(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                        stockStatus.isFull
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                    )}>
                        <stockStatus.icon className="w-3 h-3" />
                        {stockStatus.text}
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between mb-5">
                <div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-dark tracking-tight transition-all duration-300 scale-100">
                            {formatPriceParts(currentTotalCost).amount}
                        </span>
                        <span className="text-sm font-bold text-gray-400">
                            {formatPriceParts(currentTotalCost).currency}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                        <Navigation className="w-3.5 h-3.5" />
                        {distance < 1000
                            ? `${Math.round(distance)}m`
                            : `${(distance / 1000).toFixed(1)}km`
                        }
                    </div>
                </div>
            </div>

            {/* Price History / Trend Indicator (New) */}
            {items.some(i => i.priceHistory) && (
                <div className="mb-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    <TrendingUp className="w-3 h-3" />
                    <span>Price history available</span>
                </div>
            )}

            {/* Items List */}
            {(isDetailed || isComparison) && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3" />
                        {t('storeCard.yourCartItems')}
                    </h4>
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                                <div className="flex items-start gap-3">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-100 p-0.5 shrink-0"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 shrink-0">
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100 shrink-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDecrement(item.id); }}
                                                    className="p-1 hover:bg-white rounded-md transition-all"
                                                >
                                                    <Minus className="w-2.5 h-2.5 text-gray-400 hover:text-primary" />
                                                </button>
                                                <span className="px-1.5 text-[10px] font-black text-dark min-w-[20px] text-center">
                                                    {(localQuantities[item.id] || item.quantity)}x
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleIncrement(item.id); }}
                                                    className="p-1 hover:bg-white rounded-md transition-all"
                                                >
                                                    <Plus className="w-2.5 h-2.5 text-gray-400 hover:text-primary" />
                                                </button>
                                            </div>
                                            <div className="min-w-0 flex-1 relative">
                                                <p
                                                    className="font-bold text-dark leading-none hover:text-primary transition-colors cursor-help"
                                                    onMouseEnter={() => setHoveredItemId(item.id)}
                                                    onMouseLeave={() => setHoveredItemId(null)}
                                                    title={item.name}
                                                >
                                                    {item.name.length > 22 ? `${item.name.substring(0, 22)}...` : item.name}
                                                </p>

                                                {item.englishName && hoveredItemId === item.id && (
                                                    <div
                                                        className="absolute bottom-full left-0 mb-2 pointer-events-none z-[100]"
                                                        style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
                                                    >
                                                        <div className="bg-gray-900 text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-2">
                                                            <span className="text-emerald-400 text-[9px] font-black bg-emerald-400/15 px-1.5 py-0.5 rounded border border-emerald-400/30">EN</span>
                                                            {item.englishName}
                                                        </div>
                                                        <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1 ml-4"></div>
                                                    </div>
                                                )}

                                                {item.unit && (
                                                    <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-tighter">
                                                        Pris per {item.unit}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-bold text-gray-900 leading-none transition-all duration-300">
                                            {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).amount}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).currency}
                                        </span>
                                    </div>
                                    {(localQuantities[item.id] || item.quantity) > 1 && (
                                        <span className="text-[10px] text-gray-400 block mt-1 font-medium opacity-80">
                                            {formatPriceParts(item.price).amount} / stk
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {items.length === 0 && (
                        <p className="text-sm text-gray-400 italic">{t('storeCard.noItemsFound')}</p>
                    )}
                </div>
            )}

            {/* Action Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="w-3 h-3" />
                    {t('storeCard.getDirections')}
                </a>

                {selected && !isDetailed && (
                    <button className="flex items-center text-sm font-medium text-primary hover:text-red-700 transition-colors">
                        {t('storeCard.viewDetails')} <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                )}
            </div>

            {/* Comparison Badge */}
            {isComparison && items.some(i => i.price === 0) && (
                <div className="mt-3 flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{t('storeCard.missingItemsWarning')}</p>
                </div>
            )}
        </div>
    );
});
