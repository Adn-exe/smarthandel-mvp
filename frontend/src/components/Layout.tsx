import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Github, Twitter } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function Layout() {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const closeMenu = () => setIsMenuOpen(false);
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        closeMenu();
    };

    const currentLang = i18n.language.split('-')[0];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="font-heading font-bold text-xl text-dark">
                                Smart<span className="text-primary">Handel</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className={`font-medium transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-gray-600 hover:text-dark'}`}
                            >
                                {t('common.home')}
                            </Link>
                            <Link
                                to="/about"
                                className={`font-medium transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-gray-600 hover:text-dark'}`}
                            >
                                {t('common.about')}
                            </Link>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => i18n.changeLanguage('en')}
                                    className={`text-sm transition-colors ${currentLang === 'en' ? 'font-bold text-dark' : 'font-medium text-gray-500 hover:text-dark'}`}
                                >
                                    EN
                                </button>
                                <span className="text-gray-300">/</span>
                                <button
                                    onClick={() => i18n.changeLanguage('no')}
                                    className={`text-sm transition-colors ${currentLang === 'no' ? 'font-bold text-dark' : 'font-medium text-gray-500 hover:text-dark'}`}
                                >
                                    NO
                                </button>
                            </div>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-gray-600"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white absolute w-full shadow-lg">
                        <div className="px-4 py-4 space-y-4">
                            <Link
                                to="/"
                                className="block font-medium text-dark py-2"
                                onClick={closeMenu}
                            >
                                {t('common.home')}
                            </Link>
                            <Link
                                to="/about"
                                className="block font-medium text-dark py-2"
                                onClick={closeMenu}
                            >
                                {t('common.about')}
                            </Link>
                            <div className="border-t border-gray-100 my-2 pt-2 flex gap-4">
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className={`text-sm transition-colors ${currentLang === 'en' ? 'font-bold text-primary' : 'text-gray-500'}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => changeLanguage('no')}
                                    className={`text-sm transition-colors ${currentLang === 'no' ? 'font-bold text-primary' : 'text-gray-500'}`}
                                >
                                    Norsk
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white/40 backdrop-blur-md border-t border-white/20 pt-12 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-dark rounded flex items-center justify-center text-white">
                                    <ShoppingBag className="w-3 h-3" />
                                </div>
                                <span className="font-heading font-bold text-lg text-dark">SmartHandel</span>
                            </div>
                            <p className="text-sm text-gray-500">
                                {t('layout.tagline')}
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-dark mb-4">{t('layout.services')}</h3>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/" className="hover:text-primary">{t('layout.price_comparison')}</Link></li>
                                <li><Link to="/" className="hover:text-primary">{t('layout.route_planner')}</Link></li>
                                <li><Link to="/" className="hover:text-primary">{t('layout.shopping_lists')}</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-dark mb-4">{t('layout.company')}</h3>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/about" className="hover:text-primary">{t('common.about')}</Link></li>
                                <li><a href="#" className="hover:text-primary">{t('layout.careers')}</a></li>
                                <li><a href="#" className="hover:text-primary">{t('common.contact')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-dark mb-4">{t('layout.legal')}</h3>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-primary">{t('layout.privacy_policy')}</a></li>
                                <li><a href="#" className="hover:text-primary">{t('layout.terms_of_service')}</a></li>
                                <li><a href="#" className="hover:text-primary">{t('layout.cookies')}</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-400">
                            © {new Date().getFullYear()} SmartHandel AS. {t('layout.rights')}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-400 hover:text-dark transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-dark transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
