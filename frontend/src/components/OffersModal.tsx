import { useEffect, useCallback, useState } from 'react';
import { X, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface Offer {
    product_name: string;
    product_name_en: string;
    discount_type: 'percentage' | 'fixed_price' | 'multi_buy';
    discount_percent?: number;
    discount_value?: string;
    final_price?: number;
    currency?: string;
    label: string;
    unit_info?: string;
    unit?: string;
    brand?: string;
    chain: string;
    additional_cost?: string;
}

const POSTERS = [
    { id: 2, src: '/assets/offers/bunpris/bunpris-banner-2.png', alt: 'Billig Middag – Kampanje' },
    { id: 3, src: '/assets/offers/bunpris/bunpris-offer-1.png', alt: 'Bunpris Super Tilbud' },
    { id: 4, src: '/assets/offers/bunpris/bunpris-offer-2.png', alt: 'Bunpris Ukens kupp' },
    { id: 5, src: '/assets/offers/bunpris/bunpris-offer-3.png', alt: 'Bunpris Vinter Fest' },
    { id: 6, src: '/assets/offers/bunpris/bunpris-offer-4.png', alt: 'Bunpris Tilbud' },
    { id: 7, src: '/assets/offers/bunpris/bunpris-offer-5.png', alt: 'Bunpris Kampanjepriser' },
    { id: 8, src: '/assets/offers/bunpris/bunpris-offer-6.png', alt: 'Bunpris Sesongens beste' },
    { id: 9, src: '/assets/offers/bunpris/bunpris-offer-7.png', alt: 'Bunpris God deal' },
    { id: 10, src: '/assets/offers/bunpris/bunpris-offer-8.png', alt: 'Bunpris Topp tilbud' },
    { id: 11, src: '/assets/offers/bunpris/bunpris-offer-9.png', alt: 'Bunpris Hverdagsglede' },
    { id: 12, src: '/assets/offers/bunpris/bunpris-offer-10.png', alt: 'Bunpris Smarthandel favoritter' },
    { id: 13, src: '/assets/offers/bunpris/bunpris-offer-11.png', alt: 'Bunpris Pris-fest' },
    { id: 14, src: '/assets/offers/bunpris/bunpris-offer-12.png', alt: 'Bunpris Ukens utvalgte' },
    { id: 15, src: '/assets/offers/bunpris/bunpris-offer-13.png', alt: 'Bunpris Middag' },
    { id: 16, src: '/assets/offers/bunpris/bunpris-offer-14.png', alt: 'Bunpris Friske tilbud' },
    { id: 17, src: '/assets/offers/bunpris/bunpris-offer-15.png', alt: 'Bunpris Favoritter' },
    { id: 18, src: '/assets/offers/bunpris/bunpris-offer-16.png', alt: 'Bunpris Helgekos' },
    { id: 19, src: '/assets/offers/bunpris/bunpris-offer-17.png', alt: 'Bunpris Kveldskos' },
    { id: 20, src: '/assets/offers/bunpris/bunpris-offer-18.png', alt: 'Bunpris Storhandel' }
];



export function OffersModal({ isOpen, onClose }: OffersModalProps) {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleClose = useCallback(() => {
        setSelectedImage(null);
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selectedImage) setSelectedImage(null);
                else handleClose();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, selectedImage, handleClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4" style={{ pointerEvents: 'auto' }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full h-[100dvh] sm:h-[90vh] sm:max-w-6xl flex flex-col bg-slate-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
                    >
                        {/* ─── Premium Header ─── */}
                        <div className="flex-none bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 sm:px-10 py-5 sm:py-7 z-20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                        <Flame className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-dark tracking-tighter leading-none">
                                            {t('offers.title')}
                                        </h2>
                                        <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                            Bunpris Eksklusive Kuponger • 19 stk
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-dark transition-all duration-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* ─── Pinterest Masonry Gallery ─── */}
                        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 sm:py-10 bg-slate-50 custom-scrollbar">
                            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                                {POSTERS.map((poster, idx) => (
                                    <motion.div
                                        key={poster.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedImage(poster.src)}
                                        className="break-inside-avoid group cursor-zoom-in relative bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-200/60"
                                    >
                                        <img
                                            src={poster.src}
                                            alt={poster.alt}
                                            className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        {/* Hover Overlay - Simplified to just a subtle gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-dark/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                    </motion.div>
                                ))}
                            </div>

                            <div className="h-10" />
                        </div>
                    </motion.div>

                    {/* ─── Lightbox / Zoom Overlay ─── */}
                    <AnimatePresence>
                        {selectedImage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-10 pointer-events-auto"
                            >
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                                    onClick={() => setSelectedImage(null)}
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className="relative max-w-5xl max-h-full w-full flex flex-col items-center justify-center pointer-events-none"
                                >
                                    <img
                                        src={selectedImage}
                                        alt="Zoomed Poster"
                                        className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-2xl pointer-events-auto cursor-zoom-out"
                                        onClick={() => setSelectedImage(null)}
                                    />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="mt-6 sm:mt-8 px-8 py-3 bg-white text-dark rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all pointer-events-auto shadow-xl"
                                    >
                                        Lukk visning
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </AnimatePresence>
    );
}

// Update Interface to match new usage
interface OffersModalProps {
    isOpen: boolean;
    onClose: () => void;
}
