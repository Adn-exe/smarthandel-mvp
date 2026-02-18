
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
    const [activeView, setActiveView] = useState<'single' | 'multi' | 'comparison' | null>(null);
    // isMapVisible controls the desktop Show/Hide Map toggle (only relevant for comparison view on desktop)
    const [isMapVisible, setIsMapVisible] = useState(true);
    const [roadPath, setRoadPath] = useState<LatLngTuple[]>([]);
    const [isRouting, setIsRouting] = useState(false);
    // mobileActiveTab controls the mobile List/Map toggle — available in ALL views
    const [mobileActiveTab, setMobileActiveTab] = useState<'list' | 'map'>('list');
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
    // Helper to detect desktop view for reliable map rendering logic
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const [userLocation, setUserLocation] = useState<Location | null>(
        (routerLocation.state as any)?.location || null
    );

    // Items come from Selection page state
    const confirmedItems = (routerLocation.state as any)?.confirmedItems;

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

    // Redirect to selection if no items found (e.g. direct access to /results)
    useEffect(() => {
        if (!confirmedItems && !query) {
            navigate('/');
        } else if (!confirmedItems && query) {
            navigate(`/selection?q=${encodeURIComponent(query)}`, {
                state: { location: userLocation }
            });
        }
    }, [confirmedItems, query, navigate, userLocation]);

    // Optimization Mutation
    const {
        mutate: optimizeRoute,
        data: routeData,
        isPending: isOptimizing,
        error: routeError
    } = useOptimizeRoute();

    // Optimization Effect - Uses confirmedItems directly
    useEffect(() => {
        if (confirmedItems && userLocation) {
            optimizeRoute({
                items: confirmedItems,
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
                        item_count: confirmedItems.length
                    });
                }
            });
        }
    }, [confirmedItems, userLocation, query]);

    const isLoading = isOptimizing;
    const error = routeError;

    // Use backend-provided searchLocation (e.g. Trondheim center for remote users) for all map visuals
    const effectiveLocation = routeData?.searchLocation || userLocation;

    // Handle Share


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
            if (!effectiveLocation || !mapRoute || mapRoute.length === 0) {
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

    if (!userLocation) {
        return <DynamicLoading step="locating" className="min-h-screen bg-gray-50" />;
    }

    if (isLoading && !routeData) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <SEO title={t('seo.resultsTitle')} />
                <DynamicLoading step="optimizing" />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-20">
            <SEO
                title={query ? `${t('seo.resultsTitle')}: ${query} ` : t('seo.resultsTitle')}
                description={t('results.foundBestOptions')}
            />
            {/* Header */}
            <header className="bg-white sticky top-16 z-[100] border-b border-gray-200">
                <div className="max-w-7xl mx-auto">


                    {/* Bottom Row: View Toggles */}
                    {!isLoading && (
                        <div className="px-3 sm:px-6 lg:px-8 py-0.5 md:py-1 flex items-center justify-between overflow-x-auto no-scrollbar bg-gray-50/50">
                            <div className="flex items-center gap-2 sm:gap-6 shrink-0 w-full md:w-auto justify-between md:justify-start">
                                <div className="flex items-center gap-1.5 pr-3 border-r border-gray-100 mr-1 shrink-0">
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                                        {t('results.itemCount', { count: confirmedItems?.length || 0 })}
                                    </p>
                                </div>
                                <div className="flex bg-gray-50/80 p-0.5 md:p-1 rounded-xl border border-gray-100 shrink-0 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveView('single')}
                                        className={clsx(
                                            "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap",
                                            activeView === 'single'
                                                ? "bg-white text-primary shadow-sm border border-gray-200"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full",
                                            activeView === 'single' ? "bg-primary" : "bg-gray-300"
                                        )}></div>
                                        {t('results.bestStore')}
                                    </button>


                                    {hasMultiStore && (
                                        <button
                                            onClick={() => setActiveView('multi')}
                                            className={clsx(
                                                "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-l border-gray-100 ml-0.5 rounded-l-none pl-3 md:pl-5",
                                                activeView === 'multi'
                                                    ? "bg-white text-secondary shadow-sm border border-gray-200"
                                                    : "text-gray-400 hover:text-gray-600"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full",
                                                activeView === 'multi' ? "bg-secondary" : "bg-gray-300"
                                            )}></div>
                                            {t('results.smartRoute')}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setActiveView('comparison')}
                                        className={clsx(
                                            "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap border-l border-gray-100 ml-0.5 rounded-l-none pl-3 md:pl-5",
                                            activeView === 'comparison'
                                                ? "bg-white text-dark shadow-sm border border-gray-200"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full",
                                            activeView === 'comparison' ? "bg-dark" : "bg-gray-300"
                                        )}></div>
                                        {t('results.comparePrices', 'Price Matrix')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header >

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 animate-fadeSlideIn">
                    {/* Results List Column */}
                    <div className={clsx(
                        "transition-all duration-500 ease-in-out",
                        // Desktop width: full-width when comparison+map hidden, half otherwise
                        activeView === 'comparison' && !isMapVisible ? "w-full" : "lg:w-1/2",
                        // Mobile: hide list when map tab is active (always, regardless of activeView)
                        mobileActiveTab === 'map' ? 'hidden lg:block' : 'block w-full'
                    )}>
                        <div className="space-y-6">
                            <ResultsDisplay
                                singleStores={(() => {
                                    const candidates = routeData?.singleStoreCandidates || [];
                                    const bestSingle = routeData?.singleStore;
                                    const allCandidates = bestSingle ? [bestSingle, ...candidates] : candidates;
                                    const uniqueStores = Array.from(new Map(allCandidates.map(c => {
                                        const key = String(c.store.id);
                                        return [key, c];
                                    })).values());
                                    return uniqueStores;
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
                                totalRequestedItems={confirmedItems?.length || 0}
                                userLocation={routeData?.searchLocation || userLocation}
                                onViewSwitch={setActiveView}
                                isMapVisible={isMapVisible}
                                onToggleMap={() => setIsMapVisible(prev => !prev)}
                            />
                        </div>
                    </div>

                    {/* Map Column */}
                    {/* CRITICAL: On mobile, visibility is ALWAYS controlled by mobileActiveTab.
                        On desktop, for comparison view, isMapVisible controls it.
                        We NEVER use `hidden` unconditionally — Leaflet needs real dimensions. */}
                    <div className={clsx(
                        "transition-all duration-500 ease-in-out",
                        // Desktop: hide map only when comparison view AND user toggled it off
                        activeView === 'comparison' && !isMapVisible
                            ? 'hidden'
                            : 'lg:block lg:w-1/2',
                        // Mobile: always use mobileActiveTab — works in ALL views including comparison
                        mobileActiveTab === 'list' ? 'hidden lg:block' : 'block w-full'
                    )}>
                        <div className="sticky top-28 md:top-44">
                            {/* Map container: always in DOM so Leaflet initialises with real dimensions */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden h-[65vh] md:aspect-[4/5] lg:aspect-auto lg:h-[calc(100vh-12rem)]">
                                <StoreMap
                                    userLocation={effectiveLocation!}
                                    stores={mapStores}
                                    route={mapRoute}
                                    roadPath={roadPath}
                                    isRouting={isRouting}
                                    selectedStore={String(selectedStoreId)}
                                    // isVisible: true whenever the map is actually rendered and visible
                                    // Logic:
                                    // 1. Mobile (< 1024px): Only when map tab is active
                                    // 2. Desktop (>= 1024px): Always visible UNLESS it's comparison view AND user toggled it off
                                    isVisible={isDesktop ? (activeView !== 'comparison' || isMapVisible) : mobileActiveTab === 'map'}
                                    onStoreClick={(store) => {
                                        setSelectedStoreId(store.id);
                                        trackEvent('store_selected', { type: 'map_click', storeId: store.id });
                                    }}
                                />
                            </div>

                            {/* Map Summary / Reasoning */}
                            {(routeData?.singleStoreReasoning || routeData?.multiStoreReasoning || routeData?.reasoning) && (
                                <div className="mt-4 md:mt-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-indigo-100 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700">
                                    <button
                                        onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                        className="w-full flex items-center justify-between group"
                                    >
                                        <h4 className="text-[10px] md:text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                                            {t('results.smartSummaryTitle')}
                                        </h4>
                                        <div className={clsx(
                                            "w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center transition-transform duration-300",
                                            isSummaryExpanded ? "rotate-180" : ""
                                        )}>
                                            <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {isSummaryExpanded && (
                                        <p className="mt-3 text-xs md:text-sm text-indigo-950/70 font-bold leading-relaxed animate-in fade-in slide-in-from-top-1 duration-300">
                                            {(() => {
                                                const currentV = activeView || routeData?.recommendation;

                                                // Helper to format price
                                                const formatPrice = (price: number) => {
                                                    const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
                                                    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(price);
                                                };

                                                if (currentV === 'multi' && routeData?.multiStore && routeData.singleStore) {
                                                    const singleTotal = (routeData.singleStore.totalCost || 0);
                                                    const multiTotal = (routeData.multiStore.totalCost || 0);
                                                    const grocerySavings = singleTotal - multiTotal;

                                                    return (
                                                        <Trans
                                                            i18nKey="results.smartSummaryTemplate"
                                                            values={{
                                                                savings: formatPrice(grocerySavings),
                                                                total: formatPrice(multiTotal)
                                                            }}
                                                            components={{ bold: <strong className="text-indigo-900 font-bold" /> }}
                                                        />
                                                    );
                                                }

                                                // Fallback or purely single store
                                                return (routeData?.singleStoreReasoning || routeData?.reasoning);
                                            })()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Floating Toggle Button */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden z-[60] flex bg-dark/90 backdrop-blur-lg p-1.5 rounded-2xl shadow-2xl border border-white/10">
                    <button
                        onClick={() => setMobileActiveTab('list')}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            mobileActiveTab === 'list' ? "bg-primary text-white" : "text-gray-400"
                        )}
                    >
                        <List className="w-4 h-4" />
                        {t('common.list')}
                    </button>
                    <button
                        onClick={() => setMobileActiveTab('map')}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                            mobileActiveTab === 'map' ? "bg-primary text-white" : "text-gray-400"
                        )}
                    >
                        <MapPin className="w-4 h-4" />
                        {t('common.map')}
                    </button>
                </div>
            </main>

            {/* Mobile Sticky Total Price Footer */}
            {routeData && (activeView === 'single' || activeView === 'multi') && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 md:hidden z-50 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-500">
                    <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                                {activeView === 'multi' ? t('results.smartRoute') : t('results.selectedStore')}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-dark tabular-nums">
                                    {(() => {
                                        const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
                                        const total = activeView === 'multi'
                                            ? routeData.multiStore?.totalCost
                                            : (routeData.singleStoreCandidates?.find(c => String(c.store.id) === String(selectedStoreId))?.totalCost || routeData.singleStore?.totalCost);
                                        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 }).format(total || 0);
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
                </div>
            )}
        </div >
    );
}

// Hook to check media queries
function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);

    return matches;
}
