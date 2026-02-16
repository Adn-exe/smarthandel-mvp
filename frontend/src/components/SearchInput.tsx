import { useState, useEffect, useRef, type KeyboardEvent, memo, useMemo } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SearchInputProps {
    onSearch: (query: string) => void;
    loading?: boolean;
    placeholder?: string;
    className?: string;
}

export const SearchInput = memo(function SearchInput({
    onSearch,
    loading = false,
    placeholder,
    className
}: SearchInputProps) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const MAX_CHARS = 500;

    const placeholders = useMemo(() => {
        const p = t('home.search_placeholders', { returnObjects: true });
        return Array.isArray(p) ? p : [
            "Jeg trenger melk og brød...",
            "I need chicken for dinner...",
            "2 liter melk, egg, ost for under 200kr",
            "Tacofredag med familien",
            "Sunn frokost til hele uken"
        ];
    }, [t]);

    // Auto-focus on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Rotate placeholders
    useEffect(() => {
        if (isFocused || query) return; // Don't rotate if user is typing

        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isFocused, query, placeholders]);

    const handleSubmit = () => {
        if (query.trim() && !loading) {
            onSearch(query.trim());
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleClear = () => {
        setQuery('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const currentPlaceholder = placeholder || placeholders[placeholderIndex];

    return (
        <div className={twMerge("w-full max-w-2xl mx-auto", className)}>
            <div
                className={clsx(
                    "relative group transition-all duration-300 ease-in-out",
                    "bg-white rounded-2xl shadow-lg border-2",
                    isFocused ? "border-primary shadow-primary/10 scale-[1.01]" : "border-transparent shadow-gray-200"
                )}
            >
                {/* Input Area */}
                <div className="relative flex flex-col min-h-[140px] p-4 sm:p-6">
                    <label htmlFor="search-input" className="sr-only">
                        {t('common.describe_need')}
                    </label>

                    <div className="flex items-start gap-3 mb-2">
                        <Search className={clsx(
                            "w-6 h-6 mt-1 transition-colors duration-300",
                            isFocused ? "text-primary" : "text-gray-400"
                        )} />

                        <textarea
                            id="search-input"
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value.slice(0, MAX_CHARS))}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyDown}
                            placeholder={currentPlaceholder}
                            disabled={loading}
                            className="w-full bg-transparent text-xl sm:text-2xl text-dark placeholder-gray-300 resize-none outline-none min-h-[80px]"
                            rows={3}
                        />
                    </div>

                    {/* Footer Area */}
                    <div className="mt-auto flex items-end justify-between gap-4">
                        {/* Character Count */}
                        <span className={clsx(
                            "text-xs font-medium transition-colors",
                            query.length > MAX_CHARS * 0.9 ? "text-red-500" : "text-gray-400"
                        )}>
                            {query.length}/{MAX_CHARS}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {query && (
                                <button
                                    onClick={handleClear}
                                    className="p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-full transition-all"
                                    aria-label="Clear search"
                                    type="button"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!query.trim() || loading}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all duration-300",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    query.trim() && !loading
                                        ? "bg-primary text-white hover:bg-red-600 shadow-md hover:shadow-lg transform active:scale-95"
                                        : "bg-gray-100 text-gray-400"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('common.thinking')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('common.shop')}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Help text */}
            <p className={clsx(
                "mt-3 text-center text-sm text-gray-400 transition-opacity duration-500",
                isFocused ? "opacity-100" : "opacity-0"
            )}>
                <Trans i18nKey="common.press_enter">
                    Press <kbd className="px-2 py-0.5 rounded bg-gray-200 border border-gray-300 text-xs font-sans">Enter</kbd> to search
                </Trans>
            </p>
        </div>
    );
});
