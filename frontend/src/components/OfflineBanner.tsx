import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
    const { t } = useTranslation();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setDismissed(false); // Re-show if user goes offline again
        };
        const handleOnline = () => setIsOffline(false);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline || dismissed) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top-4 duration-500"
            role="alert"
            aria-live="assertive"
        >
            <div className="bg-amber-500 text-white px-4 py-2.5 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <WifiOff className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold">
                            {t('common.offline', "You're offline — cached content may be outdated")}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                        >
                            <RefreshCw className="w-3 h-3" />
                            {t('common.retry', 'Retry')}
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="px-2 py-1 text-white/80 hover:text-white text-[10px] font-bold transition-all"
                            aria-label="Dismiss"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
