import { Home, Map, Tag, Info, Search, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
            return;
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
                                className={`relative flex flex-col items-center justify-center w-14 h-12 sm:w-16 sm:h-14 rounded-2xl transition-all duration-300 active:scale-95 ${isActive ? 'text-[#e53935]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {/* Active State Background Bubble */}
                                {isActive && (
                                    <motion.div
                                        layoutId="bottomNavBubble"
                                        className="absolute inset-0 bg-[#e53935]/10 rounded-2xl -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    />
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
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-20 left-4 right-4 z-[60] pointer-events-auto"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                <Search className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                                    {t('common.readyToFind', 'Klar for å finne ruter?')}
                                    <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t('common.navGuidance', 'Fortell oss hva du trenger i søkefeltet på hjemsiden først, så hjelper vi deg å finne den beste ruten!')}
                                </p>
                                <button
                                    onClick={() => {
                                        setShowGuidance(false);
                                        navigate('/');
                                    }}
                                    className="mt-3 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
                                >
                                    {t('common.goToHome', 'Gå til forsiden')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
