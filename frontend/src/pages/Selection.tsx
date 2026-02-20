import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowRight,
    ShoppingBag,
    AlertCircle
} from 'lucide-react';
import { useParseQuery, queryClient } from '../lib/queryClient';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { SearchInput } from '../components/SearchInput';
import { ItemCard } from '../components/ItemCard';
// No local interfaces needed, using types from ../types via context

import { useShoppingList } from '../context/ShoppingListContext';

export function Selection() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const navigate = useNavigate();
    const locationState = useLocation();

    const {
        items,
        location: savedLocation,
        setItems,
        updateQuantity,
        removeItem,
        lockBrand,
        setLocation
    } = useShoppingList();

    const [isThinking, setIsThinking] = useState(false);
    const userLocation = (locationState.state as { location?: { lat: number; lng: number } })?.location || savedLocation;

    // 1. Parsing Query via AI
    const {
        data: parsedData,
        isPending: isParsingInitial,
        error: parseError
    } = useParseQuery(query);

    // Sync isThinking with isParsingInitial, but with a minimum duration
    useEffect(() => {
        if (isParsingInitial) {
            setIsThinking(true);
        } else {
            // Short delay to ensure ThinkingScreen is visible and state settles
            const timer = setTimeout(() => setIsThinking(false), 800);
            return () => clearTimeout(timer);
        }
    }, [isParsingInitial]);

    // Smart sync from parsed data and location
    useEffect(() => {
        if (parsedData?.items) {
            // Smart Merge: Preserve user-modified fields (quantity, lockedBrand)
            const merged = parsedData.items.map((newItem) => {
                const normalizedNewName = (newItem.englishName || newItem.name).toLowerCase();
                const existing = items.find(item =>
                    (item.englishName || item.name).toLowerCase() === normalizedNewName
                );

                if (existing) {
                    return {
                        ...newItem,
                        quantity: existing.quantity, // Preserve user quantity
                        lockedBrand: existing.lockedBrand // Preserve user brand lock
                    };
                }
                return { ...newItem, quantity: newItem.quantity || 1 };
            });

            // Update items if they changed (prevent infinite loops)
            if (JSON.stringify(merged) !== JSON.stringify(items)) {
                setItems(merged);
            }
        }

        if (userLocation && !savedLocation) {
            setLocation(userLocation);
        }
    }, [parsedData, userLocation, savedLocation, setItems, setLocation, items]); // Added 'items' to satisfy lint, JSON.stringify guard prevents loops

    const handleAddItems = (newQuery: string) => {
        const currentQuery = query || '';
        const combinedQuery = currentQuery ? `${currentQuery}, ${newQuery}` : newQuery;

        console.log(`[Selection] Syncing logic: Navigating with combined query: "${combinedQuery}"`);

        navigate(`/selection?q=${encodeURIComponent(combinedQuery)}`, {
            state: locationState.state,
            replace: true
        });
    };

    const handleRemoveItem = (index: number) => {
        // 1. Calculate the hypothetical remaining items
        const remainingItems = items.filter((_, i) => i !== index);

        // 2. Derive the new query string
        const newQuery = remainingItems
            .map(item => item.originalName || item.name)
            .join(', ');

        // 3. OPTIMIZATION: Prefill the React Query cache for the new query.
        // This ensures the useParseQuery(newQuery) hook finds data instantly,
        // skipping the 'isPending' (isParsingInitial) state and the Thinking Screen.
        queryClient.setQueryData(['parse', newQuery], {
            items: remainingItems,
            budget: parsedData?.budget
        });

        // 4. Update local context state
        removeItem(index);

        // 5. Update URL
        navigate(`/selection?q=${encodeURIComponent(newQuery)}`, {
            state: locationState.state,
            replace: true
        });
    };

    const handleConfirm = () => {
        trackEvent('selection_confirmed', {
            item_count: items.length,
            query
        });
        navigate(`/results?q=${encodeURIComponent(query || '')}`, {
            state: {
                location: userLocation,
                confirmedItems: items
            }
        });
    };

    if (isThinking) {
        return <ThinkingScreen />;
    }

    if (parseError) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-dark mb-2">{t('errors.generic_title')}</h2>
                <p className="text-gray-600 mb-6 max-w-md">{t('errors.failedParse')}</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-dark text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all"
                >
                    {t('common.back')}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <SEO title={t('seo.resultsTitle')} />

            {/* Header - Transparent & Minimal */}
            <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300">
                <div className="absolute inset-0 bg-white border-b border-gray-100/50 shadow-sm"></div>
                <div className="relative max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 hover:text-indigo-600 rounded-full text-slate-600 transition-all border border-slate-200"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                            {t('selection.step_counter', { current: 1, total: 2 })}
                        </span>
                        <h1 className="font-heading font-bold text-sm text-slate-900 leading-none">
                            {t('selection.title')}
                        </h1>
                    </div>

                    <div className="w-10" /> {/* Spacer for balance */}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 pt-24">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{t('selection.title')}</h2>
                    <p className="text-slate-500 text-sm font-medium">{t('selection.subtitle')}</p>
                </div>

                {/* Compact Hybrid Search Bar */}
                <div className="mb-10 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-white rounded-2xl p-1 border border-slate-200 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
                        <SearchInput
                            variant="compact"
                            onSearch={handleAddItems}
                            loading={isParsingInitial}
                            placeholder={t('selection.search_placeholder')}
                            className="max-w-none shadow-none border-none"
                        />
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="mt-10 flex flex-col items-center justify-center text-center p-8 md:p-12">
                        <div className="bg-gradient-to-br from-indigo-50 to-white w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-100 shadow-sm">
                            <ShoppingBag className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('selection.empty_title')}</h3>
                        <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">
                            {t('selection.empty_subtitle')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {items.map((item, idx) => (
                            <div
                                key={`${item.name}-${idx}`} // Stable key using name + potential fallback
                                className="animate-reveal"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <ItemCard
                                    item={item}
                                    onUpdateQuantity={(delta: number) => updateQuantity(idx, delta)}
                                    onRemove={() => handleRemoveItem(idx)}
                                    onLockBrand={(brandName: string | undefined) => lockBrand(idx, brandName)}
                                />
                            </div>
                        ))}

                        {/* Subtotal Preview */}
                        <div className="mt-10 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 text-right shadow-sm">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">
                                {t('selection.subtotal_label')}
                            </p>
                            <div className="text-3xl font-bold text-slate-900">
                                NOK {items.reduce((sum, item) => sum + (item.quantity * 25), 0).toFixed(0)}
                                <span className="text-lg text-slate-300 font-medium ml-1">*</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center justify-end gap-1.5 opacity-80">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{t('selection.subtotal_disclaimer')}</span>
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Sticky Action */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 z-30 pointer-events-none safe-area-bottom">
                    <div className="max-w-xl mx-auto pointer-events-auto">
                        <div className="bg-slate-900/95 backdrop-blur-xl p-2 pr-3 rounded-2xl shadow-xl shadow-slate-900/20 flex items-center gap-3 sm:gap-4 border border-white/10 ring-1 ring-white/5 animate-slideUp">
                            <div className="pl-4 sm:pl-6 flex flex-col justify-center shrink-0">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 hidden sm:block">
                                    {t('selection.total_items_label')}
                                </span>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 sm:hidden">
                                    {t('selection.items_short')}
                                </span>
                                <span className="text-white font-bold text-xl leading-none">{items.length}</span>
                            </div>

                            <div className="w-px h-8 bg-white/10 shrink-0"></div>

                            <button
                                onClick={handleConfirm}
                                className="flex-1 bg-white text-slate-900 hover:text-indigo-600 h-11 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all group whitespace-nowrap px-4 border border-transparent hover:border-indigo-100 shadow-sm"
                            >
                                <span>{t('selection.confirm')}</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ThinkingScreen() {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);

    // Cycle through engaging messages
    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s: number) => (s + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const messages = [
        t('thinking.scanning_stores'),
        t('thinking.finding_prices'),
        t('thinking.almost_there'),
        t('common.thinking')
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-[#fafafa] flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                {/* Pulse Icon */}
                <div className="w-20 h-20 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center justify-center mb-8 relative border border-indigo-50">
                    <div className="absolute inset-0 bg-indigo-50 rounded-2xl animate-ping opacity-30 duration-1000"></div>
                    <ShoppingBag className="w-8 h-8 text-indigo-500 animate-pulse" />
                </div>

                {/* Text */}
                <h2 className="text-xl md:text-2xl font-heading font-bold text-slate-900 mb-3 text-center min-h-[32px] transition-all duration-300">
                    {messages[step]}
                </h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-white/50 px-4 py-1.5 rounded-full backdrop-blur-sm border border-slate-100">
                    {t('thinking.ai_working')}
                </p>
            </div>
        </div>
    );
}

export default Selection;
