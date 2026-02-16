import { useState } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, ChevronDown, ChevronUp, WifiOff, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface ErrorStateProps {
    error: Error | string;
    onRetry?: () => void;
    onBack?: () => void;
    title?: string;
    className?: string;
}

export function ErrorState({
    error,
    onRetry,
    onBack,
    title,
    className
}: ErrorStateProps) {
    const { t } = useTranslation();
    const [showDetails, setShowDetails] = useState(false);

    const errorMessage = typeof error === 'string' ? error : error.message;

    // Categorize errors for better UX
    let displayTitle = title || t('errors.generic_title');
    let displayMessage = t('errors.generic_message');
    let Icon = AlertCircle;

    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        displayTitle = t('errors.network_title');
        displayMessage = t('errors.network_message');
        Icon = WifiOff;
    } else if (errorMessage.toLowerCase().includes('timeout')) {
        displayTitle = t('errors.timeout_title');
        displayMessage = t('errors.timeout_message');
        Icon = RefreshCw;
    } else if (errorMessage.toLowerCase().includes('validation') || errorMessage.toLowerCase().includes('invalid')) {
        displayTitle = t('errors.validation_title');
        displayMessage = t('errors.validation_message');
        Icon = XCircle;
    }

    return (
        <div className={clsx(
            "flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto",
            "bg-white rounded-2xl border border-red-100 shadow-sm animate-in fade-in zoom-in-95 duration-300",
            className
        )}>
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-red-500" />
            </div>

            <h3 className="text-xl font-semibold text-dark mb-2">
                {displayTitle}
            </h3>

            <p className="text-gray-600 mb-6">
                {displayMessage}
            </p>

            <div className="flex gap-3 w-full justify-center">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="btn btn-outline gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('common.back')}
                    </button>
                )}

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn btn-primary gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('common.retry')}
                    </button>
                )}
            </div>

            <div className="mt-8 w-full">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                    {showDetails ? t('common.hide_details') : t('common.show_details')}
                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showDetails && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-left overflow-auto max-h-40 border border-gray-100">
                        <p className="text-xs font-mono text-gray-600 break-words">
                            {errorMessage}
                        </p>
                        {typeof error === 'object' && 'stack' in error && (
                            <pre className="mt-1 text-[10px] text-gray-400 whitespace-pre-wrap">
                                {(error as Error).stack}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
