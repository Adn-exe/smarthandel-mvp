import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Minus,
    Trash2,
    ArrowRight,
    ShoppingBag,
    AlertCircle
} from 'lucide-react';
import { useParseQuery } from '../lib/queryClient';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import type { Location } from '../types';

interface ShoppingItem {
    name: string;
    originalName?: string;
    englishName?: string;
    quantity: number;
    unit?: string;
    category?: string;
    brand?: string;
}

export function Selection() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const navigate = useNavigate();
    const location = useLocation();

    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [userLocation] = useState<Location | null>(
        (location.state as any)?.location || null
    );

    // 1. Parsing Query via AI
    const {
        data: parsedData,
        isPending: isParsing,
        error: parseError
    } = useParseQuery(query);

    // Initial sync from parsed data
    useEffect(() => {
        if (parsedData?.items && items.length === 0) {
            setItems(parsedData.items.map((item: any) => ({
                ...item,
                quantity: item.quantity || 1
            })));
        }
    }, [parsedData, items.length]);

    const handleUpdateQuantity = (index: number, delta: number) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
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

    if (isParsing) {
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
        <div className="min-h-screen bg-[#fafafa] pb-32">
            <SEO title={t('seo.resultsTitle')} />

            {/* Header - Transparent & Minimal */}
            <header className="fixed top-0 left-0 right-0 z-40 transition-all duration-300">
                <div className="absolute inset-0 bg-white border-b border-gray-100/50 shadow-sm"></div>
                <div className="relative max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 flex items-center justify-center bg-white/50 hover:bg-white rounded-full text-dark transition-all shadow-sm hover:shadow-md border border-gray-100/50"
                    >
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</span>
                        <h1 className="font-heading font-black text-sm md:text-base text-dark leading-none">
                            Review List
                        </h1>
                    </div>

                    <div className="w-10" /> {/* Spacer for balance */}
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 pt-24">
                <div className="mb-8">
                    <h2 className="text-2xl font-black text-dark mb-2">{t('selection.title')}</h2>
                    <p className="text-gray-500 font-medium">{t('selection.subtitle')}</p>
                </div>

                {items.length === 0 ? (
                    <div className="mt-20 flex flex-col items-center justify-center text-center p-8 md:p-12">
                        <div className="bg-gradient-to-br from-gray-50 to-white w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-xl shadow-gray-100 mb-8 border border-white relative overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-20"></div>
                            <ShoppingBag className="w-12 h-12 text-gray-300 group-hover:scale-110 group-hover:text-primary/50 transition-all duration-500" />
                        </div>
                        <h3 className="text-2xl font-black text-dark mb-3">Your list is empty</h3>
                        <p className="text-gray-500 font-medium max-w-xs mx-auto mb-8 leading-relaxed">
                            Start adding items to compare prices across stores near you.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-dark text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-dark/20 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 group"
                        >
                            <Plus className="w-5 h-5 bg-white/20 rounded-full p-0.5" />
                            <span>Add Items</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, idx) => (
                            <div
                                key={idx}
                                className="group bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-indigo-50/50 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between animate-reveal relative overflow-hidden"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-white -z-10 rounded-bl-3xl opacity-50 transition-transform group-hover:scale-150 duration-700"></div>

                                <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-indigo-50 to-white rounded-2xl flex items-center justify-center shrink-0 border border-indigo-50 shadow-sm group-hover:rotate-6 transition-transform duration-500">
                                        <ShoppingBag className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <div className="truncate pr-4">
                                        <h3 className="font-heading font-black text-lg text-dark truncate tracking-tight group-hover:text-primary transition-colors">
                                            {item.originalName || item.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary transition-colors"></span>
                                            {item.category || (item.name.length > 15 ? 'Essentials' : item.name)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100 shadow-inner">
                                        <button
                                            onClick={() => handleUpdateQuantity(idx, -1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all shadow-sm hover:shadow active:scale-90 disabled:opacity-50 disabled:shadow-none"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-10 text-center font-black text-dark text-sm tabular-nums">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => handleUpdateQuantity(idx, 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white hover:bg-green-50 text-dark hover:text-green-600 rounded-full transition-all shadow-sm hover:shadow active:scale-90"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="w-px h-8 bg-gray-100 mx-1"></div>

                                    <button
                                        onClick={() => handleRemoveItem(idx)}
                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full hover:rotate-12"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Subtotal Preview */}
                        <div className="mt-8 bg-white/50 border border-gray-100 rounded-[2rem] p-4 md:p-6 text-right">
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-[0.2em] mb-1">
                                Estimated Subtotal
                            </p>
                            <div className="text-2xl md:text-3xl font-black text-dark">
                                NOK {items.reduce((sum, item) => sum + (item.quantity * 25), 0).toFixed(0)}
                                <span className="text-base md:text-lg text-gray-400 font-medium ml-1">*</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic">* Based on average market prices. We'll find the exact store prices next.</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Sticky Action */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-4 right-4 z-30 pointer-events-none safe-area-bottom">
                    <div className="max-w-xl mx-auto pointer-events-auto">
                        <div className="bg-blue-500/90 backdrop-blur-xl p-2 pr-3 rounded-[2rem] shadow-2xl shadow-blue-500/30 flex items-center gap-3 sm:gap-4 border border-white/20 ring-1 ring-white/20 animate-slideUp">
                            <div className="pl-4 sm:pl-6 flex flex-col justify-center shrink-0">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-100 hidden sm:block">Total Items</span>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-100 sm:hidden">Items</span>
                                <span className="text-white font-black text-xl leading-none">{items.length}</span>
                            </div>

                            <div className="w-px h-8 bg-white/10 shrink-0"></div>

                            <button
                                onClick={handleConfirm}
                                className="flex-1 bg-white text-dark h-12 rounded-[1.5rem] font-black text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all group relative overflow-hidden whitespace-nowrap px-4"
                            >
                                <span className="relative z-10">{t('selection.confirm')}</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
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
            setStep((s) => (s + 1) % 4);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const messages = [
        t('common.thinking', 'Analyzing your request...'),
        "Scanning local stores...",
        "Finding best prices...",
        "Almost there..."
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                {/* Pulse Icon */}
                <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl shadow-indigo-100 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-indigo-50 rounded-3xl animate-ping opacity-20 duration-1000"></div>
                    <ShoppingBag className="w-10 h-10 text-primary animate-pulse" />
                </div>

                {/* Text */}
                <h2 className="text-2xl md:text-3xl font-heading font-black text-dark mb-3 text-center min-h-[40px] transition-all duration-300">
                    {messages[step]}
                </h2>
                <p className="text-gray-400 font-medium bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm border border-white/20">
                    SmartHandel AI is working for you
                </p>
            </div>
        </div>
    );
}

export default Selection;
