import { clsx } from 'clsx';
import { Search, Map, ShoppingBag, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingProps {
    message?: string;
    className?: string;
}

/**
 * Dynamic Loading State - Multi-phase AI experience
 */
// Custom animated icons
const RadarIcon = ({ className }: { className?: string }) => (
    <div className={clsx("relative flex items-center justify-center", className)}>
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>
        <Map className="relative z-10 w-8 h-8 text-white" />
    </div>
);

const ScanningIcon = ({ className }: { className?: string }) => (
    <div className={clsx("relative", className)}>
        <Search className="w-8 h-8 text-white animate-[spin_3s_linear_infinite]" />
    </div>
);

const BouncingBagIcon = ({ className }: { className?: string }) => (
    <ShoppingBag className={clsx("w-8 h-8 text-white animate-bounce", className)} />
);

export function DynamicLoading({ step, className }: { step: 'comparing' | 'optimizing' | 'locating', className?: string }) {
    const { t } = useTranslation();

    const steps = [
        { id: 'locating', label: t('common.locating_you'), icon: RadarIcon, color: 'text-blue-500', bg: 'bg-blue-500' },
        { id: 'comparing', label: t('common.comparing'), icon: ScanningIcon, color: 'text-primary', bg: 'bg-primary' },
        { id: 'optimizing', label: t('common.finding_best_route'), icon: BouncingBagIcon, color: 'text-secondary', bg: 'bg-secondary' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);
    const active = steps[currentStepIndex] || steps[1];

    return (
        <div className={clsx("flex flex-col items-center justify-center p-12 text-center min-h-[400px]", className)}>
            <div className="relative w-full max-w-md mb-16">
                {/* Progress Bar Container */}
                <div className="absolute top-8 left-0 w-full h-1 bg-gray-100 rounded-full z-0"></div>

                {/* Active Progress Fill */}
                <div
                    className="absolute top-8 left-0 h-1 rounded-full z-0 transition-all duration-700 ease-out"
                    style={{
                        width: `${((currentStepIndex) / (steps.length - 1)) * 100}%`,
                        background: 'linear-gradient(90deg, #FF4757, #2EC4B6)'
                    }}
                ></div>

                {/* Steps */}
                <div className="relative z-10 flex justify-between w-full">
                    {steps.map((s, idx) => {
                        const isCompleted = idx <= currentStepIndex;
                        const isActive = idx === currentStepIndex;
                        // const Icon = s.icon; // Removed simple icon reference

                        return (
                            <div key={s.id} className="flex flex-col items-center gap-4 relative">
                                <div
                                    className={clsx(
                                        "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 border-4 bg-white z-10",
                                        isActive ? "scale-110 shadow-lg border-white ring-4 ring-opacity-20" : "scale-100 border-white",
                                        isActive ? `text-white ${s.bg} ring-${s.bg.replace('bg-', '')}` :
                                            isCompleted ? `${s.bg} text-white` : "bg-gray-50 text-gray-300"
                                    )}
                                >
                                    {/* Render Custom Animated Components if active, else static icon */}
                                    {isActive ? (
                                        <s.icon />
                                    ) : (
                                        // Fallback static icons for inactive states
                                        idx === 0 ? <Map className="w-6 h-6" /> :
                                            idx === 1 ? <Search className="w-6 h-6" /> :
                                                <ShoppingBag className="w-6 h-6" />
                                    )}
                                </div>
                                <span className={clsx(
                                    "text-xs font-bold uppercase tracking-wider transition-colors duration-300 absolute -bottom-8 whitespace-nowrap",
                                    isActive ? "text-dark" : "text-gray-300"
                                )}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Central Main Message */}
            <div className="space-y-4 max-w-sm mx-auto mt-8 animate-reveal">
                <div className="h-16 flex items-center justify-center">
                    {step === 'locating' && (
                        <div className="relative">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>
                            <Map className="relative inline-flex rounded-full h-16 w-16 text-blue-500" />
                        </div>
                    )}
                    {step === 'comparing' && (
                        <Search className="w-16 h-16 text-primary animate-[spin_3s_linear_infinite]" />
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
