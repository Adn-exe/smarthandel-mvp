import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useLocation as useRouterLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Sparkles, List } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation, Trans } from 'react-i18next';
import i18n from 'i18next';
import { StoreMap } from '../components/StoreMap';
import { useOptimizeRoute } from '../lib/queryClient';
import { ResultsDisplay } from '../components/ResultsDisplay';
import SEO from '../components/SEO';
import { DynamicLoading } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { trackEvent } from '../utils/analytics';
import { routingService } from '../services/routingService';
import { type LatLngTuple } from 'leaflet';
import type { Location, SingleStoreOption, ShoppingItem } from '../types';

const ResultsSkeleton = lazy(() => import('../components/ResultsSkeleton').then(m => ({ default: m.ResultsSkeleton })));

// Hook to check media queries
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);
    return matches;
}

export default function Results() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();

    // State
    const [selectedStoreId, setSelectedStoreId] = useState<string | number | null>(null);
    const [activeView, setActiveView] = useState<'single' | 'multi' | 'comparison' | null>(null);
    const [isMapVisible, setIsMapVisible] = useState(true);
    const [roadPath, setRoadPath] = useState<LatLngTuple[]>([]);
    const [isRouting, setIsRouting] = useState(false);
    const [mobileActiveTab, setMobileActiveTab] = useState<'list' | 'map'>('list');
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const [userLocation, setUserLocation] = useState<Location | null>(
        (routerLocation.state as any)?.location || null
    );

    const confirmedItems = (routerLocation.state as any)?.confirmedItems as ShoppingItem[] | undefined;
    const selectedItemCount = confirmedItems?.length || 0;

    // Location fallback
    useEffect(() => {
        if (!userLocation && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => setUserLocation({ lat: 59.9139, lng: 10.7522 })
            );
        } else if (!userLocation) {
            setUserLocation({ lat: 59.9139, lng: 10.7522 });
        }
    }, [userLocation]);

    // Redirects
    useEffect(() => {
        if (!confirmedItems && !query) {
            navigate('/');
        } else if (!confirmedItems && query) {
            navigate(`/selection?q=${encodeURIComponent(query)}`, { state: { location: userLocation } });
        }
    }, [confirmedItems, query, navigate, userLocation]);

    const {
        mutate: optimizeRoute,
        data: routeData,
        isPending: isOptimizing,
        error: routeError
    } = useOptimizeRoute();

    useEffect(() => {
        if (confirmedItems && userLocation) {
            optimizeRoute({
                items: confirmedItems,
                userLocation,
                preferences: { maxStores: 3, maxDistance: 10000, excludedChains: [], sortBy: 'cheapest' }
            }, {
                onSuccess: (res: any) => {
                    if (!activeView) setActiveView(res.recommendation || 'single');
                    trackEvent('route_optimized', { query, recommendation: res.recommendation, item_count: confirmedItems.length });
                }
            });
        }
    }, [confirmedItems, userLocation, query, optimizeRoute]);

    const effectiveLocation = routeData?.searchLocation || userLocation;
    const hasMultiStore = !!(routeData?.multiStore && routeData.multiStore.stores.length > 1);
    const showMulti = activeView === 'multi' && hasMultiStore;

    const mapStores = useMemo(() => {
        if (!routeData) return [];
        if (showMulti) return routeData.multiStore!.stores.map((s: any) => s.store);
        if (activeView === 'single') return routeData.singleStoreCandidates?.[0] ? [routeData.singleStoreCandidates[0].store] : (routeData.singleStore ? [routeData.singleStore.store] : []);
        if (routeData.singleStoreCandidates?.length) return routeData.singleStoreCandidates.map(c => c.store);
        return routeData.singleStore ? [routeData.singleStore.store] : [];
    }, [showMulti, activeView, routeData]);

    const mapRoute = useMemo(() => {
        if (!routeData) return undefined;
        if (showMulti) return routeData.multiStore!.stores.map((s: any) => s.store);
        if (activeView === 'single') return routeData.singleStoreCandidates?.[0] ? [routeData.singleStoreCandidates[0].store] : (routeData.singleStore ? [routeData.singleStore.store] : undefined);
        if (routeData.singleStoreCandidates?.length) {
            const selected = routeData.singleStoreCandidates.find(c => String(c.store.id) === String(selectedStoreId));
            return [selected?.store || routeData.singleStoreCandidates[0].store];
        }
        return routeData.singleStore ? [routeData.singleStore.store] : undefined;
    }, [showMulti, activeView, routeData, selectedStoreId]);

    useEffect(() => {
        let isMounted = true;
        const fetchRoadRoute = async () => {
            if (!effectiveLocation || !mapRoute?.length) {
                if (isMounted) setRoadPath([]);
                return;
            }
            const waypoints: LatLngTuple[] = [
                [effectiveLocation.lat, effectiveLocation.lng],
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
    }, [effectiveLocation?.lat, effectiveLocation?.lng, mapRoute]);

    if (!userLocation) return <DynamicLoading step="locating" className="min-h-screen bg-gray-50" />;

    if (isOptimizing && !routeData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <SEO title={t('seo.resultsTitle')} />
                <DynamicLoading step="optimizing" />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <div className="mt-8 border-t border-gray-100 pt-8 opacity-50">
                        <Suspense fallback={<div className="h-96" />}><ResultsSkeleton /></Suspense>
                    </div>
                </main>
            </div>
        );
    }

    if (routeError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <ErrorState error={routeError as Error} onRetry={() => window.location.reload()} onBack={() => navigate('/')} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
            <SEO title={query ? `${t('seo.resultsTitle')}: ${query}` : t('seo.resultsTitle')} description={t('results.foundBestOptions')} />

            <header className="bg-white sticky top-16 z-[100] border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest whitespace-nowrap">
                                {t('results.itemsCount', { count: selectedItemCount })}
                            </span>
                        </div>
                    </div>

                    <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-200">
                        <button
                            onClick={() => setActiveView('single')}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5",
                                activeView === 'single' ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray-400"
                            )}
                        >
                            <div className={clsx("w-1 h-1 rounded-full", activeView === 'single' ? "bg-primary" : "bg-gray-300")} />
                            {t('results.bestStore')}
                        </button>
                        {hasMultiStore && (
                            <button
                                onClick={() => setActiveView('multi')}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 border-l border-gray-100 ml-0.5 rounded-l-none",
                                    activeView === 'multi' ? "bg-white text-secondary shadow-sm border border-gray-200" : "text-gray-400"
                                )}
                            >
                                <div className={clsx("w-1 h-1 rounded-full", activeView === 'multi' ? "bg-secondary" : "bg-gray-300")} />
                                {t('results.smartRoute')}
                            </button>
                        )}
                        <button
                            onClick={() => setActiveView('comparison')}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 border-l border-gray-100 ml-0.5 rounded-l-none",
                                activeView === 'comparison' ? "bg-white text-dark shadow-sm border border-gray-200" : "text-gray-400"
                            )}
                        >
                            <div className={clsx("w-1 h-1 rounded-full", activeView === 'comparison' ? "bg-dark" : "bg-gray-300")} />
                            {t('results.comparePrices', 'Price Matrix')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6 animate-fadeSlideIn">
                    <div className={clsx(
                        "transition-all duration-500",
                        activeView === 'comparison' && !isMapVisible ? "w-full" : "lg:w-1/2",
                        mobileActiveTab === 'map' ? 'hidden lg:block' : 'block w-full'
                    )}>
                        <ResultsDisplay
                            singleStores={(() => {
                                const candidates = (routeData?.singleStoreCandidates || []) as SingleStoreOption[];
                                const bestSingle = routeData?.singleStore as SingleStoreOption | null;
                                const allCandidates = bestSingle ? [bestSingle, ...candidates] : candidates;
                                return Array.from(new Map(allCandidates.map(c => [String(c.store.id), c])).values());
                            })()}
                            multiStore={routeData?.multiStore || null}
                            recommendation={routeData?.recommendation || 'single'}
                            activeView={activeView}
                            selectedStoreId={selectedStoreId}
                            onSelectStore={(id) => setSelectedStoreId(id)}
                            onCreateList={() => alert(t('common.list_coming_soon'))}
                            onReset={() => navigate('/')}
                            totalRequestedItems={selectedItemCount}
                            userLocation={effectiveLocation!}
                            onViewSwitch={setActiveView}
                            isMapVisible={isMapVisible}
                            onToggleMap={() => setIsMapVisible(prev => !prev)}
                        />
                    </div>

                    <div className={clsx(
                        "transition-all duration-500",
                        activeView === 'comparison' && !isMapVisible ? 'hidden' : 'lg:block lg:w-1/2',
                        mobileActiveTab === 'list' ? 'hidden lg:block' : 'block w-full'
                    )}>
                        <div className="sticky top-28 lg:top-36">
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden h-[60vh] md:aspect-[4/5] lg:aspect-auto lg:h-[calc(100vh-10rem)]">
                                <StoreMap
                                    userLocation={effectiveLocation!}
                                    stores={mapStores}
                                    route={mapRoute}
                                    roadPath={roadPath}
                                    isRouting={isRouting}
                                    selectedStore={selectedStoreId !== null ? String(selectedStoreId) : undefined}
                                    isVisible={isDesktop ? (activeView !== 'comparison' || isMapVisible) : mobileActiveTab === 'map'}
                                    onStoreClick={(store) => setSelectedStoreId(store.id)}
                                />
                            </div>

                            {(routeData?.singleStoreReasoning || routeData?.multiStoreReasoning || routeData?.reasoning) && (
                                <div className="mt-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-indigo-100 p-4 shadow-sm">
                                    <button onClick={() => setIsSummaryExpanded(!isSummaryExpanded)} className="w-full flex items-center justify-between group">
                                        <h4 className="text-[10px] md:text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                                            {t('results.smartSummaryTitle')}
                                        </h4>
                                        <div className={clsx("w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center transition-transform", isSummaryExpanded ? "rotate-180" : "")}>
                                            <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </button>
                                    {isSummaryExpanded && (
                                        <p className="mt-3 text-xs md:text-sm text-indigo-950/70 font-bold leading-relaxed">
                                            {(() => {
                                                const currentV = activeView || routeData?.recommendation;
                                                const lang = i18n.language || 'en';
                                                const formatPrice = (p: number) => new Intl.NumberFormat(lang.startsWith('no') ? 'no-NO' : 'en-GB', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(p);
                                                if (currentV === 'multi' && routeData?.multiStore && routeData.singleStore) {
                                                    const grocerySavings = routeData.singleStore.totalCost - routeData.multiStore.totalCost;
                                                    return (
                                                        <Trans
                                                            i18nKey="results.smartSummaryTemplate"
                                                            values={{ savings: formatPrice(grocerySavings), total: formatPrice(routeData.multiStore.totalCost) }}
                                                            components={{ bold: <strong className="text-indigo-900 font-bold" /> }}
                                                        />
                                                    );
                                                }
                                                return routeData?.singleStoreReasoning || routeData?.reasoning;
                                            })()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-[60] flex bg-dark/90 backdrop-blur-lg p-1.5 rounded-2xl shadow-2xl border border-white/10">
                    <button onClick={() => setMobileActiveTab('list')} className={clsx("px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", mobileActiveTab === 'list' ? "bg-primary text-white" : "text-gray-400")}>
                        <List className="w-4 h-4" /> {t('common.list')}
                    </button>
                    <button onClick={() => setMobileActiveTab('map')} className={clsx("px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", mobileActiveTab === 'map' ? "bg-primary text-white" : "text-gray-400")}>
                        <MapPin className="w-4 h-4" /> {t('common.map')}
                    </button>
                </div>
            </main>

            {routeData && (activeView === 'single' || activeView === 'multi') && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 md:hidden z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                            {activeView === 'multi' ? t('results.smartRoute') : t('results.selectedStore')}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-dark tabular-nums">
                                {(() => {
                                    const lang = i18n.language || 'en';
                                    const total = activeView === 'multi' ? routeData.multiStore?.totalCost : (routeData.singleStoreCandidates?.find(c => String(c.store.id) === String(selectedStoreId))?.totalCost || routeData.singleStore?.totalCost);
                                    return new Intl.NumberFormat(lang.startsWith('no') ? 'no-NO' : 'en-GB', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(total || 0);
                                })()}
                            </span>
                            {activeView === 'multi' && routeData.singleStore && (
                                <span className="text-[11px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                                    -{Math.round(((routeData.singleStore.totalCost - routeData.multiStore!.totalCost) / routeData.singleStore.totalCost) * 100)}% saved
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
