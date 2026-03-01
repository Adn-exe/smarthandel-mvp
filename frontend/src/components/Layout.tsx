import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InstallButton } from './InstallButton';

export function Layout() {
    const { t, i18n } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const closeMenu = () => setIsMenuOpen(false);

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
            <header className={`
                fixed top-0 inset-x-0 z-50 border-b border-gray-100 transition-all duration-300
                ${isMenuOpen ? 'bg-white' : 'bg-white/80 backdrop-blur-md'}
            `}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMenu}>
                            <div className="w-9 h-9 transform group-hover:scale-110 group-active:scale-95 transition-all duration-300 drop-shadow-sm">
                                <img
                                    src="/icons/icon.svg"
                                    alt="SmartHandel Logo"
                                    className="w-full h-full object-contain"
                                />
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
                            <InstallButton variant="desktop" />
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

                        {/* Mobile Controls */}
                        <div className="flex items-center gap-2 md:hidden">
                            {/* Language Switcher (Outside burger) */}
                            <div className="flex items-center gap-2 mr-1">
                                <button
                                    onClick={() => i18n.changeLanguage('en')}
                                    className={`text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-lg border ${currentLang === 'en' ? 'bg-dark text-white border-dark' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => i18n.changeLanguage('no')}
                                    className={`text-[10px] font-bold transition-all px-2.5 py-1.5 rounded-lg border ${currentLang === 'no' ? 'bg-dark text-white border-dark' : 'bg-white text-gray-500 border-gray-200'}`}
                                >
                                    NO
                                </button>
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                className="p-2 text-dark focus:outline-none bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-colors"
                                aria-label="Toggle menu"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={`
                    fixed inset-0 top-16 bg-white z-40 md:hidden transition-all duration-300 ease-in-out
                    ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}
                `}>
                    <div className="px-6 py-8 space-y-6 h-full flex flex-col overflow-y-auto pb-24">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Menu</p>
                            <Link
                                to="/"
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${location.pathname === '/' ? 'bg-primary/5 text-primary font-bold' : 'text-dark font-semibold hover:bg-gray-50'}`}
                                onClick={closeMenu}
                            >
                                <span className="text-xl">{t('common.home')}</span>
                                {location.pathname === '/' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </Link>
                            <Link
                                to="/about"
                                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${location.pathname === '/about' ? 'bg-primary/5 text-primary font-bold' : 'text-dark font-semibold hover:bg-gray-50'}`}
                                onClick={closeMenu}
                            >
                                <span className="text-xl">{t('common.about')}</span>
                                {location.pathname === '/about' && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </Link>
                        </div>

                        {/* Install App Button */}
                        <div className="px-1">
                            <InstallButton variant="mobile" />
                        </div>

                        {/* Mobile Menu Footer */}
                        <div className="mt-auto pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-dark text-sm">SmartHandel</p>
                                    <p className="text-xs text-gray-500">Din smarte handleassistent</p>
                                </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7">
                                    <img
                                        src="/icons/icon.svg"
                                        alt="SmartHandel Logo"
                                        className="w-full h-full object-contain"
                                    />
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
