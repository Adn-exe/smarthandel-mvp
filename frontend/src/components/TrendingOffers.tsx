import { useState, useEffect } from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface BentoItem {
    id: string;
    images: string[];
    alt: string;
    chain: string;
    className: string;
    title: string;
    count: number;
}

function BentoCard({ item, idx }: { item: BentoItem; idx: number }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [cycleIndex, setCycleIndex] = useState(0);

    useEffect(() => {
        // Stagger the initial start of the cycle timer
        // Card 0 starts at 0, Card 1 after 3s, Card 2 after 6s
        const initialDelay = idx * 3000;

        let intervalTimer: any;

        const timer = setTimeout(() => {
            intervalTimer = setInterval(() => {
                setCycleIndex(prev => (prev + 1) % item.images.length);
            }, 10000 + (idx * 2000)); // Images stay for 10-14 seconds (Dynamic intervals)
        }, initialDelay);

        return () => {
            clearTimeout(timer);
            if (intervalTimer) clearInterval(intervalTimer);
        };
    }, [idx, item.images.length]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate('/offers', { state: { chain: item.chain } })}
            className={`relative group cursor-pointer overflow-hidden rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 bg-white border border-slate-100 ${item.className}`}
        >
            <div className="absolute inset-0">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={item.images[cycleIndex]}
                        src={item.images[cycleIndex]}
                        alt={item.alt}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end items-center text-center">
                <h3 className="text-xl font-black text-white leading-tight tracking-tight uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 drop-shadow-md">
                    {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    <span className="text-orange-400 underline decoration-orange-400/30 underline-offset-4">{t('common.viewAll', 'Se mer')}</span>
                </div>
            </div>


        </motion.div>
    );
}

export function TrendingOffers() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const bentoItems: BentoItem[] = [
        {
            id: 'featured',
            images: [
                '/assets/offers/bunpris/bunpris-banner-2.png',
                '/assets/offers/bunpris/bunpris-offer-2.png',
                '/assets/offers/bunpris/bunpris-offer-10.png',
                '/assets/offers/bunpris/bunpris-offer-15.png'
            ],
            alt: 'Bunpris Vinterfest',
            chain: 'BUNPRIS',
            className: 'md:col-span-2 md:row-span-2 min-h-[400px]',
            title: t('offers.bentoExclusive', 'Eksklusive Tilbud'),
            count: 19
        },
        {
            id: 'coop-1',
            images: [
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.21.55 AM.png',
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.22.35 AM.png',
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.23.04 AM.png',
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.23.29 AM.png',
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.24.08 AM.png'
            ],
            alt: 'Coop Marked Kampanje',
            chain: 'COOP Marked',
            className: 'md:col-span-1 md:row-span-1 min-h-[200px]',
            title: t('offers.bentoCoop', 'COOP Marked'),
            count: 26
        },
        {
            id: 'joker-1',
            images: [
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.26.29 PM.png',
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.29.23 PM.png',
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.29.45 PM.png',
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.30.17 PM.png'
            ],
            alt: 'Joker Tilbud',
            chain: 'Joker',
            className: 'md:col-span-1 md:row-span-1 min-h-[200px]',
            title: t('offers.bentoJoker', 'Joker Tilbud'),
            count: 31
        },
        {
            id: 'bunpris-2',
            images: [
                '/assets/offers/bunpris/bunpris-offer-1.png',
                '/assets/offers/bunpris/bunpris-offer-5.png',
                '/assets/offers/bunpris/bunpris-offer-8.png'
            ],
            alt: 'Bunpris Lokale Tilbud',
            chain: 'BUNPRIS',
            className: 'md:col-span-1 md:row-span-1 min-h-[200px]',
            title: 'Lokale Deals',
            count: 14
        },
        {
            id: 'joker-large',
            images: [
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.30.07 PM.png',
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.31.01 PM.png',
                '/assets/offers/Joker/Screenshot 2026-03-04 at 7.32.13 PM.png'
            ],
            alt: 'Joker Ukens Favoritter',
            chain: 'Joker',
            className: 'md:col-span-1 md:row-span-1 min-h-[200px]',
            title: 'Ukens Favoritter',
            count: 22
        },
        {
            id: 'coop-2',
            images: [
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.23.12 AM.png',
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.23.50 AM.png',
                '/assets/offers/Coop Marked/Screenshot 2026-03-04 at 12.24.55 AM.png'
            ],
            alt: 'COOP Marked Helgekupp',
            chain: 'COOP Marked',
            className: 'md:col-span-1 md:row-span-1 min-h-[200px]',
            title: 'Helgekupp',
            count: 18
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    if (loading) {
        return (
            <div className="mt-14 max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-[500px] bg-slate-100 animate-pulse rounded-[2.5rem]" />
                <div className="space-y-6">
                    <div className="h-[238px] bg-slate-100 animate-pulse rounded-[2.5rem]" />
                    <div className="h-[238px] bg-slate-100 animate-pulse rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    return (
        <section className="w-full mt-14 max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-dark tracking-tight uppercase leading-none">
                            {t('offers.trendingTitle', 'Aktive Kampanjer')}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                            {t('offers.trendingSubtitle', 'Sanntidsoppdaterte tilbud fra dine butikker')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/offers')}
                    className="group flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-dark transition-colors"
                >
                    {t('offers.seeAll')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto"
            >
                {bentoItems.map((item, idx) => (
                    <BentoCard key={item.id} item={item} idx={idx} />
                ))}
            </motion.div>
        </section>
    );
}
