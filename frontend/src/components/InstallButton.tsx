import { useState, useEffect, useCallback } from 'react';
import { Download, X, Monitor, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        if (window.__pwaInstallPrompt) {
            setDeferredPrompt(window.__pwaInstallPrompt);
        }

        const handlePrompt = () => {
            if (window.__pwaInstallPrompt) {
                setDeferredPrompt(window.__pwaInstallPrompt);
            }
        };

        const handleBrowserPrompt = (e: Event) => {
            e.preventDefault();
            window.__pwaInstallPrompt = e as BeforeInstallPromptEvent;
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const handleInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            window.__pwaInstallPrompt = null;
            setShowGuide(false);
        };

        window.addEventListener('pwaInstallReady', handlePrompt);
        window.addEventListener('beforeinstallprompt', handleBrowserPrompt);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('pwaInstallReady', handlePrompt);
            window.removeEventListener('beforeinstallprompt', handleBrowserPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    // Close guide on outside click
    useEffect(() => {
        if (!showGuide) return;
        const close = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-install-guide]')) setShowGuide(false);
        };
        document.addEventListener('click', close, { capture: true });
        return () => document.removeEventListener('click', close, { capture: true });
    }, [showGuide]);

    const handleInstall = useCallback(async () => {
        const prompt = deferredPrompt || window.__pwaInstallPrompt;
        if (prompt) {
            await prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') setIsInstalled(true);
            setDeferredPrompt(null);
            window.__pwaInstallPrompt = null;
            return;
        }
        setShowGuide(true);
    }, [deferredPrompt]);

    if (isInstalled) return null;

    const guideContent = (
        <div
            data-install-guide
            className="absolute z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
                ...(variant === 'mobile'
                    ? { left: 0, right: 0, bottom: '100%', marginBottom: '8px' }
                    : { right: 0, top: '100%', marginTop: '8px', width: '280px' }),
            }}
        >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-dark">Install SmartHandel</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowGuide(false); }}
                        className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                    >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                </div>

                {/* Instructions */}
                <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Monitor className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-dark mb-0.5">Desktop (Chrome/Edge)</p>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Click <span className="font-semibold text-gray-700">Open in app</span> in the address bar
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="flex items-start gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Smartphone className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-dark mb-0.5">Mobile (Safari/Chrome)</p>
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                Tap <span className="font-semibold text-gray-700">Share ↗</span> → <span className="font-semibold text-gray-700">Add to Home Screen</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (variant === 'mobile') {
        return (
            <div className="relative">
                <button
                    onClick={handleInstall}
                    className="flex items-center justify-between w-full p-4 rounded-2xl bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-all active:scale-[0.98] group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Download className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <span className="text-base font-bold block">{t('common.installApp', 'Install App')}</span>
                            <span className="text-xs text-primary/60 font-medium">{t('common.installAppDesc', 'Add to home screen')}</span>
                        </div>
                    </div>
                    {deferredPrompt && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </button>
                {showGuide && guideContent}
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/20 rounded-xl text-primary text-xs font-bold transition-all active:scale-95 group"
                title={t('common.installApp', 'Install App')}
            >
                <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
                <span className="hidden lg:inline">{t('common.installApp', 'Install App')}</span>
            </button>
            {showGuide && guideContent}
        </div>
    );
}
