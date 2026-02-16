import { memo, useMemo } from 'react';
import { List, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SingleStoreOption, MultiStoreOption } from '../types';
import { StoreCard } from './StoreCard';

interface ResultsDisplayProps {
    singleStores: SingleStoreOption[];
    multiStore: MultiStoreOption | null;
    recommendation: string;
    onCreateList: () => void;
    onReset: () => void;
    selectedStoreId?: string | number | null;
    onSelectStore?: (storeId: string | number) => void;
    activeView?: 'single' | 'multi' | null;
    totalRequestedItems?: number;
    userLocation?: { lat: number; lng: number } | null;
    onViewSwitch?: (view: 'single' | 'multi') => void;
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
    userLocation
}: ResultsDisplayProps) {
    const { t, i18n } = useTranslation();

    const routeSavings = useMemo(() => {
        const bestSingle = singleStores[0];
        if (!multiStore || !bestSingle) return 0;
        const singleTotal = (bestSingle.totalCost || 0) + (bestSingle.travelCost || 0);
        const multiTotal = (multiStore.totalCost || 0) + (multiStore.travelCost || 0);
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

    const minPrice = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return 0;
        return Math.min(...singleStores.map(s => s.totalCost));
    }, [singleStores]);

    if (singleStores.length === 0 && !multiStore) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-dark mb-2">{t('results.noRoutesTitle')}</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    {t('results.noRoutesDescription')}
                </p>
                <button
                    onClick={onReset}
                    className="btn btn-outline"
                >
                    {t('results.tryDifferentItems')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. View Header */}
            <div className="text-center space-y-4">
                <h2 className="text-2xl md:text-3xl font-heading font-bold text-dark whitespace-nowrap overflow-hidden text-ellipsis">
                    {activeView === 'single' ? (
                        t('results.bestSingleStoreHeader')
                    ) : (
                        t('results.smartRouteHeader')
                    )}
                </h2>
            </div>

            {/* 2. Content Isolation Grid */}
            <div className="grid grid-cols-1 gap-6">

                {activeView === 'single' ? (
                    <div className="space-y-12">
                        {/* Choice 1: Best Single Store */}
                        {singleStores.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 px-2">
                                    <div className="h-px bg-primary/10 flex-grow"></div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('results.bestChoice')}</span>
                                    <div className="h-px bg-primary/10 flex-grow"></div>
                                </div>
                                <div
                                    key={singleStores[0].store.id}
                                    className="relative p-6 rounded-3xl border-2 border-primary bg-primary/[0.02] shadow-xl shadow-primary/5 transition-all duration-500"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-dark flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {singleStores[0].store.name}
                                                <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                    {t('results.recommended')}
                                                </span>
                                            </div>
                                            <span className="text-2xl font-black text-primary">
                                                {formatPrice((singleStores[0].totalCost || 0) + (singleStores[0].travelCost || 0))}
                                            </span>
                                        </h3>

                                        {/* Cost Breakdown for Single Store */}
                                        <div className="mt-3 flex gap-4 text-xs text-gray-500 font-medium bg-white/50 p-2 rounded-lg inline-flex">
                                            <span>{t('results.itemsCost')}: {formatPrice(singleStores[0].totalCost || 0)}</span>
                                            <span className="w-px bg-gray-300"></span>
                                            <span>{t('results.travelCost')}: {formatPrice(singleStores[0].travelCost || 0)}</span>
                                        </div>

                                        <p className="text-sm text-gray-500 mt-2">{t('results.everythingInOnePlace')}</p>
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
                        {singleStores.length > 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2 px-2">
                                    <div className="h-px bg-gray-100 flex-grow"></div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('results.bestAlternative')}</span>
                                    <div className="h-px bg-gray-100 flex-grow"></div>
                                </div>
                                <div
                                    key={singleStores[1].store.id}
                                    className="relative p-6 rounded-3xl border-2 border-gray-100 bg-white hover:border-gray-200 transition-all duration-500"
                                >
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-dark flex items-center justify-between">
                                            <span>{singleStores[1].store.name}</span>
                                            <span className="text-2xl font-black text-gray-400">
                                                {formatPrice((singleStores[1].totalCost || 0) + (singleStores[1].travelCost || 0))}
                                            </span>
                                        </h3>
                                        <div className="mt-1 text-xs text-gray-400">
                                            {t('results.totalExpense')} (Inc. Travel)
                                        </div>
                                    </div>

                                    <div
                                        className="cursor-pointer"
                                        onClick={() => onSelectStore?.(singleStores[1].store.id)}
                                    >
                                        <StoreCard
                                            store={singleStores[1].store}
                                            items={singleStores[1].items}
                                            totalCost={singleStores[1].totalCost}
                                            distance={singleStores[1].distance}
                                            variant="detailed"
                                            selected={selectedStoreId === singleStores[1].store.id}
                                            totalRequestedItems={totalRequestedItems}
                                            userLocation={userLocation}
                                            efficiencyTags={(() => {
                                                const tags = [];
                                                if (singleStores[1].totalCost === minPrice) tags.push('💰 Cheapest');
                                                if (singleStores[1].distance === minDistance) tags.push('📍 Closest');
                                                return tags;
                                            })()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Smart Multi-Store Route View */
                    <div className="space-y-6">
                        {multiStore && (
                            <div className="relative p-6 rounded-3xl border-2 border-secondary bg-secondary/[0.02] shadow-xl shadow-secondary/5 transition-all duration-500">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-dark flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {t('results.optimizedPath')}
                                            <span className="text-[10px] font-bold bg-secondary text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {t('results.cheapestTotal')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-secondary block">
                                                {formatPrice((multiStore.totalCost || 0) + (multiStore.travelCost || 0))}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                {t('results.totalExpense')}
                                            </span>
                                        </div>
                                    </h3>
                                </div>

                                {/* Cost Breakdown Table */}
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8 shadow-sm">
                                    <div className="flex divide-x divide-gray-100">
                                        <div className="flex-1 p-4 text-center">
                                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{t('results.itemsCost')}</div>
                                            <div className="font-bold text-dark text-lg">{formatPrice(multiStore.totalCost || 0)}</div>
                                        </div>
                                        <div className="flex-1 p-4 text-center bg-gray-50/50">
                                            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1 px-2">{t('results.travelCost')}</div>
                                            <div className="font-bold text-gray-600 text-lg">{formatPrice(multiStore.travelCost || 0)}</div>
                                        </div>
                                        <div className="flex-1 p-4 text-center bg-secondary/5">
                                            <div className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">{t('results.totalExpense')}</div>
                                            <div className="font-black text-secondary text-lg">{formatPrice((multiStore.totalCost || 0) + (multiStore.travelCost || 0))}</div>
                                        </div>
                                    </div>

                                    {/* Savings Footer */}
                                    <div className="bg-secondary p-3 text-center text-white text-sm font-medium">
                                        You save <span className="font-bold text-lg mx-1">{formatPrice(routeSavings)}</span> compared to best single store
                                    </div>
                                </div>

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
                                                        {stop.items.length} items • {stop.distance.toFixed(1)} km
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
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-100 mb-12">
                <button
                    onClick={onCreateList}
                    className="btn btn-primary gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all h-12 px-8"
                >
                    <List className="w-5 h-5" />
                    {t('results.createShoppingList')}
                </button>

                <button
                    onClick={onReset}
                    className="btn text-gray-400 hover:text-dark text-sm"
                >
                    {t('common.startOver')}
                </button>
            </div>
        </div>
    );
});
