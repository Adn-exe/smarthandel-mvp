import { memo, useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ShoppingCart, Info, TrendingUp, ShoppingBag, Navigation, ChevronRight, CheckCircle2, AlertCircle, ExternalLink, Plus, Minus, Flag, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { ReportModal } from './ReportModal';
import { formatDistance } from '../utils/format';
import { useTranslation } from 'react-i18next';
import type { Store as StoreType, ProductWithPrice } from '../types';
import { getProductFallback, isImageFallback } from '../utils/productIcons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';



interface StoreCardProps {
    store: StoreType;
    items: ProductWithPrice[];
    totalCost: number;
    distance: number;
    selected?: boolean;
    onSelect?: () => void;
    variant?: 'default' | 'detailed' | 'comparison';
    reasoningTag?: string;
    totalRequestedItems?: number;
    efficiencyTags?: string[];
    userLocation?: { lat: number; lng: number } | null;
    highlightBorder?: 'red' | 'blue' | 'grey' | 'light-red';
    indexBadge?: number;
    showItemCount?: boolean;
    hidePdfButton?: boolean;
}

export const StoreCard = memo(function StoreCard({
    store,
    items,
    distance,
    selected = false,
    onSelect,
    variant = 'default',
    reasoningTag,
    totalRequestedItems,
    efficiencyTags = [],
    userLocation,
    highlightBorder,
    indexBadge,
    showItemCount,
    hidePdfButton
}: StoreCardProps) {
    const { t, i18n } = useTranslation();
    const [localQuantities, setLocalQuantities] = useState<Record<string | number, number>>(() =>
        items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
    );

    // Reporting State
    const [reportingItem, setReportingItem] = useState<{
        storeId: string;
        storeName: string;
        itemId: string | number;
        itemName: string;
        requestedName?: string;
    } | null>(null);
    const [reportedItems, setReportedItems] = useState<Set<string>>(new Set());
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 11));
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const [showLanguageSelect, setShowLanguageSelect] = useState(false);

    const handleDownloadPDF = (targetLang: 'en' | 'no' = 'en') => {
        setShowLanguageSelect(false);
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString(targetLang === 'no' ? 'no-NO' : 'en-GB');

        // Helper for translation based on selected language
        const pdfT = (key: string, options?: any) => {
            return i18n.getFixedT(targetLang)(key, options);
        };

        // 1. Header Section
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(store.name, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(`${store.chain} • ${formatDistance(distance)}`, 14, 30);
        doc.text(store.address, 14, 35);
        doc.text(timestamp, 196, 22, { align: 'right' });

        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(14, 40, 196, 40);

        // 2. Table Section
        const tableData = items.map(item => {
            const qty = localQuantities[item.id] || item.quantity;
            const lineTotal = item.price * qty;
            return [
                item.name,
                `${qty}x`,
                `${item.price.toFixed(2)} NOK`,
                `${lineTotal.toFixed(2)} NOK`
            ];
        });

        autoTable(doc, {
            startY: 50,
            head: [[
                pdfT('storeCard.product'),
                pdfT('storeCard.qty'),
                pdfT('storeCard.unitPrice'),
                pdfT('storeCard.total')
            ]],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [37, 99, 235], // Blue-600
                textColor: 255,
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: 51
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 20, halign: 'center' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 35, halign: 'right' }
            },
            margin: { top: 50 }
        });

        // 3. Summary Section
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`${pdfT('common.total')}: ${currentTotalCost.toFixed(2)} NOK`, 196, finalY, { align: 'right' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.setFont('helvetica', 'normal');
        doc.text('SmartHandel - Your Smart Grocery Assistant', 105, 285, { align: 'center' });

        // Save file
        const fileName = `${store.name.replace(/\s+/g, '_')}_Shopping_List.pdf`;
        doc.save(fileName);
    };

    // Sync state if initial items change
    useEffect(() => {
        setLocalQuantities(items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {}));
    }, [items]);

    const handleIncrement = (itemId: string | number) => {
        setLocalQuantities(prev => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + 1
        }));
    };

    const handleDecrement = (itemId: string | number) => {
        setLocalQuantities(prev => ({
            ...prev,
            [itemId]: Math.max(1, (prev[itemId] || 1) - 1)
        }));
    };

    const [hoveredItemId, setHoveredItemId] = useState<string | number | null>(null);
    const [isItemsExpanded, setIsItemsExpanded] = useState(false);
    const MOBILE_ITEMS_LIMIT = 3;

    const currentTotalCost = useMemo(() => {
        return items.reduce((acc, item) => {
            const qty = localQuantities[item.id] || item.quantity;
            return acc + (item.price * qty);
        }, 0);
    }, [items, localQuantities]);

    const handleReportSubmit = async (reason: string, note: string) => {
        if (!reportingItem) return;

        try {
            await api.submitReport({
                store_id: reportingItem.storeId,
                store_name: reportingItem.storeName,
                requested_item_name: reportingItem.requestedName || reportingItem.itemName,
                matched_item_name: reportingItem.itemName,
                matched_item_id: String(reportingItem.itemId),
                report_reason: reason,
                optional_note: note,
                session_id: sessionId
            });

            setReportedItems(prev => new Set([...prev, `${reportingItem.storeId}_${reportingItem.itemId}`]));
            // Let the modal handle its own closure to show success state
        } catch (error) {
            console.error('Failed to submit report:', error);
            throw error;
        }
    };

    // Format currency
    const formatPriceParts = useMemo(() => {
        const locale = i18n.language.startsWith('no') ? 'no-NO' : 'en-GB';
        const formatter = new Intl.NumberFormat(locale, {
            style: 'decimal',
            maximumFractionDigits: 0
        });
        return (price: number) => ({
            amount: formatter.format(price),
            currency: 'NOK'
        });
    }, [i18n.language]);

    const isDetailed = variant === 'detailed';
    const isComparison = variant === 'comparison';

    // Calculate stock status
    const stockStatus = useMemo(() => {
        if (!totalRequestedItems) return null;
        const foundCount = items.length;
        const isFullStock = foundCount === totalRequestedItems;

        // Custom text for Smart Route stops (or whenever showItemCount is true)
        if (showItemCount) {
            return {
                isFull: true, // Use green color
                text: t('storeCard.itemCount', { count: foundCount, defaultValue: `${foundCount} items` }),
                icon: ShoppingBag
            };
        }

        return {
            isFull: isFullStock,
            text: isFullStock
                ? t('storeCard.fullStock', 'Full Stock')
                : t('storeCard.missingItems', { count: totalRequestedItems - foundCount }),
            icon: isFullStock ? CheckCircle2 : AlertCircle
        };
    }, [items.length, totalRequestedItems, t, showItemCount]);

    const googleMapsUrl = useMemo(() => {
        const baseUrl = "https://www.google.com/maps/dir/?api=1";
        const destination = `&destination=${store.location.lat},${store.location.lng}`;
        const origin = userLocation ? `&origin=${userLocation.lat},${userLocation.lng}` : "";
        return `${baseUrl}${origin}${destination}&travelmode=driving`;
    }, [store.location, userLocation]);

    const isCheapest = efficiencyTags.some(t => t.toLowerCase().includes('cheapest'));

    // Render the new "Scandinavian Minimal" Default Variant
    if (!isDetailed && !isComparison) {
        return (
            <>
                <div
                    onClick={(e) => {
                        // Prevent triggering selection/expansion when clicking directions button
                        if ((e.target as HTMLElement).closest('button')) {
                            return;
                        }
                        onSelect?.();
                        setIsItemsExpanded(!isItemsExpanded);
                    }}
                    className={clsx(
                        "relative w-full rounded-[16px] border transition-all duration-200 cursor-pointer group select-none",
                        // Default State styling
                        !highlightBorder && "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200",
                        // Custom Border Highlighting
                        highlightBorder === 'red' && "border-2 border-primary shadow-md ring-1 ring-primary/10",
                        highlightBorder === 'light-red' && "border-2 border-red-200 shadow-sm bg-red-50/10",
                        highlightBorder === 'blue' && "border-2 border-secondary shadow-md ring-1 ring-secondary/10",
                        highlightBorder === 'grey' && "border border-gray-300 shadow-sm bg-gray-50/10",
                        // Highlighted "Best / Cheapest" State
                        isCheapest && !highlightBorder && "bg-blue-50/30 border-blue-500 shadow-md ring-1 ring-blue-500/20"
                    )}
                >
                    {/* Index Badge for Alternatives */}
                    {indexBadge && (
                        <div className="absolute -left-[1px] -top-[1px] w-8 h-8 rounded-br-2xl bg-gray-900 text-white flex items-center justify-center font-black text-xs z-10 shadow-sm border-r border-b border-gray-100/10 rounded-tl-[16px]">
                            {indexBadge}
                        </div>
                    )}

                    {/* 1. Top Zone: Badge + Price */}
                    <div className="flex justify-between items-start px-4 pt-4 md:px-5 md:pt-5 pl-10"> {/* Added padding-left to avoid overlap if badge exists */}
                        {/* Badge Pill */}
                        <div className="flex gap-2">
                            {efficiencyTags.map((tag, idx) => (
                                <div key={idx} className={clsx(
                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2 shadow-sm border",
                                    tag.toLowerCase().includes('cheapest') ? "bg-green-100 text-green-700 border-green-200" :
                                        tag.toLowerCase().includes('closest') ? "bg-amber-100 text-amber-700 border-amber-200" :
                                            tag.toLowerCase().includes('stop') ? "bg-blue-100 text-blue-700 border-blue-200 font-extrabold" :
                                                "bg-gray-100 text-gray-600 border-gray-200"
                                )}>
                                    {tag}
                                </div>
                            ))}
                        </div>

                        {/* Price - LARGE & BLUE */}
                        <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1">
                                <span className="text-2xl md:text-3xl font-black text-blue-600 tracking-tight leading-none">
                                    {formatPriceParts(currentTotalCost).amount}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">NOK</span>
                            </div>
                            {reasoningTag && (
                                <div className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-md inline-block mt-1 font-medium border border-red-100">
                                    {reasoningTag}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Language Selection Popup */}
                    {showLanguageSelect && (
                        <div
                            className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm rounded-[16px] flex items-center justify-center p-6 animate-in fade-in duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xl max-w-xs w-full text-center">
                                <h4 className="font-bold text-slate-900 mb-2">{t('storeCard.selectLanguage')}</h4>
                                <p className="text-xs text-slate-500 mb-4">{t('storeCard.chooseLanguageDesc')}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleDownloadPDF('en')}
                                        className="py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold border border-slate-200 hover:border-indigo-100 transition-all"
                                    >
                                        🇺🇸 English
                                    </button>
                                    <button
                                        onClick={() => handleDownloadPDF('no')}
                                        className="py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold border border-slate-200 hover:border-indigo-100 transition-all"
                                    >
                                        🇳🇴 Norsk
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowLanguageSelect(false)}
                                    className="mt-4 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. Middle Zone: Store Info */}
                    <div className="px-4 pb-4 md:px-5 md:pb-5 mt-2">
                        <h3 className="font-bold text-dark text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                            {store.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                            <div className="flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                {formatDistance(distance)}
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                            <div>{store.chain}</div>
                        </div>
                    </div>

                    {/* 3. Bottom Zone: Action Footer (Directions & Stock) */}
                    <div className={clsx(
                        "mt-auto px-4 py-3 md:px-5 md:py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4",
                        !isItemsExpanded && "rounded-b-[16px]"
                    )}>
                        {/* Left: Action Group */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(googleMapsUrl, '_blank');
                                }}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-dark border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all group/btn"
                            >
                                <MapPin className="w-3.5 h-3.5 text-blue-500 group-hover/btn:scale-110 transition-transform" />
                                {t('storeCard.getDirections', 'Get Directions')}
                            </button>

                            {!hidePdfButton && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowLanguageSelect(true); }}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-slate-500 border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:shadow transition-all"
                                >
                                    <Download className="w-3.5 h-3.5 text-blue-500" />
                                    {t('storeCard.downloadPdf')}
                                </button>
                            )}
                        </div>

                        {/* Right: Stock Status & Expand Chevron */}
                        <div className="flex items-center gap-3">
                            {stockStatus && (
                                <div className={clsx(
                                    "flex items-center gap-1.5 text-xs font-bold",
                                    stockStatus.isFull ? "text-green-600" : "text-amber-600"
                                )}>
                                    <stockStatus.icon className="w-3.5 h-3.5" />
                                    <span>{stockStatus.text}</span>
                                </div>
                            )}
                            <ChevronRight className={clsx(
                                "w-4 h-4 text-gray-400 transition-transform duration-300",
                                isItemsExpanded ? "-rotate-90" : "rotate-90 md:rotate-0"
                            )} />
                        </div>
                    </div>

                    {/* Expanded Items List */}
                    {
                        isItemsExpanded && (
                            <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-gray-50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-4">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center gap-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                {/* Product Image */}
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {item.image_url && !failedImages.has(String(item.id)) ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            className="w-full h-full object-contain p-1"
                                                            onError={() => setFailedImages(prev => new Set(prev).add(String(item.id)))}
                                                        />
                                                    ) : (
                                                        <>
                                                            {isImageFallback(getProductFallback(item.name)) ? (
                                                                <img
                                                                    src={getProductFallback(item.name)}
                                                                    alt=""
                                                                    className="w-full h-full object-contain p-1 opacity-80"
                                                                />
                                                            ) : (
                                                                <span className="text-xl md:text-2xl" role="img" aria-label={item.name}>
                                                                    {getProductFallback(item.name)}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                </div>


                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.name}
                                                        </p>
                                                        {!reportedItems.has(`${store.id}_${String(item.id)}`) ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReportingItem({
                                                                        storeId: String(store.id),
                                                                        storeName: store.name,
                                                                        itemId: item.id,
                                                                        itemName: item.name,
                                                                        requestedName: item.originalQueryName
                                                                    });
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors group/report"
                                                                title={t('common.reportIssue', 'Report issue')}
                                                            >
                                                                <Flag className="w-3 h-3 text-gray-300 group-hover/report:text-red-400" />
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center text-green-500" title={t('report.submitted', 'Report submitted')}>
                                                                <CheckCircle2 className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center bg-gray-50 rounded-md p-0.5 border border-gray-100 shrink-0 w-fit mt-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDecrement(String(item.id)); }}
                                                            className="p-1 hover:bg-white rounded transition-all"
                                                        >
                                                            <Minus className="w-2.5 h-2.5 text-gray-400" />
                                                        </button>
                                                        <span className="px-1.5 text-[9px] font-black text-dark min-w-[18px] text-center">
                                                            {(localQuantities[String(item.id)] || item.quantity)}x
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleIncrement(String(item.id)); }}
                                                            className="p-1 hover:bg-white rounded transition-all"
                                                        >
                                                            <Plus className="w-2.5 h-2.5 text-gray-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).amount}
                                                    <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">
                                                        {formatPriceParts(item.price).currency}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                </div >
                {
                    reportingItem && (
                        <ReportModal
                            isOpen={!!reportingItem}
                            onClose={() => setReportingItem(null)}
                            onSubmit={handleReportSubmit}
                            itemName={reportingItem.itemName}
                        />
                    )
                }

            </>
        );
    }

    // Detailed & Comparison Variants (Retaining existing or minimal updates for consistency)
    return (
        <div
            onClick={onSelect}
            className={clsx(
                "relative rounded-xl md:rounded-2xl border transition-all duration-300 bg-white",
                onSelect ? "cursor-pointer md:hover:shadow-xl md:hover:-translate-y-1" : "",
                selected ? "border-primary ring-2 ring-primary/10 shadow-lg md:shadow-xl" : "border-gray-100 shadow-sm",
                isDetailed ? "p-4 md:p-6" : "p-4 md:p-5"
            )}
        >
            {/* Efficiency & Reasoning Badges */}
            <div className="absolute top-0 right-0 flex flex-col items-end">
                {reasoningTag && (
                    <div className="bg-primary text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-1 rounded-bl-lg md:rounded-bl-xl shadow-sm uppercase tracking-widest">
                        {reasoningTag}
                    </div>
                )}
                {efficiencyTags.map((tag, idx) => (
                    <div
                        key={idx}
                        className="mt-1 bg-indigo-600/90 text-white text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-l-md md:rounded-l-lg shadow-sm uppercase tracking-tighter"
                    >
                        {tag}
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-start mb-2 md:mb-3 pr-16 md:pr-20">
                <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-black text-dark text-base md:text-lg leading-tight flex items-center gap-1.5 md:gap-2">
                        <span className="text-xl md:text-2xl shrink-0">🏣</span>
                        <span className="text-primary truncate">{store.name}</span>
                    </h3>
                </div>
            </div>

            {/* Status Row: Stock Info */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                {/* Stock Status */}
                {stockStatus && (
                    <div className={clsx(
                        "flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-tighter",
                        stockStatus.isFull
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                    )}>
                        <stockStatus.icon className="w-2.5 h-2.5" />
                        {stockStatus.text}
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between mb-4 md:mb-5">
                <div>
                    <div className="flex items-baseline gap-1 md:gap-1.5">
                        <span className="text-2xl md:text-3xl font-black text-dark tracking-tighter md:tracking-tight">
                            {formatPriceParts(currentTotalCost).amount}
                        </span>
                        <span className="text-xs md:text-sm font-bold text-gray-400">
                            {formatPriceParts(currentTotalCost).currency}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <Navigation className="w-3 h-3 md:w-3.5 md:h-3.5" />
                        {formatDistance(distance)}
                    </div>
                </div>
            </div>

            {/* Price History / Trend Indicator (New) */}
            {items.some(i => i.priceHistory) && (
                <div className="mb-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                    <TrendingUp className="w-3 h-3" />
                    <span>Price history available</span>
                </div>
            )}

            {/* Items List */}
            {(isDetailed || isComparison) && (
                <div className="mt-3 md:mt-4 border-t border-gray-100 pt-3 md:pt-4">
                    <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3" />
                        {t('storeCard.yourCartItems')}
                    </h4>
                    <div className="space-y-3 md:space-y-4">
                        {items
                            .slice(0, !isItemsExpanded && items.length > MOBILE_ITEMS_LIMIT ? MOBILE_ITEMS_LIMIT : undefined)
                            .map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start gap-2">
                                    <div className="flex items-start gap-2 md:gap-3 min-w-0 flex-1">
                                        {item.image_url && !failedImages.has(String(item.id)) ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white rounded-lg border border-gray-50 p-0.5 shrink-0"
                                                loading="lazy"
                                                onError={() => {
                                                    setFailedImages(prev => new Set(prev).add(String(item.id)));
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                                {isImageFallback(getProductFallback(item.name)) ? (
                                                    <img
                                                        src={getProductFallback(item.name)}
                                                        alt=""
                                                        className="w-7 h-7 md:w-8 md:h-8 object-contain opacity-70"
                                                    />
                                                ) : (
                                                    <span className="text-xl md:text-2xl" role="img" aria-label={item.name}>
                                                        {getProductFallback(item.name)}
                                                    </span>
                                                )}
                                            </div>
                                        )}


                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2">
                                                <div className="flex items-center bg-gray-50 md:bg-gray-50/50 rounded-xl md:rounded-lg p-1 md:p-0.5 border border-gray-100 md:border-gray-100/50 shrink-0 w-fit">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDecrement(String(item.id)); }}
                                                        className="p-2 md:p-1 hover:bg-white rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Minus className="w-3.5 h-3.5 md:w-2.5 md:h-2.5 text-gray-400 hover:text-primary" />
                                                    </button>
                                                    <span className="px-2 md:px-1.5 text-xs md:text-[10px] font-black text-dark min-w-[24px] md:min-w-[20px] text-center">
                                                        {(localQuantities[String(item.id)] || item.quantity)}x
                                                    </span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleIncrement(String(item.id)); }}
                                                        className="p-2 md:p-1 hover:bg-white rounded-lg transition-all active:scale-90"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 md:w-2.5 md:h-2.5 text-gray-400 hover:text-primary" />
                                                    </button>
                                                </div>
                                                <div className="min-w-0 flex-1 relative flex items-center gap-2">
                                                    <p
                                                        className="font-bold text-dark text-xs md:text-sm leading-snug hover:text-primary transition-colors cursor-help truncate"
                                                        onMouseEnter={() => setHoveredItemId(item.id)}
                                                        onMouseLeave={() => setHoveredItemId(null)}
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </p>

                                                    {/* Report Button */}
                                                    {!reportedItems.has(`${store.id}_${String(item.id)}`) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setReportingItem({
                                                                    storeId: String(store.id),
                                                                    storeName: store.name,
                                                                    itemId: item.id,
                                                                    itemName: item.name,
                                                                    requestedName: item.originalQueryName || item.englishName
                                                                });
                                                            }}
                                                            className="p-2 md:p-1 hover:bg-orange-50 rounded-lg text-gray-300 hover:text-orange-500 transition-all active:scale-95 group/report shrink-0"
                                                            title={t('report.title', 'Report item issue')}
                                                        >
                                                            <Flag className="w-3.5 h-3.5 md:w-3 md:h-3 group-hover/report:fill-current" />
                                                        </button>
                                                    )}
                                                    {reportedItems.has(`${store.id}_${String(item.id)}`) && (
                                                        <div className="flex items-center text-green-500" title={t('report.submitted', 'Report submitted')}>
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </div>
                                                    )}

                                                    {item.englishName && hoveredItemId === item.id && (
                                                        <div
                                                            className="absolute bottom-full left-0 mb-2 pointer-events-none z-[100] hidden md:block"
                                                            style={{ animation: 'reveal 0.2s ease-out' }}
                                                        >
                                                            <div className="bg-dark text-white text-[11px] font-bold px-3 py-2 rounded-lg shadow-2xl whitespace-nowrap flex items-center gap-2">
                                                                <span className="text-emerald-400 text-[9px] font-black bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">EN</span>
                                                                {item.englishName}
                                                            </div>
                                                            <div className="w-2 h-2 bg-dark rotate-45 -mt-1 ml-4"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-baseline gap-0.5 md:gap-1">
                                            <span className="font-bold text-dark text-xs md:text-sm leading-none">
                                                {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).amount}
                                            </span>
                                            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">
                                                {formatPriceParts(item.price * (localQuantities[item.id] || item.quantity)).currency}
                                            </span>
                                        </div>
                                        {(localQuantities[item.id] || item.quantity) > 1 && (
                                            <span className="text-[9px] md:text-[10px] text-gray-400 block mt-0.5 font-bold">
                                                {formatPriceParts(item.price).amount} / stk
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Mobile: Show more / less toggle */}
                    {items.length > MOBILE_ITEMS_LIMIT && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsItemsExpanded(prev => !prev); }}
                            className="md:hidden mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-black text-primary bg-primary/5 rounded-xl border border-primary/10 active:scale-95 transition-all"
                        >
                            {isItemsExpanded ? (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                                    Show less
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                    Show all {items.length} items
                                </>
                            )}
                        </button>
                    )}

                    {items.length === 0 && (
                        <p className="text-sm text-gray-400 italic">{t('storeCard.noItemsFound')}</p>
                    )}
                </div>
            )}

            {/* Action Footer (Only for Detailed/Comparison - Default variant uses new footer) */}
            {(isDetailed || isComparison) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-black text-indigo-700 bg-indigo-50 px-4 py-2.5 md:px-3 md:py-1.5 rounded-xl md:rounded-lg shadow-sm active:scale-95 transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-3.5 h-3.5 md:w-3 md:h-3" />
                        {t('storeCard.getDirections')}
                    </a>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowLanguageSelect(true); }}
                            className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2.5 md:px-3 md:py-1.5 rounded-xl md:rounded-lg transition-all active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5 md:w-3 md:h-3" />
                            {t('storeCard.downloadPdf')}
                        </button>

                        {selected && !isDetailed && (
                            <button className="flex items-center text-sm font-medium text-primary hover:text-red-700 transition-colors">
                                {t('storeCard.viewDetails')} <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Comparison Badge */}
            {isComparison && items.some(i => i.price === 0) && (
                <div className="mt-3 flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{t('storeCard.missingItemsWarning')}</p>
                </div>
            )}
            {reportingItem && (
                <ReportModal
                    isOpen={!!reportingItem}
                    onClose={() => setReportingItem(null)}
                    onSubmit={handleReportSubmit}
                    itemName={reportingItem.itemName}
                />
            )}
        </div>
    );
});
