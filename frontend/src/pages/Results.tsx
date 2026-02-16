import { useState, useEffect, useCallback, Suspense, lazy, useMemo } from 'react';
import { useLocation as useRouterLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Share2, Search, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation, Trans } from 'react-i18next';
import i18n from 'i18next';
import { StoreMap } from '../components/StoreMap';
import { useOptimizeRoute, useParseQuery } from '../lib/queryClient';
import { ResultsDisplay } from '../components/ResultsDisplay';
import SEO from '../components/SEO';
import { DynamicLoading } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { trackEvent } from '../utils/analytics';
import { routingService } from '../services/routingService';
import { type LatLngTuple } from 'leaflet';
import type { Location } from '../types';

const ResultsSkeleton = lazy(() => import('../components/ResultsSkeleton').then(m => ({ default: m.ResultsSkeleton })));

export default function Results() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();

    // State
    const [selectedStoreId, setSelectedStoreId] = useState<string | number | null>(null);
    const [activeView, setActiveView] = useState<'single' | 'multi' | null>(null);
    const [roadPath, setRoadPath] = useState<LatLngTuple[]>([]);
    const [isRouting, setIsRouting] = useState(false);

    const [userLocation, setUserLocation] = useState<Location | null>(
        (routerLocation.state as any)?.location || null
    );

    // If no location in state, try to get it (handle refresh)
    useEffect(() => {
        if (!userLocation && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                () => {
                    setUserLocation({ lat: 59.9139, lng: 10.7522 });
                }
            );
        } else if (!userLocation) {
            setUserLocation({ lat: 59.9139, lng: 10.7522 });
        }
    }, [userLocation]);

    // 1. Parsing Query
    const {
        data: parsedData,
        isPending: isParsing,
        error: parseError
    } = useParseQuery(query);

    // 2. Optimization Mutation
    const {
        mutate: optimizeRoute,
        data: routeData,
        isPending: isOptimizing,
        error: routeError
    } = useOptimizeRoute();

    // Optimization Effect
    useEffect(() => {
        if (parsedData?.items && userLocation) {
            optimizeRoute({
                items: parsedData.items,
                userLocation,
                preferences: {
                    maxStores: 3,
                    maxDistance: 10000,
                    excludedChains: [],
                    sortBy: 'cheapest'
                }
            }, {
                onSuccess: (res: any) => {
                    if (!activeView) {
                        setActiveView(res.recommendation || 'single');
                    }
                    trackEvent('route_optimized', {
                        query,
                        recommendation: res.recommendation,
                        item_count: parsedData.items.length
                    });
                }
            });
        }
    }, [parsedData?.items, userLocation, query]);

    const isLoading = isParsing || isOptimizing;
    const error = parseError || routeError;

    // Handle Share
    const handleShare = useCallback(() => {
        trackEvent('share_clicked', { query });
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: t('common.share_title'),
                text: t('common.share_text', { query }),
                url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert(t('common.copy_alert'));
        }
    }, [query, t]);

    // Prepare stores for map
    const showMulti = activeView === 'multi' && routeData?.multiStore && routeData.multiStore.stores.length > 1;

    const mapStores = useMemo(() => {
        if (!routeData) return [];
        if (showMulti) {
            return routeData.multiStore!.stores.map((s: any) => s.store);
        }
        if (activeView === 'single') {
            return routeData.singleStoreCandidates?.[0] ? [routeData.singleStoreCandidates[0].store] : (routeData.singleStore ? [routeData.singleStore.store] : []);
        }
        if (routeData.singleStoreCandidates && routeData.singleStoreCandidates.length > 0) {
            return routeData.singleStoreCandidates.map(c => c.store);
        }
        return routeData.singleStore ? [routeData.singleStore.store] : [];
    }, [showMulti, activeView, routeData]);

    const mapRoute = useMemo(() => {
        if (!routeData) return undefined;
        if (showMulti) {
            return routeData.multiStore!.stores.map((s: any) => s.store);
        }
        if (activeView === 'single') {
            return routeData.singleStoreCandidates?.[0] ? [routeData.singleStoreCandidates[0].store] : (routeData.singleStore ? [routeData.singleStore.store] : undefined);
        }
        if (routeData.singleStoreCandidates && routeData.singleStoreCandidates.length > 0) {
            const selected = routeData.singleStoreCandidates.find(c => String(c.store.id) === String(selectedStoreId));
            return [selected?.store || routeData.singleStoreCandidates[0].store];
        }
        return routeData.singleStore ? [routeData.singleStore.store] : undefined;
    }, [showMulti, activeView, routeData, selectedStoreId]);

    // Road-following path effect
    useEffect(() => {
        let isMounted = true;
        const fetchRoadRoute = async () => {
            if (!userLocation || !mapRoute || mapRoute.length === 0) {
                if (isMounted) setRoadPath([]);
                return;
            }

            const waypoints: LatLngTuple[] = [
                [userLocation.lat, userLocation.lng],
                ...mapRoute.map(s => [s.location.lat, s.location.lng] as LatLngTuple)
            ];

            setIsRouting(true);
            const path = await routingService.getRoadRoute(waypoints);

            if (isMounted) {
                setRoadPath(path);
                setIsRouting(false);
            }
        };

        fetchRoadRoute();
        return () => { isMounted = false; };
    }, [userLocation?.lat, userLocation?.lng, mapRoute]);

    if (!userLocation) {
        return <DynamicLoading step="locating" className="min-h-screen bg-gray-50" />;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 h-16" />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <DynamicLoading
                        step={isParsing ? 'comparing' : 'optimizing'}
                        className="py-8 min-h-0"
                    />
                    <div className="mt-8 border-t border-gray-100 pt-8 opacity-50">
                        <Suspense fallback={<div className="h-96" />}>
                            <ResultsSkeleton />
                        </Suspense>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <ErrorState
                    error={error as Error}
                    onRetry={() => window.location.reload()}
                    onBack={() => navigate('/')}
                />
            </div>
        );
    }

    const hasMultiStore = routeData?.multiStore && routeData.multiStore.stores.length > 1;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <SEO
                title={query ? `${t('seo.resultsTitle')}: ${query}` : t('seo.resultsTitle')}
                description={t('results.foundBestOptions')}
            />
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top Row: Navigation & Main Actions */}
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4 py-3">
                            <div className="mt-3 translate-y-0.5">
                                <h1 className="text-lg font-bold text-dark flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                                    <span className="text-gray-400 font-medium hidden sm:inline shrink-0">{t('results.title')}</span>
                                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-0.5">
                                        {parsedData?.items ? (
                                            parsedData.items.map((item, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[11px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 whitespace-nowrap uppercase tracking-wider shadow-sm animate-in zoom-in-50 duration-300"
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                >
                                                    {item.originalName || item.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 whitespace-nowrap">
                                                {query}
                                            </span>
                                        )}
                                    </div>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleShare}
                                className="p-2.5 hover:bg-gray-50 text-gray-600 rounded-xl transition-all border border-gray-100 shadow-sm flex items-center gap-2 text-sm font-semibold"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden md:inline">{t('common.share')}</span>
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="bg-dark text-white p-2.5 rounded-xl hover:bg-black transition-all shadow-md flex items-center gap-2 text-sm font-bold pl-4 pr-5 group"
                            >
                                <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline">{t('common.newSearch')}</span>
                                <span className="sm:hidden">New</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Route Options */}
                    <div className="h-14 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
                            <div className="flex items-center gap-2 pr-2 border-r border-gray-100 mr-1">
                                <span className="flex h-1 w-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter whitespace-nowrap">
                                    {t('results.itemCount', { count: parsedData?.items.length || 0 })}
                                </p>
                            </div>
                            <div className="flex bg-gray-50/80 p-1 rounded-xl border border-gray-100 shrink-0">
                                <button
                                    onClick={() => setActiveView('single')}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                                        activeView === 'single'
                                            ? "bg-white text-primary shadow-sm border border-gray-200"
                                            : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-1.5 h-1.5 rounded-full",
                                        activeView === 'single' ? "bg-primary" : "bg-gray-300"
                                    )}></div>
                                    Best Store
                                </button>


                                {hasMultiStore && (
                                    <button
                                        onClick={() => setActiveView('multi')}
                                        className={clsx(
                                            "px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 min-w-[100px] border-l border-gray-100 ml-1 rounded-l-none pl-5",
                                            activeView === 'multi'
                                                ? "bg-white text-primary shadow-sm border border-gray-200"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-1.5 h-1.5 rounded-full",
                                            activeView === 'multi' ? "bg-primary" : "bg-gray-300"
                                        )}></div>
                                        {t('results.smartRoute')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 animate-fadeSlideIn">
                    {/* Results List Column */}
                    <div className="w-full lg:w-1/2">
                        <div className="space-y-6">
                            <ResultsDisplay
                                singleStores={(() => {
                                    const candidates = routeData?.singleStoreCandidates || [];
                                    const bestSingle = routeData?.singleStore;

                                    // Ensure bestSingle is in candidates if it's missing
                                    if (bestSingle && !candidates.some(c => c.store.id === bestSingle.store.id)) {
                                        return [bestSingle, ...candidates];
                                    }
                                    return candidates.length > 0 ? candidates : (bestSingle ? [bestSingle] : []);
                                })()}
                                multiStore={routeData?.multiStore || null}
                                recommendation={routeData?.recommendation || 'single'}
                                activeView={activeView}
                                selectedStoreId={selectedStoreId}
                                onSelectStore={(id) => {
                                    setSelectedStoreId(id);
                                    trackEvent('store_selected', { type: 'card_click', storeId: id });
                                }}
                                onCreateList={() => {
                                    trackEvent('store_selected', { type: 'create_list' });
                                    alert(t('common.list_coming_soon'));
                                }}
                                onReset={() => navigate('/')}
                                totalRequestedItems={parsedData?.items?.length || 0}
                                userLocation={userLocation}
                                onViewSwitch={setActiveView}
                            />
                        </div>
                    </div>

                    {/* Map Column */}
                    <div className="w-full lg:w-1/2">
                        <div className="sticky top-32">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden aspect-[4/5] lg:aspect-auto lg:h-[calc(100vh-12rem)]">
                                <StoreMap
                                    userLocation={userLocation}
                                    stores={mapStores}
                                    route={mapRoute}
                                    roadPath={roadPath}
                                    isRouting={isRouting}
                                    selectedStore={String(selectedStoreId)}
                                    onStoreClick={(store) => {
                                        setSelectedStoreId(store.id);
                                        trackEvent('store_selected', { type: 'map_click', storeId: store.id });
                                    }}
                                />
                            </div>

                            {/* Map Summary / Reasoning (New) */}
                            {(routeData?.singleStoreReasoning || routeData?.multiStoreReasoning || routeData?.reasoning) && (
                                <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-indigo-100 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700">
                                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" />
                                        {t('results.smartSummaryTitle')}
                                    </h4>
                                    <p className="text-sm text-indigo-950/70 font-medium leading-relaxed">
                                        {(() => {
                                            const currentV = activeView || routeData?.recommendation;

                                            // Helper to format price
                                            const formatPrice = (price: number) => {
                                                const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
                                                return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(price);
                                            };

                                            if (currentV === 'multi' && routeData?.multiStore && routeData.singleStore) {
                                                const singleTotal = (routeData.singleStore.totalCost || 0) + (routeData.singleStore.travelCost || 0);
                                                const multiTotal = (routeData.multiStore.totalCost || 0) + (routeData.multiStore.travelCost || 0);
                                                const grocerySavings = (routeData.singleStore.totalCost || 0) - routeData.multiStore.totalCost;
                                                const travelCost = routeData.multiStore.travelCost || 0;
                                                const netSavings = singleTotal - multiTotal;

                                                return (
                                                    <Trans
                                                        i18nKey="results.smartSummaryTemplate"
                                                        values={{
                                                            savings: formatPrice(grocerySavings),
                                                            travel: formatPrice(travelCost),
                                                            net: formatPrice(netSavings)
                                                        }}
                                                        components={{ bold: <strong className="text-indigo-900 font-bold" /> }}
                                                    />
                                                );
                                            }

                                            // Fallback or purely single store
                                            return (routeData?.singleStoreReasoning || routeData?.reasoning);
                                        })()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
