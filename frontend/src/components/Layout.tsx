import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { InstallButton } from './InstallButton';
import { BottomNav } from './BottomNav';

export function Layout() {
    const { t, i18n } = useTranslation();
    const location = useLocation();

    const currentLang = i18n.language.split('-')[0];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 transition-all duration-300 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">

                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 transform group-hover:scale-110 group-active:scale-95 transition-all duration-300 drop-shadow-sm">
                                <img
                                    src="/icons/icon.svg"
                                    alt="SmartHandel Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <span className="font-heading font-bold text-lg sm:text-xl text-dark tracking-tight">
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

                            {/* Download PWA App Button */}
                            <InstallButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white/40 backdrop-blur-md border-t border-white/20 pt-12 pb-24 md:pb-8">
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

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav />
        </div>
    );
}
