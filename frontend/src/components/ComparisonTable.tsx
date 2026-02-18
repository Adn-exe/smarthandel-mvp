
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { MapPin, List } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistance } from '../utils/format';
import type { SingleStoreOption, ProductWithPrice } from '../types';

interface ComparisonTableProps {
    candidates: SingleStoreOption[];
    requestedItemsCount: number;
    isMapVisible?: boolean;
    onToggleMap?: () => void;
}

export function ComparisonTable({ candidates, requestedItemsCount, isMapVisible, onToggleMap }: ComparisonTableProps) {
    const { t, i18n } = useTranslation();

    if (!candidates || candidates.length === 0) return null;

    // 1. Identify the absolute "Best Value" (Least Cost, then Least Distance)
    const bestValueId = useMemo(() => {
        if (!candidates || candidates.length === 0) return null;
        const sorted = [...candidates].sort((a, b) => {
            const costDiff = (a.totalCost || 0) - (b.totalCost || 0);
            if (Math.abs(costDiff) > 0.01) return costDiff;
            return (a.distance || 0) - (b.distance || 0);
        });
        return sorted[0].store.id;
    }, [candidates]);

    // 2. Ensure Smart Route is always included and prioritize ordering:
    // [Best Value] -> [Smart Route (if different)] -> [Others]
    const displayCandidates = useMemo(() => {
        if (!candidates || candidates.length === 0) return [];

        const bestValue = candidates.find(c => c.store.id === bestValueId);
        const smartRoute = candidates.find(c => c.store.id === 'smart-route');

        const prioritized = [];
        if (bestValue) prioritized.push(bestValue);

        // Add Smart Route if it's not already the Best Value
        if (smartRoute && smartRoute.store.id !== bestValueId) {
            prioritized.push(smartRoute);
        }

        // Add others, filtering out those already prioritized
        const others = candidates.filter(c =>
            c.store.id !== bestValueId &&
            c.store.id !== 'smart-route'
        );

        // Combine and limit to 4
        return [...prioritized, ...others].slice(0, 4);
    }, [candidates, bestValueId]);

    // 3. Identify ALL unique items across ALL displayed candidates for complete rows
    const rowItems = useMemo(() => {
        const uniqueItemsMap = new Map<string, ProductWithPrice>();
        displayCandidates.forEach((candidate: SingleStoreOption) => {
            candidate.items.forEach((item: ProductWithPrice) => {
                const key = item.name.toLowerCase().trim();
                if (!uniqueItemsMap.has(key)) {
                    uniqueItemsMap.set(key, item);
                }
            });
        });
        return Array.from(uniqueItemsMap.values());
    }, [displayCandidates]);

    const formatPrice = (price: number) => {
        const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <div className="w-full overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-5 md:p-8 border-b border-gray-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                <div>
                    <h3 className="text-xl md:text-2xl font-heading font-black text-dark tracking-tight mb-1">
                        {t('results.priceComparison', 'Price Comparison')}
                    </h3>
                    <p className="text-sm md:text-base text-gray-500 font-medium max-w-md leading-relaxed">
                        {t('results.compareText', { count: requestedItemsCount, defaultValue: `Compare prices for your ${requestedItemsCount} items.` })}
                    </p>
                </div>

                {onToggleMap && (
                    <button
                        onClick={onToggleMap}
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-white hover:text-dark hover:shadow-md transition-all active:scale-95 shrink-0"
                    >
                        {isMapVisible ? (
                            <>
                                <List className="w-4 h-4" />
                                {t('results.hideMap', 'Hide Map')}
                            </>
                        ) : (
                            <>
                                <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                </div>
                                {t('results.showMap', 'Show Map')}
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="relative border-t border-gray-100">
                {/* Mobile Scroll Hint */}
                <div className="md:hidden flex items-center justify-end gap-1.5 px-4 py-2 bg-gray-50/80 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scroll</span>
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>

                <div className="relative">
                    {/* Right-edge fade gradient on mobile */}
                    <div className="md:hidden pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent z-30" />

                    <div className="overflow-x-auto snap-x snap-mandatory no-scrollbar md:max-h-[calc(100vh-300px)] relative">
                        <table className="w-full text-sm text-left border-collapse min-w-[340px]">
                            <thead className="sticky top-28 md:top-0 z-40 shadow-[0_2px_5px_-2px_rgba(0,0,0,0.05)]">
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-4 px-4 md:px-6 font-black text-gray-500 uppercase tracking-widest text-[10px] w-1/3 min-w-[120px] md:min-w-[150px] sticky top-28 md:top-0 left-0 bg-white md:bg-gray-50 z-50 shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100/50">
                                        {t('common.item', 'Item')}
                                    </th>
                                    {displayCandidates.map((candidate: SingleStoreOption) => {
                                        const isSmartRoute = candidate.store.id === 'smart-route';
                                        const isBestValue = candidate.store.id === bestValueId;

                                        return (
                                            <th key={candidate.store.id} className={clsx(
                                                "py-4 px-4 min-w-[140px] md:min-w-[160px] align-top snap-center",
                                                isSmartRoute ? "bg-blue-50/50 border-x border-blue-100" :
                                                    (isBestValue ? "bg-green-50/50 border-x border-green-100" : "bg-gray-50")
                                            )}>
                                                <div className="flex flex-col gap-1">
                                                    <span className={clsx(
                                                        "font-heading font-black text-xs md:text-sm tracking-tight",
                                                        isSmartRoute ? "text-blue-900" :
                                                            (isBestValue ? "text-green-900" : "text-dark")
                                                    )}>
                                                        {candidate.store.chain}
                                                    </span>
                                                    <div className={clsx(
                                                        "flex items-center gap-1 text-[9px] md:text-[10px] font-bold",
                                                        isSmartRoute ? "text-blue-400" : "text-gray-400"
                                                    )}>
                                                        {!isSmartRoute && <MapPin className="w-2.5 h-2.5 shrink-0 text-gray-300" />}
                                                        <span className="truncate max-w-[80px] md:max-w-[100px]">{candidate.store.name}</span>
                                                    </div>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {rowItems.map((rowItem) => {
                                    // Get price from the actual Best Value store for robust highlighting
                                    const bestValCandidate = displayCandidates.find(c => c.store.id === bestValueId);
                                    const bestStoreItem = bestValCandidate?.items.find(i => i.name.toLowerCase().trim() === rowItem.name.toLowerCase().trim());
                                    const bestStorePrice = bestStoreItem ? bestStoreItem.totalPrice : Infinity;

                                    return (
                                        <tr key={rowItem.name} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-50/50 last:border-0 text-sm">
                                            <td className="py-3 px-4 md:px-6 sticky left-0 bg-white group-hover:bg-blue-50 transition-colors z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-gray-100/30">
                                                <div className="font-heading font-bold text-dark text-[11px] md:text-sm leading-tight">
                                                    {rowItem.englishName || rowItem.name}
                                                </div>
                                                {(rowItem.quantity > 1 || rowItem.unit) && (
                                                    <div className="text-[9px] md:text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                                                        {rowItem.quantity > 1 && <span className="bg-gray-50 px-1 py-0.5 rounded text-gray-500 border border-gray-100">{rowItem.quantity}x</span>}
                                                        {rowItem.unit && <span>{rowItem.unit}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            {displayCandidates.map((candidate: SingleStoreOption) => {
                                                const item = candidate.items.find(i => i.name.toLowerCase().trim() === rowItem.name.toLowerCase().trim());
                                                const price = item?.totalPrice || Infinity;

                                                const isSmartRoute = candidate.store.id === 'smart-route';
                                                const isBestValue = candidate.store.id === bestValueId;
                                                const isCheaperThanBest = !isBestValue && price < bestStorePrice && price < Infinity;

                                                return (
                                                    <td key={candidate.store.id} className={clsx(
                                                        "py-3 px-4 align-middle snap-center text-center",
                                                        isSmartRoute ? "bg-blue-50/5 group-hover:bg-blue-50/20 font-bold text-blue-900" :
                                                            (isBestValue ? "bg-green-50/5 group-hover:bg-green-50/20 font-bold text-green-900" : "")
                                                    )}>
                                                        {item ? (
                                                            <div className={clsx(
                                                                "text-xs md:text-sm font-bold tabular-nums tracking-tight",
                                                                isCheaperThanBest ? "text-green-700 bg-green-100/70 px-1.5 py-0.5 rounded-lg border border-green-200" : // Highlight if better
                                                                    (isBestValue ? "" : "text-gray-600") // Normal otherwise
                                                            )}>
                                                                {formatPrice(item.totalPrice)}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-gray-50 text-gray-300 uppercase tracking-widest border border-gray-100">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {/* Distance Row */}
                                <tr className="bg-white border-t border-gray-100">
                                    <td className="py-4 px-4 md:px-6 font-black text-gray-400 text-[10px] uppercase tracking-widest sticky left-0 bg-white z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-gray-100/50">
                                        {t('common.distance', 'Distance')}
                                    </td>
                                    {displayCandidates.map((candidate: SingleStoreOption) => {
                                        const distances = displayCandidates.map((c: SingleStoreOption) => c.distance || Infinity);
                                        const minDistance = Math.min(...distances);
                                        const isClosest = candidate.distance === minDistance;

                                        return (
                                            <td key={`dist-${candidate.store.id}`} className="py-4 px-4 align-top snap-center text-center">
                                                <div className={clsx(
                                                    "font-bold tabular-nums text-xs md:text-sm",
                                                    isClosest ? "text-green-700 bg-green-50/80 inline-block px-2 py-0.5 rounded-full border border-green-100" : "text-gray-500"
                                                )}>
                                                    {candidate.distance !== undefined ? formatDistance(candidate.distance) : '-'}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>

                                <tr className="bg-gray-50/90 backdrop-blur-sm border-t border-gray-100 sticky bottom-0 z-40 shadow-[0_-2px_5px_-2px_rgba(0,0,0,0.05)]">
                                    <td className="py-5 px-4 md:px-6 font-black text-dark text-xs uppercase tracking-widest sticky bottom-0 left-0 bg-gray-50 z-50 shadow-[2px_-2px_5px_-2px_rgba(0,0,0,0.1)] border-r border-gray-100/50">
                                        {t('common.total', 'Total')}
                                    </td>
                                    {displayCandidates.map((candidate: SingleStoreOption) => (
                                        <td key={candidate.store.id} className="py-5 px-4 snap-center text-center bg-gray-50/50 backdrop-blur-sm">
                                            <div className="flex flex-col items-center">
                                                <span className={clsx(
                                                    "font-black text-sm md:text-lg tabular-nums",
                                                    candidate.store.id === bestValueId ? "text-primary scale-110" : "text-gray-900"
                                                )}>
                                                    {formatPrice(candidate.totalCost || 0)}
                                                </span>
                                                {candidate.store.id === bestValueId && (
                                                    <span className="text-[8px] md:text-[10px] text-green-600 font-black uppercase tracking-widest mt-0.5">
                                                        {t('results.bestValue', 'Best')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
