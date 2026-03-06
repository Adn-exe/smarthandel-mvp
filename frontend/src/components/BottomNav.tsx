import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Map, Tag, Info, Search, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useShoppingList } from '../context/ShoppingListContext';
import { useState, useEffect } from 'react';

export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { items } = useShoppingList();
    const [showGuidance, setShowGuidance] = useState(false);

    // Auto-hide guidance after 4 seconds
    useEffect(() => {
        if (showGuidance) {
            const timer = setTimeout(() => setShowGuidance(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [showGuidance]);

    const handleNavClick = (e: React.MouseEvent, path: string) => {
        if (path === '/results' && items.length === 0) {
            e.preventDefault();
            setShowGuidance(true);

            if (location.pathname === '/') {
                // If already on home, scroll to top where search bar is
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // If not on home, navigate there and it will naturally be at top
                navigate('/');
                // Ensure scroll to top after navigation
                setTimeout(() => window.scrollTo({ top: 0 }), 10);
            }
            return;
        }

        if (path === '/') {
            if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // If navigating to home from another page, ensure we land at top
                navigate('/');
                setTimeout(() => window.scrollTo({ top: 0 }), 10);
            }
        }
    };

    const tabs = [
        {
            name: t('common.home', 'Home'),
            path: '/',
            icon: Home
        },
        {
            name: t('common.route_planner', 'Routes'),
            path: '/results',
            icon: Map
        },
        {
            name: t('common.offers', 'Offers'),
            path: '/offers',
            icon: Tag
        },
        {
            name: t('common.about', 'About'),
            path: '/about',
            icon: Info
        }
    ];

    return (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50 pointer-events-none">
            {/* Gradient background transition to give bottom padding visual separation */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

            <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border-t border-slate-200/60 safe-area-bottom pb-env-safe">
                <nav className="flex items-center justify-around px-2 pb-1 pt-1.5 sm:px-4">
                    {tabs.map((tab) => {
                        const isActive = location.pathname === tab.path;
                        const Icon = tab.icon;

                        return (
                            <Link
                                key={tab.path}
                                to={tab.path}
                                onClick={(e) => handleNavClick(e, tab.path)}
                                className={`relative flex flex-col items-center justify-center w-14 h-12 sm:w-16 sm:h-14 transition-all duration-300 active:scale-95 ${isActive ? 'text-[#e53935]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {/* Active State Indicator - Modern Sharp 'Stealth' Style */}
                                {isActive && (
                                    <>
                                        {/* Main Background Box (Sharp) */}
                                        <motion.div
                                            layoutId="bottomNavActiveBg"
                                            className="absolute inset-0 bg-slate-900/[0.03] border-x border-slate-200/50 -z-10"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                        {/* High-Contrast Bottom Accent Bar */}
                                        <motion.div
                                            layoutId="bottomNavAccent"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e53935] shadow-[0_-2px_8px_rgba(229,57,53,0.3)]"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    </>
                                )}

                                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                <span className={`text-[9px] sm:text-[10px] font-bold tracking-tight transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                                    {tab.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Guidance Flash Message */}
            <AnimatePresence>
                {showGuidance && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="fixed bottom-24 left-4 right-4 z-[60] pointer-events-auto max-w-lg mx-auto"
                    >
                        <div className="bg-[#0f172a] text-white p-5 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-700/50 flex gap-5 items-center ring-1 ring-white/10">
                            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                                <Search className="w-6 h-6 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-heading font-black text-xs sm:text-sm uppercase tracking-[0.15em] text-white mb-1.5 flex items-center gap-2">
                                    {t('common.readyToFind')}
                                    <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
                                </h4>
                                <p className="text-[11px] sm:text-xs text-slate-200 font-medium leading-[1.6] antialiased">
                                    {t('common.navGuidance')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
