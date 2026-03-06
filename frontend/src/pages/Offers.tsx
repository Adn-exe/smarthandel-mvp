import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame,
    ChevronDown,
    Search,
    Tag,
    Store as StoreIcon,
    ArrowRight,
    AlertCircle,
    X,
    ShoppingCart,
    MapPin,
    Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useShoppingList } from '../context/ShoppingListContext';

const POSTERS = [
    { id: 1, src: '/assets/offers/bunpris/bunpris-banner-2.png', alt: 'Billig Middag', chain: 'BUNPRIS' },
    { id: 2, src: '/assets/offers/bunpris/bunpris-offer-1.png', alt: 'Bunpris Super Tilbud', chain: 'BUNPRIS' },
    { id: 3, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.26.29 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 4, src: '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.21.55 AM.png', alt: 'Coop Marked', chain: 'COOP Marked' },
    { id: 5, src: '/assets/offers/bunpris/bunpris-offer-4.png', alt: 'Bunpris Vinter Fest', chain: 'BUNPRIS' },
    { id: 7, src: '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.22.35 AM.png', alt: 'Coop Marked', chain: 'COOP Marked' },
    { id: 8, src: '/assets/offers/bunpris/bunpris-offer-5.png', alt: 'Bunpris Ukens Kupp', chain: 'BUNPRIS' },
    { id: 9, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.28.49 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 10, src: '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.23.04 AM.png', alt: 'Coop Marked', chain: 'COOP Marked' },
    { id: 11, src: '/assets/offers/bunpris/bunpris-offer-7.png', alt: 'Bunpris Tilbud', chain: 'BUNPRIS' },
    { id: 12, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.29.08 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 13, src: '/assets/offers/bunpris/bunpris-offer-8.png', alt: 'Bunpris Tilbud', chain: 'BUNPRIS' },
    { id: 14, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.29.37 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 15, src: '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.23.50 AM.png', alt: 'Coop Marked', chain: 'COOP Marked' },
    { id: 16, src: '/assets/offers/bunpris/bunpris-offer-11.png', alt: 'Bunpris Tilbud', chain: 'BUNPRIS' },
    { id: 17, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.30.07 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 18, src: '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.24.08 AM.png', alt: 'Coop Marked', chain: 'COOP Marked' },
    { id: 19, src: '/assets/offers/bunpris/bunpris-offer-14.png', alt: 'Bunpris Tilbud', chain: 'BUNPRIS' },
    { id: 20, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.30.40 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 21, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.31.01 PM.png', alt: 'Joker Tilbud 4', chain: 'Joker' },
    { id: 22, src: '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.24.55 AM.png', alt: 'Coop Marked', chain: 'COOP Marked' },
    { id: 23, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.30.47 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 24, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.31.08 PM.png', alt: 'Joker Tilbud', chain: 'Joker' },
    { id: 25, src: '/assets/offers/Joker/Screenshot 2026-03-04 at 7.31.29 PM.png', alt: 'Joker Tilbud', chain: 'Joker' }
];

// Simplified type for the frontend
interface OfferProduct {
    product_name: string;
    product_name_en: string;
    chain: string;
    category: string;
    discount_type: string;
    discount_value?: string;
    discount_percent?: number;
    final_price?: number;
    original_price?: number | null;
    currency?: string;
    brand?: string;
    label: string;
}

const CATEGORIES = [
    "All", "Groceries", "Dairy", "Meat", "Bakery", "Snacks", "Beverages", "Pantry", "Ready Meals", "Vegetables", "Fruits", "Household", "Personal Care", "Baby", "Pets"
];

const CHAINS = ['All Stores', 'REMA 1000', 'KIWI', 'MENY', 'Extra', 'COOP Marked', 'Spar', 'BUNPRIS', 'Joker'];

const getStoreColors = (chain: string) => {
    const c = (chain || '').toUpperCase();
    if (c.includes('JOKER')) return { bg: 'bg-orange-50', accent: 'text-orange-600', fill: 'bg-orange-600', border: 'border-orange-100', hover: 'hover:border-orange-300', dot: 'bg-orange-200', ghBg: 'group-hover:bg-orange-600' };
    if (c.includes('BUNPRIS')) return { bg: 'bg-yellow-50', accent: 'text-yellow-700', fill: 'bg-yellow-600', border: 'border-yellow-200', hover: 'hover:border-yellow-400', dot: 'bg-yellow-200', ghBg: 'group-hover:bg-yellow-600' };
    if (c.includes('REMA')) return { bg: 'bg-blue-50', accent: 'text-blue-700', fill: 'bg-blue-600', border: 'border-blue-200', hover: 'hover:border-blue-400', dot: 'bg-blue-200', ghBg: 'group-hover:bg-blue-600' };
    if (c.includes('KIWI')) return { bg: 'bg-lime-50', accent: 'text-lime-700', fill: 'bg-lime-600', border: 'border-lime-200', hover: 'hover:border-lime-400', dot: 'bg-lime-200', ghBg: 'group-hover:bg-lime-600' };
    if (c.includes('MENY') || c.includes('EXTRA') || c.includes('COOP')) return { bg: 'bg-red-50', accent: 'text-red-700', fill: 'bg-red-600', border: 'border-red-100', hover: 'hover:border-red-300', dot: 'bg-red-200', ghBg: 'group-hover:bg-red-600' };
    if (c.includes('SPAR')) return { bg: 'bg-emerald-50', accent: 'text-emerald-700', fill: 'bg-emerald-600', border: 'border-emerald-100', hover: 'hover:border-emerald-300', dot: 'bg-emerald-200', ghBg: 'group-hover:bg-emerald-600' };
    return { bg: 'bg-slate-50', accent: 'text-slate-700', fill: 'bg-slate-600', border: 'border-slate-100', hover: 'hover:border-slate-300', dot: 'bg-slate-200', ghBg: 'group-hover:bg-slate-600' };
};

export function Offers() {
    const { t } = useTranslation();
    const location = useLocation();

    // State
    const [offers, setOffers] = useState<OfferProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterChain, setFilterChain] = useState<string>("All Stores");
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterSticky, setIsFilterSticky] = useState(false);
    const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
    const storeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
                setIsStoreDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Poster Modal State
    const [selectedPoster, setSelectedPoster] = useState<{ src: string; alt: string } | null>(null);

    // Quick View State
    const [selectedOfferForQuickView, setSelectedOfferForQuickView] = useState<OfferProduct | null>(null);

    const { addItems } = useShoppingList();

    // Initial Data Fetch
    useEffect(() => {
        const fetchOffers = async () => {
            setIsLoading(true);
            try {
                const offersData = await api.getOffers();
                if (offersData && offersData.length > 0) {
                    // Fisher-Yates shuffle for randomness
                    const shuffled = [...offersData];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    setOffers(shuffled);
                }
            } catch (error) {
                console.error("Failed to fetch offers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOffers();
    }, []);

    // Handle Deep Linking
    useEffect(() => {
        if (location.state && (location.state as any).chain) {
            setFilterChain((location.state as any).chain);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Scroll listener for sticky filter
    useEffect(() => {
        const handleScroll = () => setIsFilterSticky(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Memoized Filtering & Sorting
    const filteredOffers = useMemo(() => {
        return offers.filter(offer => {
            // Discard offer card entirely if the final price is >= original price
            if (offer.final_price && offer.original_price && offer.final_price >= offer.original_price) {
                return false;
            }

            const matchesChain = filterChain === "All Stores" || (offer.chain && offer.chain.toLowerCase() === filterChain.toLowerCase());
            const matchesCategory = filterCategory === "All" || offer.category === filterCategory;

            const q = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                (offer.product_name && offer.product_name.toLowerCase().includes(q)) ||
                (offer.product_name_en && offer.product_name_en.toLowerCase().includes(q)) ||
                (offer.brand && offer.brand.toLowerCase().includes(q));

            return matchesChain && matchesCategory && matchesSearch;
        });
    }, [offers, filterChain, filterCategory, searchQuery]);

    // Counts for filters
    const chainCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        offers.forEach(offer => {
            if (!offer.chain) return;
            const chain = offer.chain.toUpperCase();
            // Map common Norwegian chain variations to the display names in CHAINS
            let displayChain = CHAINS.find(c => c.toUpperCase() === chain);
            if (!displayChain) {
                if (chain.includes('COOP')) displayChain = 'COOP Marked';
                else if (chain.includes('BUNPRIS')) displayChain = 'BUNPRIS';
                else if (chain.includes('JOKER')) displayChain = 'Joker';
            }
            if (displayChain) {
                counts[displayChain] = (counts[displayChain] || 0) + 1;
            }
        });
        return counts;
    }, [offers]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        offers.forEach(offer => {
            const cat = offer.category || 'Other';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [offers]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-primary">

            {/* ─── Poster Lightbox Modal ─── */}
            <AnimatePresence>
                {selectedPoster && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
                        onClick={() => setSelectedPoster(null)}
                    >
                        <button
                            className="absolute top-4 right-4 sm:top-8 sm:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                            onClick={() => setSelectedPoster(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedPoster.src}
                                alt={selectedPoster.alt}
                                className="w-full h-full object-contain max-h-[90vh]"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Offer Quick-View Modal ─── */}
            <AnimatePresence>
                {selectedOfferForQuickView && (() => {
                    const colors = getStoreColors(selectedOfferForQuickView.chain);
                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                            onClick={() => setSelectedOfferForQuickView(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 100, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 100, opacity: 0 }}
                                className="bg-white w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl relative p-6 sm:p-8 flex flex-col mt-auto sm:mt-0 max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Mobile Handle */}
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden shrink-0" />

                                <button
                                    className={`absolute top-4 right-4 z-10 w-10 h-10 ${colors.bg} hover:bg-white rounded-full flex items-center justify-center ${colors.accent} border ${colors.border} transition-colors shadow-sm hidden sm:flex`}
                                    onClick={() => setSelectedOfferForQuickView(null)}
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col">
                                    <div className="mb-6">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <div className={`px-3 py-1.5 ${colors.bg} rounded-xl border ${colors.border}`}>
                                                <span className={`text-[10px] font-black ${colors.accent} uppercase tracking-widest`}>{selectedOfferForQuickView.chain}</span>
                                            </div>
                                            {selectedOfferForQuickView.discount_percent && (
                                                <div className={`px-3 py-1.5 ${colors.fill} text-white rounded-xl shadow-sm text-[10px] font-black uppercase tracking-widest`}>
                                                    -{selectedOfferForQuickView.discount_percent}% OFF
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-xs font-bold ${colors.accent} uppercase tracking-widest mb-2 flex items-center gap-1.5`}>
                                            <Info className="w-3 h-3" />
                                            {selectedOfferForQuickView.category}
                                        </p>
                                        <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1">
                                            {selectedOfferForQuickView.product_name}
                                        </h2>
                                        {selectedOfferForQuickView.brand && (
                                            <p className="text-sm font-medium text-slate-400">{selectedOfferForQuickView.brand}</p>
                                        )}
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className={`p-4 ${colors.bg} rounded-2xl border ${colors.border}`}>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                {selectedOfferForQuickView.final_price ? 'Current Price' : 'Offer Deal'}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-3xl font-black ${colors.accent}`}>
                                                    {selectedOfferForQuickView.final_price
                                                        ? selectedOfferForQuickView.final_price
                                                        : selectedOfferForQuickView.discount_percent
                                                            ? `-${selectedOfferForQuickView.discount_percent}%`
                                                            : selectedOfferForQuickView.discount_value}
                                                </span>
                                                {selectedOfferForQuickView.final_price && (
                                                    <span className="text-sm font-bold text-slate-500">{selectedOfferForQuickView.currency || 'kr'}</span>
                                                )}
                                                {selectedOfferForQuickView.original_price && (
                                                    <span className="text-sm font-bold text-slate-300 line-through ml-2">
                                                        {selectedOfferForQuickView.original_price} {selectedOfferForQuickView.currency || 'kr'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                                    <MapPin className={`w-4 h-4 ${colors.accent}`} />
                                                </div>
                                                <span>Available at {selectedOfferForQuickView.chain} nearby</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                                                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                                                    <StoreIcon className={`w-4 h-4 ${colors.accent}`} />
                                                </div>
                                                <span>Find Store Location</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex flex-col gap-3">
                                        <button
                                            onClick={() => {
                                                addItems([{
                                                    name: selectedOfferForQuickView.product_name,
                                                    englishName: selectedOfferForQuickView.product_name_en,
                                                    quantity: 1,
                                                    lockedBrand: selectedOfferForQuickView.brand,
                                                    lockedStore: selectedOfferForQuickView.chain,
                                                    lockedProductDetails: {
                                                        id: selectedOfferForQuickView.product_name, // fallback ID
                                                        name: selectedOfferForQuickView.product_name,
                                                        englishName: selectedOfferForQuickView.product_name_en,
                                                        price: selectedOfferForQuickView.final_price || 0,
                                                        store: selectedOfferForQuickView.chain,
                                                        image_url: selectedOfferForQuickView.label,
                                                        unit: selectedOfferForQuickView.discount_value || ''
                                                    }
                                                }]);
                                                setSelectedOfferForQuickView(null);
                                            }}
                                            className={`w-full py-4 ${colors.fill} hover:opacity-90 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
                                        >
                                            <ShoppingCart className="w-4 h-4" />
                                            Add to Shopping List
                                        </button>
                                        <button
                                            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-colors"
                                            onClick={() => setSelectedOfferForQuickView(null)}
                                        >
                                            Close Details
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>

            {/* ─── Hero Poster Carousel ─── */}
            <div className="bg-white border-b border-slate-200 pt-20 pb-4 sm:pt-24 sm:pb-16 px-3 sm:px-4 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#ea580c]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#f97316]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <Flame className="w-5 h-5 text-[#f97316]" />
                        <span className="text-sm font-black text-[#ea580c] uppercase tracking-widest">{t('offers.latest_flyers', 'Latest Flyers')}</span>
                    </div>

                    <div className="relative group">
                        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-5 gap-3 sm:gap-8 space-y-3 sm:space-y-8">
                            {POSTERS.map((poster, idx) => (
                                <motion.div
                                    key={idx}
                                    className="break-inside-avoid rounded-[0.75rem] sm:rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg bg-slate-50 border border-slate-200/60 relative group/card cursor-pointer"
                                    whileHover={{ scale: 1.02, zIndex: 10 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={() => setSelectedPoster(poster)}
                                >
                                    <img
                                        src={poster.src}
                                        alt={poster.alt}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover/card:scale-105"
                                        loading="lazy"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Sticky Filter & Categories Bar ─── */}
            <div className={`sticky top-0 z-40 transition-all duration-300 ${isFilterSticky ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm' : 'py-6 sm:py-8'}`}>
                <div className="max-w-7xl mx-auto px-4 space-y-4">

                    {/* Top Row: Search & Store Dropdown */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search all offers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:border-[#ea580c] focus:ring-2 focus:ring-[#ea580c]/20 transition-all text-xs sm:text-sm font-bold text-slate-700 shadow-sm"
                            />
                        </div>

                        <div className="relative sm:min-w-[200px]" ref={storeDropdownRef}>
                            <button
                                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl hover:border-[#ea580c] transition-all font-bold text-slate-700 text-xs sm:text-sm shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <StoreIcon className="w-3 h-3 sm:w-4 sm:h-4 text-[#ea580c]" />
                                    <span>{filterChain}</span>
                                </div>
                                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-400 transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl transition-all z-50 py-2 max-h-[300px] overflow-y-auto ${isStoreDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                                {CHAINS.map(c => {
                                    const count = c === 'All Stores' ? offers.length : chainCounts[c] || 0;
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                setFilterChain(c);
                                                setIsStoreDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-5 py-2.5 text-sm font-bold transition-colors ${filterChain === c ? 'bg-[#fff7ed] text-[#ea580c]' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {filterChain === c && <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" />}
                                                <span>{c}</span>
                                            </div>
                                            {count > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${filterChain === c ? 'bg-[#ea580c] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Horizontal Scroll Categories */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar-on-mobile">
                        {CATEGORIES.map(cat => {
                            const count = cat === 'All' ? offers.length : categoryCounts[cat] || 0;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`whitespace-nowrap flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all border ${filterCategory === cat
                                        ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-md shadow-[#ea580c]/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#ea580c]/50 hover:bg-[#fff7ed]/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {cat}
                                    </div>
                                    {count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${filterCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── Masonry Offers Grid ─── */}
            <div className="max-w-7xl mx-auto px-4 mt-8 lg:mt-12">

                {/* Section Heading */}
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-[#ea580c]" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">All Active Offers</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">Discover the best deals near you</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#ea580c] rounded-full animate-spin mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Loading Offers...</p>
                    </div>
                ) : filteredOffers.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-200 border-dashed">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">No Offers Found</h3>
                        <p className="text-slate-500 font-medium max-w-sm">We couldn't find any current offers matching your specific filters and search criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setFilterChain('All Stores'); setFilterCategory('All'); }}
                            className="mt-8 px-6 py-3 bg-[#ea580c] text-white rounded-xl font-bold hover:bg-[#c2410c] transition-colors"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        <AnimatePresence mode="popLayout">
                            {filteredOffers.map((offer, idx) => {
                                const colors = getStoreColors(offer.chain);
                                // Determine a "random" height for the placeholder area based on index
                                const heights = ['h-32', 'h-40', 'h-48', 'h-56'];
                                const randomHeight = heights[idx % heights.length];

                                return (
                                    <motion.div
                                        layout
                                        key={`${offer.chain}-${offer.product_name}-${idx}`}
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.5) }} // Cap delay
                                        className={`break-inside-avoid ${colors.bg} rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${colors.border} ${colors.hover} flex flex-col group cursor-pointer`}
                                        onClick={() => setSelectedOfferForQuickView(offer)}
                                    >
                                        {/* Top Section / Image Area Placeholder */}
                                        <div className={`${randomHeight} ${colors.bg} relative flex items-center justify-center p-6 transition-colors`}>
                                            {/* Fallback pattern for when we don't have images */}
                                            <Tag className={`w-16 h-16 ${colors.accent} opacity-5 group-hover:opacity-10 transition-opacity`} />

                                            {/* Promo Badge */}
                                            <div className="absolute top-4 left-4">
                                                <span className={`inline-flex items-center justify-center px-3 py-1.5 ${colors.fill} text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-sm`}>
                                                    {offer.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
                                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                                <div className={`px-2 py-0.5 sm:px-2.5 sm:py-1 ${colors.bg} rounded-md text-[9px] sm:text-[10px] font-bold ${colors.accent} uppercase tracking-widest border ${colors.border}`}>
                                                    {offer.chain}
                                                </div>
                                                {(offer.category !== "Category" && offer.category) && (
                                                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 capitalize">
                                                        • {offer.category}
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-slate-800 leading-tight mb-1 sm:mb-2 line-clamp-2 text-sm sm:text-base">
                                                {offer.product_name}
                                            </h3>

                                            {offer.brand && (
                                                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mb-3 sm:mb-4">{offer.brand}</p>
                                            )}

                                            {/* Verification Tag */}
                                            {offer.original_price && (
                                                <div className={`flex items-center gap-1.5 mb-4 text-[10px] font-bold ${colors.accent} ${colors.bg} px-2 py-1 rounded-md w-fit`}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    <span>Verified KassalApp Price</span>
                                                </div>
                                            )}

                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                                                {offer.final_price ? (
                                                    <div>
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                                        <div className="flex items-baseline gap-1.5 sm:gap-2">
                                                            <p className={`text-xl sm:text-2xl font-black ${colors.accent}`}>{offer.final_price}<span className="text-xs sm:text-sm ml-0.5 sm:ml-1 text-slate-500 font-bold">{offer.currency || 'kr'}</span></p>
                                                            {offer.original_price && (
                                                                <p className="text-xs sm:text-sm font-bold text-slate-300 line-through decoration-slate-300 decoration-1 sm:decoration-2">
                                                                    {offer.original_price}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offer Type</p>
                                                        <p className={`text-base sm:text-lg font-black ${colors.accent} capitalize`}>{offer.discount_type.replace('_', ' ')}</p>
                                                    </div>
                                                )}

                                                <div className={`w-10 h-10 rounded-full bg-slate-50 ${colors.ghBg} flex items-center justify-center transition-colors shadow-sm`}>
                                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

        </div>
    );
}
