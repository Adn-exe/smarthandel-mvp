import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
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

    // Scroll lock when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    }, [isMenuOpen]);

    const currentLang = i18n.language.split('-')[0];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                                <ShoppingBag className="w-5 h-5" />
                            </div>
                            <span className="font-heading font-bold text-xl text-dark tracking-tight">
                                Smart<span className="text-primary">Handel</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className={`font-semibold text-sm transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-gray-600 hover:text-dark'}`}
                            >
                                {t('common.home')}
                            </Link>
                            <Link
                                to="/about"
                                className={`font-semibold text-sm transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-gray-600 hover:text-dark'}`}
                            >
                                {t('common.about')}
                            </Link>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => i18n.changeLanguage('en')}
                                    className={`text-xs transition-colors px-2 py-1 rounded ${currentLang === 'en' ? 'bg-dark text-white font-bold' : 'font-medium text-gray-400 hover:text-dark'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('no')}
                                    className={`text-xs transition-colors px-2 py-1 rounded ${currentLang === 'no' ? 'bg-dark text-white font-bold' : 'font-medium text-gray-400 hover:text-dark'}`}
                                >
                                    NO
                                </button>
                            </div>
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-gray-600 focus:outline-none"
                            aria-label="Toggle menu"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-6 h-6 animate-scaleIn" /> : <Menu className="w-6 h-6 animate-scaleIn" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`
                    fixed inset-0 top-16 bg-white z-40 md:hidden transition-all duration-300 ease-in-out
                    ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}
                `}>
                    <div className="px-6 py-8 space-y-6">
                        <Link
                            to="/"
                            className={`block text-2xl font-bold ${location.pathname === '/' ? 'text-primary' : 'text-dark'}`}
                            onClick={closeMenu}
                        >
                            {t('common.home')}
                        </Link>
                        <Link
                            to="/about"
                            className={`block text-2xl font-bold ${location.pathname === '/about' ? 'text-primary' : 'text-dark'}`}
                            onClick={closeMenu}
                        >
                            {t('common.about')}
                        </Link>

                        <div className="pt-8 border-t border-gray-100 flex flex-col gap-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('layout.language')}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentLang === 'en' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => changeLanguage('no')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${currentLang === 'no' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}
                                >
                                    Norsk
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><span className="cursor-default">{t('layout.privacy_policy')}</span></li>
                                <li><span className="cursor-default">{t('layout.terms_of_service')}</span></li>
                                <li><span className="cursor-default">{t('layout.cookies')}</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs text-gray-400">
                            © {new Date().getFullYear()} SmartHandel AS. {t('layout.rights')}
                        </p>
                        <div className="flex gap-4">
                            {/* Social icons removed */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
