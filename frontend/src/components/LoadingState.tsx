import { clsx } from 'clsx';
import { Search, Map, ShoppingBag, ShoppingBasket, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingProps {
    message?: string;
    className?: string;
}

/**
 * Dynamic Loading State - Multi-phase AI experience
 */

// Custom "Scanner inside a Box" Animation
const ScannerBoxAnimation = ({ className }: { className?: string }) => (
    <div className={clsx("relative flex items-center justify-center overflow-hidden h-16 w-16", className)}>
        {/* The Box/Basket */}
        <ShoppingBasket className="w-12 h-12 text-primary" />

        {/* The Scanner Line */}
        <div className="absolute top-0 w-full h-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[scan_1.5s_linear_infinite]"
            style={{ animationName: 'scan' }}
        />
        <style>{`
            @keyframes scan {
                0% { top: 0%; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
        `}</style>
    </div>
);

export function DynamicLoading({ step, className }: { step: 'comparing' | 'optimizing' | 'locating', className?: string }) {
    const { t } = useTranslation();

    const steps = [
        { id: 'locating', label: t('common.locating_you'), icon: Map, color: 'text-blue-500', bg: 'bg-blue-500' },
        { id: 'comparing', label: t('common.comparing'), icon: Search, color: 'text-primary', bg: 'bg-primary' },
        { id: 'optimizing', label: t('common.finding_best_route'), icon: ShoppingBag, color: 'text-secondary', bg: 'bg-secondary' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);
    const active = steps[currentStepIndex] || steps[1];

    return (
        <div className={clsx("flex flex-col items-center justify-center p-12 text-center min-h-[400px]", className)}>

            {/* Central Main Message */}
            <div className="space-y-4 max-w-sm mx-auto mt-8 animate-reveal">
                <div className="h-16 flex items-center justify-center">
                    {step === 'locating' && (
                        <Map className="w-16 h-16 text-blue-500 animate-pulse" />
                    )}
                    {step === 'comparing' && (
                        <ScannerBoxAnimation />
                    )}
                    {step === 'optimizing' && (
                        <ShoppingBag className="w-16 h-16 text-secondary animate-bounce" />
                    )}
                </div>
                <h3 className="text-2xl font-bold text-dark">
                    {active.label}
                </h3>
                <p className="text-gray-500 animate-pulse">
                    SmartHandel AI is working on it...
                </p>
            </div>
        </div>
    );
}

/**
 * Loading state for product search - Premium AI Scanner
 */
export function SearchLoading({ className }: LoadingProps) {
    return <DynamicLoading step="comparing" className={className} />;
}

/**
 * Loading state for route optimization - Smart Path
 */
export function RouteLoading({ className }: LoadingProps) {
    return <DynamicLoading step="optimizing" className={className} />;
}

/**
 * Skeleton for StoreCard
 */
export function StoreCardSkeleton() {
    return (
        <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                        <div className="h-3 w-32 bg-gray-100 rounded"></div>
                    </div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
        </div>
    );
}

/**
 * Skeleton for Map
 */
export function MapSkeleton() {
    return (
        <div className="w-full h-[300px] md:h-[400px] rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
        </div>
    );
}

/**
 * Skeleton for ResultsDisplay
 */
export function ResultsDisplaySkeleton() {
    return (
        <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-64 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-10 w-96 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm h-[400px] animate-pulse">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-24 bg-gray-100 rounded-xl"></div>
                        <div className="h-24 bg-gray-100 rounded-xl"></div>
                        <div className="h-24 bg-gray-100 rounded-xl"></div>
                    </div>
                </div>
                <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm h-[400px] animate-pulse">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-24 bg-gray-100 rounded-xl"></div>
                        <div className="h-24 bg-gray-100 rounded-xl"></div>
                        <div className="h-24 bg-gray-100 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
