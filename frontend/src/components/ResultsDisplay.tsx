import { memo, useMemo } from 'react';
import { List, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SingleStoreOption, MultiStoreOption } from '../types';
import { StoreCard } from './StoreCard';

import { ComparisonTable } from './ComparisonTable';
import { formatDistance } from '../utils/format';

interface ResultsDisplayProps {
    singleStores: SingleStoreOption[];
    multiStore: MultiStoreOption | null;
    recommendation: string;
    onCreateList: () => void;
    onReset: () => void;
    selectedStoreId?: string | number | null;
    onSelectStore?: (storeId: string | number) => void;
    activeView?: 'single' | 'multi' | 'comparison' | null;
    totalRequestedItems?: number;
    userLocation?: { lat: number; lng: number } | null;
    onViewSwitch?: (view: 'single' | 'multi' | 'comparison') => void;
    isMapVisible?: boolean;
    onToggleMap?: () => void;
}

export const ResultsDisplay = memo(function ResultsDisplay({
    singleStores,
    multiStore,
    onCreateList,
    onReset,
    selectedStoreId,
    onSelectStore,
    activeView,
    totalRequestedItems,
    userLocation,
    isMapVisible,
    onToggleMap
}: ResultsDisplayProps) {
    const { t, i18n } = useTranslation();

    const routeSavings = useMemo(() => {
        const bestSingle = singleStores[0];
        if (!multiStore || !bestSingle) return 0;
        const singleTotal = (bestSingle.totalCost || 0);
        const multiTotal = (multiStore.totalCost || 0);
        return Math.max(0, singleTotal - multiTotal);
    }, [multiStore, singleStores]);

    const formatPrice = useMemo(() => {
        const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'NOK',
            maximumFractionDigits: 0
        });
        return (price: number) => formatter.format(price);
    }, [i18n.language]);

    const minDistance = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return 0;
        return Math.min(...singleStores.map(s => s.distance));
    }, [singleStores]);

    const maxItemsFound = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return 0;
        return Math.max(...singleStores.map(s => s.items.length));
    }, [singleStores]);

    const minPrice = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return 0;
        // Only consider stores that have the maximum number of items found
        const validStores = singleStores.filter(s => s.items.length === maxItemsFound);
        return Math.min(...validStores.map(s => s.totalCost));
    }, [singleStores, maxItemsFound]);

    const comparisonCandidates = useMemo(() => {
        const baseCandidates = singleStores;
        if (multiStore && multiStore.stores.length > 0) {
            // Construct synthetic Smart Route candidate
            const smartRouteItems = multiStore.stores.flatMap(s => s.items);

            const smartRouteCandidate: SingleStoreOption = {
                store: {
                    id: 'smart-route',
                    name: `${multiStore.stores.length} Stops`,
                    chain: t('results.smartRoute', 'Smart Route'),
                    address: 'Optimized Path',
                    location: { lat: 0, lng: 0 },
                    distance: multiStore.totalDistance,
                },
                items: smartRouteItems,
                totalCost: multiStore.totalCost,
                distance: multiStore.totalDistance,
                missingItems: []
            };

            const allCandidates = [smartRouteCandidate, ...baseCandidates];

            return allCandidates.sort((a, b) => {
                const costDiff = (a.totalCost || 0) - (b.totalCost || 0);
                if (Math.abs(costDiff) > 0.01) return costDiff;
                return (a.distance || 0) - (b.distance || 0);
            });
        }
        return baseCandidates;
    }, [singleStores, multiStore, t]);

    if (singleStores.length === 0 && !multiStore) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-2">{t('results.noRoutesTitle', 'No Routes Found')}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {t('results.noRoutesDescription', 'We could not find any stores carrying your items within range.')}
                </p>
                <button
                    onClick={onReset}
                    className="btn btn-outline"
                >
                    {t('results.tryDifferentItems', 'Adjust Search Items')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. View Header */}
            <div className="text-center space-y-2 md:space-y-4 pt-4 md:pt-8">
                {activeView !== 'comparison' && (
                    <h2 className="text-lg md:text-3xl font-heading font-black text-dark whitespace-nowrap overflow-hidden text-ellipsis px-2 leading-tight">
                        {activeView === 'single' ? (
                            t('results.bestSingleStoreHeader', 'Best Single-Store Option')
                        ) : (
                            t('results.smartRouteHeader', 'Smart Multi-Store Route')
                        )}
                    </h2>
                )}
            </div>

            {/* 2. Content Isolation Grid */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">

                {activeView === 'single' ? (
                    <div className="space-y-8 md:space-y-12">
                        {/* Choice 1: Best Single Store */}
                        {singleStores.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-1 px-2">
                                    <div className="h-px bg-primary/10 flex-grow"></div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('results.bestChoice', 'Best Value Selection')}</span>
                                    <div className="h-px bg-primary/10 flex-grow"></div>
                                </div>
                                <div
                                    key={singleStores[0].store.id}
                                    className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-primary bg-primary/[0.02] shadow-lg md:shadow-xl shadow-primary/5 transition-all duration-500"
                                >
                                    <div className="mb-4 md:mb-6">
                                        <h3 className="text-lg md:text-xl font-bold text-dark flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="truncate">{singleStores[0].store.name}</span>
                                                <span className="text-[8px] md:text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
                                                    {t('results.recommended', 'Highly Recommended')}
                                                </span>
                                            </div>
                                            <span className="text-xl md:text-2xl font-black text-primary shrink-0">
                                                {formatPrice(singleStores[0].totalCost || 0)}
                                            </span>
                                        </h3>

                                        {/* Cost Breakdown for Single Store */}
                                        <div className="mt-2 md:mt-3 flex gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500 font-bold bg-white/60 p-1.5 md:p-2 rounded-lg inline-flex border border-primary/5">
                                            <span>{t('results.itemsCost', 'Estimated Cost')}: {formatPrice(singleStores[0].totalCost || 0)}</span>
                                        </div>

                                        <p className="text-xs md:text-sm text-gray-500 mt-3">{t('results.everythingInOnePlace', 'Convenient Single-Stop Shopping')}</p>
                                    </div>

                                    <div
                                        className="cursor-pointer"
                                        onClick={() => onSelectStore?.(singleStores[0].store.id)}
                                    >
                                        <StoreCard
                                            store={singleStores[0].store}
                                            items={singleStores[0].items}
                                            totalCost={singleStores[0].totalCost}
                                            distance={singleStores[0].distance}
                                            variant="detailed"
                                            selected={selectedStoreId === singleStores[0].store.id}
                                            totalRequestedItems={totalRequestedItems}
                                            userLocation={userLocation}
                                            efficiencyTags={(() => {
                                                const tags = [];
                                                if (singleStores[0].totalCost === minPrice) tags.push('💰 Cheapest');
                                                if (singleStores[0].distance === minDistance) tags.push('📍 Closest');
                                                return tags;
                                            })()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Choice 2: Best Alternative (Top 2nd Store) */}
                        {(() => {
                            // Find the first candidate that is NOT the best store (to avoid duplicates by ID or Name)
                            const bestStore = singleStores[0]?.store;
                            const alternative = singleStores.find((s, idx) => {
                                if (idx === 0) return false;
                                // Strict check: ID must be different AND Name must be different
                                return s.store.id !== bestStore?.id && s.store.name !== bestStore?.name;
                            });

                            if (!alternative) return null;

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                        <div className="h-px bg-gray-100 flex-grow"></div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('results.bestAlternative', 'Secondary Provider')}</span>
                                        <div className="h-px bg-gray-100 flex-grow"></div>
                                    </div>
                                    <div
                                        key={alternative.store.id}
                                        className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-gray-100 bg-white hover:border-gray-200 transition-all duration-500"
                                    >
                                        <div className="mb-4 md:mb-6">
                                            <h3 className="text-lg md:text-xl font-bold text-dark flex items-center justify-between gap-2">
                                                <span className="truncate">{alternative.store.name}</span>
                                                <span className="text-xl md:text-2xl font-black text-gray-400 shrink-0">
                                                    {formatPrice(alternative.totalCost || 0)}
                                                </span>
                                            </h3>
                                            <div className="mt-1 text-xs text-gray-400">
                                                {t('results.totalExpense', 'Aggregate Estimated Expenditure')}
                                            </div>
                                        </div>

                                        <div
                                            className="cursor-pointer"
                                            onClick={() => onSelectStore?.(alternative.store.id)}
                                        >
                                            <StoreCard
                                                store={alternative.store}
                                                items={alternative.items}
                                                totalCost={alternative.totalCost}
                                                distance={alternative.distance}
                                                variant="detailed"
                                                selected={selectedStoreId === alternative.store.id}
                                                totalRequestedItems={totalRequestedItems}
                                                userLocation={userLocation}
                                                efficiencyTags={(() => {
                                                    const tags = [];
                                                    if (alternative.totalCost === minPrice) tags.push('💰 Cheapest');
                                                    if (alternative.distance === minDistance) tags.push('📍 Closest');
                                                    return tags;
                                                })()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : activeView === 'multi' ? (
                    /* Smart Multi-Store Route View */
                    <div className="space-y-4 md:space-y-6">
                        {multiStore && (
                            <div className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 border-secondary bg-secondary/[0.02] shadow-lg md:shadow-xl shadow-secondary/5 transition-all duration-500">
                                <div className="mb-4 md:mb-6">
                                    <h3 className="text-lg md:text-xl font-bold text-dark flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate">{t('results.optimizedPath')}</span>
                                            <span className="text-[8px] md:text-[10px] font-bold bg-secondary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
                                                {t('results.cheapestTotal', 'Lowest Aggregate Cost')}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xl md:text-2xl font-black text-secondary block">
                                                {formatPrice(multiStore.totalCost || 0)}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                {t('results.totalExpense', 'Aggregate Estimated Expenditure')}
                                            </span>
                                        </div>
                                    </h3>
                                </div>

                                {/* Trip Metrics Grid */}
                                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                                    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                                        <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('results.stops', 'Stops')}</div>
                                        <div className="font-black text-dark text-sm md:text-lg">{multiStore.stores.length}</div>
                                    </div>
                                    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                                        <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('common.distance', 'Distance')}</div>
                                        <div className="font-black text-dark text-sm md:text-lg">{formatDistance(multiStore.totalDistance)}</div>
                                    </div>
                                    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                                        <div className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('storeCard.items', 'Items')}</div>
                                        <div className="font-black text-dark text-sm md:text-lg">{multiStore.stores.reduce((acc, s) => acc + s.items.length, 0)}</div>
                                    </div>
                                </div>

                                {/* Contextual Savings Banner */}
                                {routeSavings > 0 ? (
                                    <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center mb-6 md:mb-8">
                                        <p className="text-green-800 text-xs md:text-sm font-medium flex items-center justify-center gap-1.5">
                                            <span>{t('results.saveMoney', 'Save an extra')}</span>
                                            <span className="font-black text-base md:text-lg bg-green-100 px-2 py-0.5 rounded text-green-700">{formatPrice(routeSavings)}</span>
                                            <span className="opacity-75">{t('results.vsBestSingle', 'vs. single store')}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center mb-6 md:mb-8">
                                        <p className="text-gray-400 text-xs font-medium italic">
                                            {t('results.priceMatch', 'Matches the best single store price')}
                                        </p>
                                    </div>
                                )}

                                {/* Stops */}
                                <div className="space-y-6">
                                    {multiStore.stores.map((stop, idx) => (
                                        <div key={stop.store.id || idx} className="relative">
                                            {idx < multiStore.stores.length - 1 && (
                                                <div className="absolute left-[1.65rem] top-12 bottom-0 w-0.5 bg-gray-100 -z-10"></div>
                                            )}
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-black shadow-lg ring-4 ring-white shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-grow flex justify-between items-center">
                                                    <span className="text-sm font-bold text-dark italic">
                                                        {stop.store.name}
                                                    </span>
                                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                                        {stop.items.length} items • {formatDistance(stop.distance)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => onSelectStore?.(stop.store.id)}
                                            >
                                                <StoreCard
                                                    store={stop.store}
                                                    items={stop.items}
                                                    totalCost={stop.cost}
                                                    distance={stop.distance}
                                                    variant="detailed"
                                                    selected={selectedStoreId === stop.store.id}
                                                    reasoningTag={t('results.instruction.itemsToBuy')}
                                                    totalRequestedItems={stop.items.length}
                                                    userLocation={userLocation}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Comparison Table View */
                    <ComparisonTable
                        candidates={comparisonCandidates}
                        requestedItemsCount={totalRequestedItems || 0}
                        isMapVisible={isMapVisible}
                        onToggleMap={onToggleMap}
                    />
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-100 mb-12">
                <button
                    onClick={onCreateList}
                    className="btn btn-primary gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all h-12 px-8 w-full sm:w-auto"
                >
                    <List className="w-5 h-5" />
                    {t('results.createShoppingList', 'Generate Shopping List')}
                </button>
            </div>
        </div>
    );
});
