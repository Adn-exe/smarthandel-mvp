import { memo, useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ShoppingCart, Info, TrendingUp, ShoppingBag, Navigation, ChevronRight, CheckCircle2, AlertCircle, ExternalLink, Plus, Minus, Flag } from 'lucide-react';
import { api } from '../services/api';
import { ReportModal } from './ReportModal';
import { formatDistance } from '../utils/format';
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

    // Reporting State
    const [reportingItem, setReportingItem] = useState<{
        storeId: string;
        storeName: string;
        itemId: string | number;
        itemName: string;
        requestedName?: string;
    } | null>(null);
    const [reportedItems, setReportedItems] = useState<Set<string>>(new Set());
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 11));

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
    const [isItemsExpanded, setIsItemsExpanded] = useState(false);
    const MOBILE_ITEMS_LIMIT = 3;

    const currentTotalCost = useMemo(() => {
        return items.reduce((acc, item) => {
            const qty = localQuantities[item.id] || item.quantity;
            return acc + (item.price * qty);
        }, 0);
    }, [items, localQuantities]);

    const handleReportSubmit = async (reason: string, note: string) => {
        if (!reportingItem) return;

        try {
            await api.submitReport({
                store_id: reportingItem.storeId,
                store_name: reportingItem.storeName,
                requested_item_name: reportingItem.requestedName || reportingItem.itemName,
                matched_item_name: reportingItem.itemName,
                matched_item_id: String(reportingItem.itemId),
                report_reason: reason,
                optional_note: note,
                session_id: sessionId
            });

            setReportedItems(prev => new Set([...prev, `${reportingItem.storeId}_${reportingItem.itemId}`]));
            setReportingItem(null);
        } catch (error) {
            console.error('Failed to submit report:', error);
            throw error;
        }
    };

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
                "relative rounded-xl md:rounded-2xl border transition-all duration-300 bg-white",
                onSelect ? "cursor-pointer md:hover:shadow-xl md:hover:-translate-y-1" : "",
                selected ? "border-primary ring-2 ring-primary/10 shadow-lg md:shadow-xl" : "border-gray-100 shadow-sm",
                isDetailed ? "p-4 md:p-6" : "p-4 md:p-5"
            )}
        >
            {/* Efficiency & Reasoning Badges */}
            <div className="absolute top-0 right-0 flex flex-col items-end">
                {reasoningTag && (
                    <div className="bg-primary text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-bl-lg md:rounded-bl-xl shadow-sm uppercase tracking-widest">
                        {reasoningTag}
                    </div>
                )}
                {efficiencyTags.map((tag, idx) => (
                    <div
                        key={idx}
                        className="mt-1 bg-indigo-600/90 text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-l-md md:rounded-l-lg shadow-sm uppercase tracking-tighter"
                    >
                        {tag}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-start mb-2 md:mb-3 pr-16 md:pr-20">
                <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-black text-dark text-base md:text-lg leading-tight flex items-center gap-1.5 md:gap-2">
                        <span className="text-xl md:text-2xl shrink-0">🏣</span>
                        <span className="text-primary truncate">{store.name}</span>
                    </h3>
                </div>
            </div>

            {/* Status Row: Stock Info */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                {/* Stock Status */}
                {stockStatus && (
                    <div className={clsx(
                        "flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-tighter",
                        stockStatus.isFull
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                    )}>
                        <stockStatus.icon className="w-2.5 h-2.5" />
                        {stockStatus.text}
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between mb-4 md:mb-5">
                <div>
                    <div className="flex items-baseline gap-1 md:gap-1.5">
                        <span className="text-2xl md:text-3xl font-black text-dark tracking-tighter md:tracking-tight">
                            {formatPriceParts(currentTotalCost).amount}
                        </span>
                        <span className="text-xs md:text-sm font-bold text-gray-400">
                            {formatPriceParts(currentTotalCost).currency}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <Navigation className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {formatDistance(distance)}
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
                <div className="mt-3 md:mt-4 border-t border-gray-100 pt-3 md:pt-4">
                    <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3" />
                        {t('storeCard.yourCartItems')}
                    </h4>
                    <div className="space-y-3 md:space-y-4">
                        {items
                            .slice(0, !isItemsExpanded && items.length > MOBILE_ITEMS_LIMIT ? MOBILE_ITEMS_LIMIT : undefined)
                            .map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-2">
                                    <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white rounded-lg border border-gray-50 p-0.5 shrink-0"
                                                loading="lazy"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null; // Prevent infinite loop
                                                    target.src = '/images/placeholder.png';
                                                    target.className = 'w-10 h-10 md:w-12 md:h-12 object-contain bg-gray-50 rounded-lg p-1.5 opacity-60';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 shrink-0">
                                                <ShoppingBag className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                                                <div className="flex items-center bg-gray-50 md:bg-gray-50/50 rounded-xl md:rounded-lg p-1 md:p-0.5 border border-gray-100 md:border-gray-100/50 shrink-0 w-fit">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDecrement(String(item.id)); }}
                                                        className="p-2 md:p-1 hover:bg-white rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Minus className="w-3.5 h-3.5 md:w-2.5 md:h-2.5 text-gray-400 hover:text-primary" />
                                                    </button>
                                                    <span className="px-2 md:px-1.5 text-xs md:text-[10px] font-black text-dark min-w-[24px] md:min-w-[20px] text-center">
                                                        {(localQuantities[String(item.id)] || item.quantity)}x
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleIncrement(String(item.id)); }}
                                                        className="p-2 md:p-1 hover:bg-white rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 md:w-2.5 md:h-2.5 text-gray-400 hover:text-primary" />
                                                    </button>
                                                </div>
                                                <div className="min-w-0 flex-1 relative flex items-center gap-2">
                                                    <p
                                                        className="font-bold text-dark text-xs md:text-sm leading-snug hover:text-primary transition-colors cursor-help truncate"
                                                        onMouseEnter={() => setHoveredItemId(item.id)}
                                                        onMouseLeave={() => setHoveredItemId(null)}
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </p>

                                                    {/* Report Button */}
                                                    {!reportedItems.has(`${store.id}_${String(item.id)}`) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReportingItem({
                                                                    storeId: String(store.id),
                                                                    storeName: store.name,
                                                                    itemId: item.id,
                                                                    itemName: item.name,
                                                                    requestedName: item.originalQueryName || item.englishName
                                                                });
                                                            }}
                                                            className="p-2 md:p-1 hover:bg-orange-50 rounded-lg text-gray-300 hover:text-orange-500 transition-all active:scale-95 group/report shrink-0"
                                                            title={t('report.title', 'Report item issue')}
                                                        >
                                                            <Flag className="w-3.5 h-3.5 md:w-3 md:h-3 group-hover/report:fill-current" />
                                                        </button>
                                                    )}
                                                    {reportedItems.has(`${store.id}_${String(item.id)}`) && (
                                                        <div className="flex items-center text-green-500" title={t('report.submitted', 'Report submitted')}>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </div>
                                                    )}

                                                    {item.englishName && hoveredItemId === item.id && (
                                                        <div
                                                            className="absolute bottom-full left-0 mb-2 pointer-events-none z-[100] hidden md:block"
                                                            style={{ animation: 'reveal 0.2s ease-out' }}
                                                        >
                                                            <div className="bg-dark text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-2">
                                                                <span className="text-emerald-400 text-[9px] font-black bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">EN</span>
                                                                {item.englishName}
                                                            </div>
                                                            <div className="w-2 h-2 bg-dark rotate-45 -mt-1 ml-4"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-baseline gap-0.5 md:gap-1">
                                            <span className="font-bold text-dark text-xs md:text-sm leading-none">
                                                {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).amount}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">
                                                {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).currency}
                                            </span>
                                        </div>
                                        {(localQuantities[item.id] || item.quantity) > 1 && (
                                            <span className="text-[9px] md:text-[10px] text-gray-400 block mt-0.5 font-bold">
                                                {formatPriceParts(item.price).amount} / stk
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Mobile: Show more / less toggle */}
                    {items.length > MOBILE_ITEMS_LIMIT && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsItemsExpanded(prev => !prev); }}
                            className="md:hidden mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-black text-primary bg-primary/5 rounded-xl border border-primary/10 active:scale-95 transition-all"
                        >
                            {isItemsExpanded ? (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                                    Show less
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    Show all {items.length} items
                                </>
                            )}
                        </button>
                    )}

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
                    className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 px-4 py-2.5 md:px-3 md:py-1.5 rounded-xl md:rounded-lg shadow-sm active:scale-95 transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="w-3.5 h-3.5 md:w-3 md:h-3" />
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
            {reportingItem && (
                <ReportModal
                    isOpen={!!reportingItem}
                    onClose={() => setReportingItem(null)}
                    onSubmit={handleReportSubmit}
                    itemName={reportingItem.itemName}
                />
            )}
        </div>
    );
});
