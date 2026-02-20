import { memo, useMemo } from 'react';
import { List, AlertCircle, Car, ShoppingCart, ArrowRight, Sparkles, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { SingleStoreOption, MultiStoreOption } from '../types';
import { StoreCard } from './StoreCard';

import { ComparisonTable } from './ComparisonTable';
import { formatDistance, calculateTravelTime } from '../utils/format';
import { type ShoppingItem } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ResultsDisplayProps {
    singleStores: SingleStoreOption[];
    multiStore: MultiStoreOption | null;
    recommendation: string;
    onCreateList: () => void;
    onReset: () => void;
    selectedStoreId?: string | number | null;
    onSelectStore?: (storeId: string | number) => void;
    activeView?: 'single' | 'multi' | 'comparison' | null;
    requestedItems: ShoppingItem[];
    userLocation?: { lat: number; lng: number } | null;
    onViewSwitch?: (view: 'single' | 'multi' | 'comparison') => void;
    isMapVisible?: boolean;
    onToggleMap?: () => void;
}

export const ResultsDisplay = memo(function ResultsDisplay({
    singleStores,
    multiStore,
    recommendation,
    onCreateList,
    onReset,
    selectedStoreId,
    onSelectStore,
    activeView,
    requestedItems,
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
            style: 'decimal',
            maximumFractionDigits: 0
        });
        return (price: number) => `${formatter.format(price)} NOK`;
    }, [i18n.language]);

    const minDistance = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return 0;
        return Math.min(...singleStores.map(s => s.distance));
    }, [singleStores]);

    const maxItemsFound = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return 0;
        return Math.max(...singleStores.map(s => s.items.length));
    }, [singleStores]);

    const cheapestStoreId = useMemo(() => {
        if (!singleStores || singleStores.length === 0) return null;
        const validStores = singleStores.filter(s => s.items.length === maxItemsFound);
        const minCost = Math.min(...validStores.map(s => s.totalCost));
        const candidates = validStores.filter(s => s.totalCost === minCost);
        // Tie-breaker: Sort by distance (ascending)
        return candidates.sort((a, b) => a.distance - b.distance)[0]?.store.id;
    }, [singleStores, maxItemsFound]);

    const comparisonCandidates = useMemo(() => {
        const baseCandidates = singleStores;
        if (multiStore && multiStore.stores.length > 1) {
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
                // Priority 1: Coverage (More items is better)
                const countDiff = b.items.length - a.items.length;
                if (countDiff !== 0) return countDiff;

                // Priority 2: Cost (Lower is better)
                const costDiff = (a.totalCost || 0) - (b.totalCost || 0);
                if (Math.abs(costDiff) > 0.01) return costDiff;

                // Priority 3: Distance
                return (a.distance || 0) - (b.distance || 0);
            });
        }
        return baseCandidates;
    }, [singleStores, multiStore, t]);

    const handleDownloadRoutePDF = () => {
        if (!multiStore) return;
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();

        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text(t('results.smartRoutePDFTitle', 'Optimized Smart Route'), 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`${multiStore.stores.length} ${t('results.stops', 'Stops')} • ${formatDistance(multiStore.totalDistance)} • ${formatPrice(multiStore.totalCost)}`, 14, 30);
        doc.text(timestamp, 196, 22, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.line(14, 35, 196, 35);

        let currentY = 45;

        multiStore.stores.forEach((stop, index) => {
            if (currentY > 240) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(37, 99, 235);
            doc.text(`${t('results.stop', 'Stop')} ${index + 1}: ${stop.store.name}`, 14, currentY);
            currentY += 6;

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`${stop.store.chain} • ${stop.store.address}`, 14, currentY);
            currentY += 10;

            const tableData = stop.items.map(item => [
                item.name,
                `${item.quantity}x`,
                `${item.price.toFixed(2)} NOK`,
                `${(item.price * item.quantity).toFixed(2)} NOK`
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [[
                    t('storeCard.product'),
                    t('storeCard.qty'),
                    t('storeCard.unitPrice'),
                    t('storeCard.total')
                ]],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                margin: { left: 14, right: 14 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;
        });

        doc.save('SmartRoute_Shopping_List.pdf');
    };

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

                {/* Show what we were looking for */}
                <div className="flex flex-wrap justify-center gap-2 px-4 max-w-sm mx-auto mb-8">
                    {requestedItems.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-400">
                            {item.originalName || item.name}
                        </span>
                    ))}
                </div>

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
            <div className="text-center space-y-4 md:space-y-6 pt-4 md:pt-8 mb-4">
                {activeView !== 'comparison' && (
                    <h2 className="text-lg md:text-3xl font-heading font-black text-dark whitespace-nowrap overflow-hidden text-ellipsis px-2 leading-tight">
                        {activeView === 'single' ? (
                            t('results.bestSingleStoreHeader', 'Best Single-Store Option')
                        ) : (
                            t('results.smartRouteHeader', 'Smart Multi-Store Route')
                        )}
                    </h2>
                )}

                {/* Input Item Labels */}
                <div className="flex flex-col items-center gap-3 px-4 max-w-2xl mx-auto">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        {t('results.searchingFor', 'Searching for:')}
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                        {requestedItems.map((item, idx) => (
                            <div
                                key={`${item.name}-${idx}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] md:text-xs font-bold text-gray-500 shadow-sm hover:bg-white hover:border-primary/20 hover:text-primary transition-all duration-300 animate-in fade-in zoom-in-95"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                {item.originalName || item.name}
                                {item.quantity > 1 && (
                                    <span className="text-[10px] opacity-60">×{item.quantity}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Content Isolation Grid */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">

                {/* Missed Preferences Alert */}
                {activeView === 'single' && singleStores[0]?.missedPreferences && singleStores[0].missedPreferences.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 p-2 rounded-lg shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-amber-900 mb-1">
                                    {t('results.partialMatch', 'Some specific products were not found')}
                                </h3>
                                <p className="text-xs text-amber-700 mb-3 leading-relaxed">
                                    {t('results.partialMatchDesc', 'The best store doesn\'t have the exact brands/products you requested, so we selected the best available alternatives.')}
                                </p>
                                <div className="space-y-2">
                                    {singleStores[0].missedPreferences.map((miss, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white/60 p-2 rounded border border-amber-100/50 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-amber-900">{miss.itemName}:</span>
                                                <span className="text-amber-600 line-through decoration-amber-400/50">{miss.expected}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-700 font-bold">
                                                <ArrowRight className="w-3 h-3" />
                                                <span>{miss.found}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'single' ? (
                    <div className="space-y-12 md:space-y-16">
                        {/* Choice 1: Best Single Store */}
                        {singleStores.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 mb-1 px-2">
                                    <div className="h-px bg-primary/10 flex-grow"></div>
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t('results.bestChoice', 'Best Value Selection')}</span>
                                    <div className="h-px bg-primary/10 flex-grow"></div>
                                </div>
                                <div
                                    key={singleStores[0].store.id}
                                    className="transition-all duration-500"
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => onSelectStore?.(singleStores[0].store.id)}
                                    >
                                        <StoreCard
                                            store={singleStores[0].store}
                                            items={singleStores[0].items}
                                            totalCost={singleStores[0].totalCost}
                                            distance={singleStores[0].distance}
                                            variant="default"
                                            selected={selectedStoreId === singleStores[0].store.id}
                                            totalRequestedItems={requestedItems.length}
                                            userLocation={userLocation}
                                            highlightBorder="red"
                                            missingItems={singleStores[0].missingItems?.map(name => {
                                                const requested = requestedItems.find(i => i.name === name || i.originalName === name);
                                                return {
                                                    name: name,
                                                    englishName: requested?.englishName
                                                };
                                            })}
                                            efficiencyTags={(() => {
                                                const tags = [];
                                                if (singleStores[0].store.id === cheapestStoreId) tags.push('Cheapest');
                                                if (singleStores[0].distance === minDistance) tags.push('Closest');
                                                return tags;
                                            })()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alternative Options (Top 3 Stores) */}
                        {(() => {
                            const bestStoreId = singleStores[0]?.store.id;
                            const alternatives = singleStores.filter((s, idx) => {
                                if (idx === 0) return false;
                                return s.store.id !== bestStoreId;
                            }).slice(0, 3);

                            if (alternatives.length === 0) return null;

                            return alternatives.map((alternative, index) => (
                                <div key={alternative.store.id} className="space-y-6">
                                    {index === 0 && (
                                        <div className="flex items-center gap-2 mb-2 px-2">
                                            <div className="h-px bg-gray-100 flex-grow"></div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                {t('results.bestAlternative', 'Secondary Provider')}
                                            </span>
                                            <div className="h-px bg-gray-100 flex-grow"></div>
                                        </div>
                                    )}
                                    <div
                                        className="transition-all duration-500"
                                    >
                                        <div
                                            className="cursor-pointer"
                                            onClick={() => onSelectStore?.(alternative.store.id)}
                                        >
                                            <StoreCard
                                                store={alternative.store}
                                                items={alternative.items}
                                                totalCost={alternative.totalCost}
                                                distance={alternative.distance}
                                                variant="default"
                                                selected={selectedStoreId === alternative.store.id}
                                                totalRequestedItems={requestedItems.length}
                                                userLocation={userLocation}
                                                highlightBorder="light-red"
                                                indexBadge={index + 1}
                                                missingItems={alternative.missingItems?.map(name => {
                                                    const requested = requestedItems.find(i => i.name === name || i.originalName === name);
                                                    return {
                                                        name: name,
                                                        englishName: requested?.englishName
                                                    };
                                                })}
                                                efficiencyTags={(() => {
                                                    const tags = [];
                                                    if (alternative.store.id === cheapestStoreId) tags.push('Cheapest');
                                                    if (alternative.distance === minDistance) tags.push('Closest');
                                                    return tags;
                                                })()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                ) : activeView === 'multi' ? (
                    /* Smart Multi-Store Route View - Redesigned Timeline */
                    <div className="space-y-6 md:space-y-10 px-2 lg:px-0">
                        {multiStore && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-xl shrink-0">
                                        <Sparkles className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                                            {t('results.smartRouteOptimized', 'Optimized Route Strategy')}
                                        </h3>
                                        <p className="text-sm text-blue-800 leading-relaxed mb-6">
                                            {recommendation}
                                        </p>
                                        <button
                                            onClick={handleDownloadRoutePDF}
                                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-blue-200 transition-all active:scale-95"
                                        >
                                            <Download className="w-4 h-4" />
                                            {t('results.downloadFullRoute', 'Download Full Route PDF')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {multiStore && (
                            <>
                                {/* Trip Header: Compact & Clean */}
                                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-6 flex flex-wrap md:flex-nowrap items-center justify-around md:justify-between text-center gap-4">
                                    {/* 1. Total Expense */}
                                    <div className="flex-1 min-w-[100px]">
                                        <div className="text-3xl md:text-4xl font-black text-blue-600 tracking-tight leading-none mb-1">
                                            {Math.round(multiStore.totalCost || 0)}
                                        </div>
                                        <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">
                                            NOK {t('results.totalExpense', 'Total Expense')}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden md:block w-px h-8 bg-gray-100"></div>

                                    {/* 2. Stops */}
                                    <div className="flex-1 min-w-[80px]">
                                        <div className="text-2xl md:text-3xl font-black text-gray-900 leading-none mb-1">
                                            {multiStore.stores.length}
                                        </div>
                                        <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">
                                            {t('results.stops', 'Stops')}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden md:block w-px h-8 bg-gray-100"></div>

                                    {/* 3. Distance */}
                                    <div className="flex-1 min-w-[100px]">
                                        <div className="text-2xl md:text-3xl font-black text-gray-900 leading-none mb-1">
                                            {formatDistance(multiStore.totalDistance)}
                                        </div>
                                        <div className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">
                                            {t('common.distance', 'Distance')}
                                        </div>
                                    </div>
                                </div>

                                {routeSavings > 0 && (
                                    <div className="flex justify-center mb-8 -mt-4">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-b-xl border-x border-b border-green-100 shadow-sm">
                                            <Sparkles className="w-3 h-3" />
                                            {t('results.saveExtra', 'Save {{amount}}', { amount: formatPrice(routeSavings) })}
                                        </div>
                                    </div>
                                )}

                                <div className="relative ml-2 mr-2 md:ml-4 md:mr-0">
                                    {/* Vertical Spine - Left Aligned */}
                                    <div className="absolute left-[20px] top-4 bottom-4 w-0.5 bg-gray-100 -z-10 rounded-full"></div>

                                    <div className="space-y-0">
                                        {multiStore.stores.map((stop, idx) => (
                                            <div key={stop.store.id || idx}>
                                                {/* Stop Marker & Card Row */}
                                                <div className="flex items-start gap-6 md:gap-10">
                                                    {/* Stop Marker - 40px Circle (Secondary/Blue) */}
                                                    <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20 ring-4 ring-white shrink-0 z-10 transition-transform hover:scale-110 duration-300">
                                                        <ShoppingCart className="w-5 h-5" />
                                                    </div>

                                                    {/* Right Aligned Card */}
                                                    <div
                                                        className="flex-grow min-w-0 cursor-pointer pb-12 md:pb-20"
                                                        onClick={() => onSelectStore?.(stop.store.id)}
                                                    >
                                                        <StoreCard
                                                            store={stop.store}
                                                            items={stop.items}
                                                            totalCost={stop.cost}
                                                            distance={stop.distance}
                                                            variant="default"
                                                            selected={selectedStoreId === stop.store.id}
                                                            efficiencyTags={[`Stop ${idx + 1}`]}
                                                            totalRequestedItems={stop.items.length}
                                                            userLocation={userLocation}
                                                            highlightBorder="blue"
                                                            showItemCount={true}
                                                            hidePdfButton={true}
                                                            missingItems={stop.missingItems?.map(name => {
                                                                const requested = requestedItems.find(i => i.name === name || i.originalName === name);
                                                                return {
                                                                    name: name,
                                                                    englishName: requested?.englishName
                                                                };
                                                            })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Travel Indicator (Between Stops) */}
                                                {idx < multiStore.stores.length - 1 && (
                                                    <div className="flex items-center gap-4 py-2 ml-[8px] md:ml-[12px] mb-8 md:mb-12">
                                                        <div className="w-4 flex flex-col items-center">
                                                            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-gray-400 font-bold bg-white/40 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-50/50 shadow-sm ml-8">
                                                            <Car className="w-4 h-4 text-secondary/40" />
                                                            <span className="text-[10px] md:text-xs uppercase tracking-[0.1em]">
                                                                {/* Estimated travel time based on distance */}
                                                                {calculateTravelTime(multiStore.stores[idx + 1].distance)} drive ({formatDistance(multiStore.stores[idx + 1].distance)})
                                                            </span>
                                                            <ArrowRight className="w-3 h-3 ml-1 opacity-30" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    /* Comparison Table View */
                    <ComparisonTable
                        candidates={comparisonCandidates}
                        requestedItems={requestedItems}
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
