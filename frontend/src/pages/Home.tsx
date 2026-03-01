import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp, ShoppingBag, ArrowRight, Users, Sparkles, Check } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { SearchInput } from '../components/SearchInput';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import type { Location } from '../types';

const GROCERY_EMOJIS = [
    '🥛', '🍞', '🧀', '🥕', '🍗', '🥚', '🍎', '🥦', '🥩', '🥝', '🥑', '🍌',
    '🍇', '🍓', '🍋', '🧅', '🐟', '🍣', '🍫', '🧃', '🍅', '🥔', '🥐', '🌶️',
    '🍉', '🍍', '🍒', '🍔', '🌯', '🌭', '🌮', '🍿', '🍩', '🥤'
];

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [location, setLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Generate dynamic floating emojis once on mount
    const floatingEmojis = useMemo(() => {
        const shuffled = [...GROCERY_EMOJIS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 15).map((emoji, i) => ({
            id: i,
            emoji,
            // 5% to 95% width
            left: `${Math.floor(Math.random() * 90) + 5}%`,
            // 12s to 24s duration
            animationDuration: `${12 + Math.floor(Math.random() * 12)}s`,
            // 0s to 5s delay
            animationDelay: `${Math.floor(Math.random() * 5)}s`,
            // 1.25rem to 2.75rem size
            fontSize: `${1.25 + Math.random() * 1.5}rem`,
        }));
    }, []);

    // Get user location on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationError(null);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setLocationError(t('home.location_error'));
                    // Default to Trondheim if denied/error (Torvet)
                    setLocation({ lat: 63.4305, lng: 10.3951 });
                }
            );
        } else {
            setLocationError(t('home.geolocation_not_supported'));
        }
    }, [t]);

    const handleSearch = (query: string) => {
        if (location) {
            trackEvent('search_performed', { query, has_location: true });
            // Navigate to selection page with query and location state
            navigate(`/selection?q=${encodeURIComponent(query)}`, {
                state: { location }
            });
        } else {
            alert(t('home.allow_location_alert'));
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <SEO title={t('seo.homeTitle')} />

            {/* Hero Section */}
            <section className="relative z-20 pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 min-h-[70vh] md:min-h-[75vh] flex items-center">
                {/* Subtle Gradient Orbs */}
                <div className="absolute inset-0 -z-20 bg-[#fafafa] overflow-hidden">
                    <div
                        className="absolute top-[-5%] left-[-5%] w-[70%] md:w-[40%] h-[40%] bg-gradient-to-br from-primary/12 to-pink-400/8 rounded-full blur-3xl"
                        style={{ animation: 'morph 12s ease-in-out infinite' }}
                    ></div>
                    <div
                        className="absolute top-[20%] right-[-10%] w-[60%] md:w-[30%] h-[30%] bg-gradient-to-bl from-secondary/10 to-cyan-400/6 rounded-full blur-3xl"
                        style={{ animation: 'morph 16s ease-in-out infinite 3s' }}
                    ></div>
                </div>

                {/* Subtle Dot Grid Pattern */}
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(#d1d5db_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none"></div>

                {/* Dynamic Floating Grocery Emojis */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 md:opacity-60">
                    {floatingEmojis.map((item) => (
                        <span
                            key={item.id}
                            className="absolute select-none opacity-0 drop-shadow-sm"
                            style={{
                                left: item.left,
                                bottom: '-60px', /* Start slightly lower */
                                fontSize: item.fontSize,
                                animation: `drift ${item.animationDuration} linear infinite ${item.animationDelay}`,
                            }}
                        >
                            {item.emoji}
                        </span>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
                    <h1 className="text-4xl sm:text-6xl md:text-[5rem] font-heading font-black text-dark mb-6 animate-reveal [animation-delay:200ms] [animation-fill-mode:forwards] leading-[1.05] tracking-tighter">
                        <Trans i18nKey="home.title">
                            Handle <span className="bg-gradient-to-r from-primary via-red-400 to-primary bg-clip-text text-transparent shimmer-text inline-block">smartere</span>, ikke dyrere
                        </Trans>
                    </h1>

                    <p className="text-base sm:text-xl text-gray-400 mb-8 md:mb-10 max-w-xl mx-auto animate-reveal [animation-delay:400ms] [animation-fill-mode:forwards] leading-relaxed font-medium px-4 md:px-0">
                        {t('home.subtitle')}
                    </p>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 md:mb-10 animate-reveal [animation-delay:500ms] [animation-fill-mode:forwards] px-4 md:px-0">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full text-[11px] sm:text-xs font-bold text-gray-600 shadow-sm">
                            <Users className="w-3.5 h-3.5 text-primary" /> 15k+ Users
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full text-[11px] sm:text-xs font-bold text-gray-600 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-secondary" /> AI-Powered
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full text-[11px] sm:text-xs font-bold text-green-600 shadow-sm">
                            <Check className="w-3.5 h-3.5" /> 100% Free
                        </span>
                    </div>

                    <div className="animate-reveal [animation-delay:600ms] [animation-fill-mode:forwards] max-w-2xl mx-auto px-2 md:px-0">
                        <SearchInput
                            onSearch={handleSearch}
                            className="shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgba(229,57,53,0.12)] transition-shadow duration-500"
                            placeholder={t('home.placeholder')}
                            initialOpen={true}
                            isStatic={true}
                        />
                        {locationError && (
                            <p className="mt-6 text-sm text-amber-600 glass px-6 py-2 rounded-full inline-block animate-reveal shadow-lg shadow-amber-500/5">
                                <MapPin className="w-4 h-4 inline mr-2 -mt-1" />
                                {locationError} ({t('home.using_default_location')})
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-24 relative bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 animate-reveal">
                        <h2 className="text-3xl font-bold text-dark mb-4 tracking-tight">{t('home.howItWorks.title')}</h2>
                        <div className="w-16 h-1 bg-primary/20 mx-auto rounded-full mb-4"></div>
                        <p className="text-lg text-gray-500 max-w-xl mx-auto">
                            {t('home.howItWorks.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 relative items-stretch">
                        {/* Connecting dashed line */}
                        <div className="hidden md:block absolute top-[35%] left-[20%] right-[20%] h-px border-t border-dashed border-gray-200"></div>

                        {/* Step 1 */}
                        <div className="relative group animate-reveal [animation-delay:100ms]">
                            <div className="glass p-6 rounded-2xl flex flex-col items-center text-center hover-glow bg-white/50 relative overflow-hidden h-full">
                                <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                                    <Search className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{t('home.howItWorks.step1.title')}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {t('home.howItWorks.step1.description')}
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative group animate-reveal [animation-delay:200ms]">
                            <div className="glass p-6 rounded-2xl flex flex-col items-center text-center hover-glow bg-white/50 relative overflow-hidden h-full">
                                <div className="w-14 h-14 bg-secondary/5 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                                    <MapPin className="w-7 h-7 text-secondary" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{t('home.howItWorks.step2.title')}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {t('home.howItWorks.step2.description')}
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative group animate-reveal [animation-delay:300ms]">
                            <div className="glass p-6 rounded-2xl flex flex-col items-center text-center hover-glow bg-white/50 relative overflow-hidden h-full">
                                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp className="w-7 h-7 text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-bold mb-2">{t('home.howItWorks.step3.title')}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {t('home.howItWorks.step3.description')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* Stats Section - Classic Dark Bar (Matching About Us) */}
            <section className="bg-dark text-white py-12 md:py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 md:gap-12 text-center items-center">
                    <div className="animate-reveal [animation-delay:100ms]">
                        <div className="text-5xl md:text-6xl font-bold text-primary mb-3">15k+</div>
                        <p className="text-gray-400 text-lg uppercase tracking-widest font-medium">
                            {t('about.stats.users')}
                        </p>
                    </div>
                    <div className="animate-reveal [animation-delay:200ms]">
                        <div className="text-5xl md:text-6xl font-bold text-secondary mb-3">2.5M</div>
                        <p className="text-gray-400 text-lg uppercase tracking-widest font-medium">
                            {t('about.stats.saved')}
                        </p>
                    </div>
                    <div className="animate-reveal [animation-delay:300ms]">
                        <div className="text-5xl md:text-6xl font-bold text-accent mb-3">100%</div>
                        <p className="text-gray-400 text-lg uppercase tracking-widest font-medium">
                            {t('about.stats.coverage')}
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 md:py-32 text-center px-4">
                <div className="max-w-3xl mx-auto glass p-8 md:p-16 rounded-[2rem] md:rounded-[3rem] animate-reveal">
                    <h2 className="text-3xl md:text-5xl font-bold text-dark mb-8 md:mb-10 leading-tight">{t('home.cta.title')}</h2>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 md:gap-3 bg-dark text-white px-8 py-4 md:px-12 md:py-5 rounded-2xl text-base md:text-xl font-bold hover:bg-black transition-all transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95"
                    >
                        <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                        {t('home.cta.button')}
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-1" />
                    </button>
                    <p className="mt-6 md:mt-8 text-sm md:text-base text-gray-400 font-medium">No sign up required. Just start saving.</p>
                </div>
            </section>
        </div>
    );
}
