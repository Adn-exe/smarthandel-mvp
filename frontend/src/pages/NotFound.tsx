import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SearchInput } from '../components/SearchInput';
import SEO from '../components/SEO';

export function NotFound() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSearch = (query: string) => {
        navigate(`/results?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
            <SEO title={t('seo.notFoundTitle')} />

            <div className="bg-orange-50 p-6 rounded-full mb-8 animate-bounce">
                <AlertTriangle className="w-16 h-16 text-orange-500" />
            </div>

            <h1 className="text-8xl font-heading font-bold text-primary opacity-20 absolute select-none pointer-events-none -z-10 blur-sm">
                404
            </h1>

            <h2 className="text-4xl font-bold text-dark mb-4 relative">
                {t('notFound.title')}
            </h2>

            <p className="text-gray-500 max-w-md mb-8 text-lg">
                {t('notFound.description')}
            </p>

            <div className="w-full max-w-md mb-10">
                <p className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                    {t('notFound.searchPrompt')}
                </p>
                <SearchInput
                    onSearch={handleSearch}
                    placeholder={t('notFound.searchPlaceholder')}
                    className="shadow-md"
                />
            </div>

            <div className="space-y-4">
                <p className="text-gray-600 font-medium">{t('notFound.orGoTo')}</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors shadow-sm"
                    >
                        <Home className="w-5 h-5" />
                        <span>{t('notFound.home')}</span>
                    </Link>

                    <Link
                        to="/"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors shadow-sm"
                    >
                        <Search className="w-5 h-5" />
                        <span>{t('notFound.search')}</span>
                    </Link>

                    <Link
                        to="/about"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:text-primary transition-colors shadow-sm"
                    >
                        <Info className="w-5 h-5" />
                        <span>{t('notFound.about')}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
