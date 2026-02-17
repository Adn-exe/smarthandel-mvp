import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { SearchInput } from '../components/SearchInput';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import type { Location } from '../types';

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [location, setLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

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
            <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[80vh] md:min-h-[85vh] flex items-center">
                {/* Morphing Gradient Orbs */}
                <div className="absolute inset-0 -z-20 bg-[#fafafa]">
                    <div
                        className="absolute top-[-5%] left-[-5%] w-[80%] md:w-[45%] h-[45%] bg-gradient-to-br from-primary/30 to-pink-400/20"
                        style={{ animation: 'morph 8s ease-in-out infinite, pulse-glow 4s ease-in-out infinite' }}
                    ></div>
                    <div
                        className="absolute top-[20%] right-[-10%] w-[70%] md:w-[35%] h-[35%] bg-gradient-to-bl from-secondary/25 to-cyan-400/15"
                        style={{ animation: 'morph 10s ease-in-out infinite 2s, pulse-glow 5s ease-in-out infinite 1s' }}
                    ></div>
                    <div
                        className="absolute bottom-[-10%] left-[30%] w-[60%] md:w-[30%] h-[30%] bg-gradient-to-tr from-accent/20 to-orange-300/10"
                        style={{ animation: 'morph 12s ease-in-out infinite 4s, pulse-glow 6s ease-in-out infinite 2s' }}
                    ></div>
                </div>

                {/* Floating Grocery Emojis */}
                <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-30 md:opacity-100">
                    {['🥛', '🍞', '🧀', '🥕', '🍗', '🥚', '🍎', '🥦'].map((emoji, i) => (
                        <span
                            key={i}
                            className="absolute text-xl sm:text-3xl select-none opacity-0"
                            style={{
                                left: `${5 + i * 12}%`,
                                bottom: '-40px',
                                animation: `drift ${12 + i * 2}s linear infinite ${i * 1.5}s`,
                            }}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
                    <h1 className="text-4xl sm:text-6xl md:text-[5rem] font-heading font-black text-dark mb-6 animate-reveal [animation-delay:200ms] [animation-fill-mode:forwards] leading-[1.1] tracking-tight">
                        <Trans i18nKey="home.title">
                            Handle <span className="bg-gradient-to-r from-primary via-red-400 to-primary bg-clip-text text-transparent shimmer-text inline-block">smartere</span>, ikke dyrere
                        </Trans>
                    </h1>

                    <p className="text-base sm:text-xl text-gray-400 mb-10 md:mb-14 max-w-xl mx-auto animate-reveal [animation-delay:400ms] [animation-fill-mode:forwards] leading-relaxed font-medium px-4 md:px-0">
                        {t('home.subtitle')}
                    </p>

                    <div className="animate-reveal [animation-delay:600ms] [animation-fill-mode:forwards] max-w-2xl mx-auto px-2 md:px-0">
                        <SearchInput
                            onSearch={handleSearch}
                            className="shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_70px_rgba(255,71,87,0.15)] transition-shadow duration-500"
                            placeholder={t('home.placeholder')}
                        />
                        {locationError && (
                            <p className="mt-6 text-sm text-amber-600 glass px-6 py-2 rounded-full inline-block animate-reveal shadow-lg shadow-amber-500/5">
                                <MapPin className="w-4 h-4 inline mr-2 -mt-1" />
                                {locationError} ({t('home.using_default_location')})
                            </p>
                        )}
                    </div>

                    {/* Quick-Search Chips */}
                    <div className="mt-12 md:mt-16 animate-reveal [animation-delay:800ms] [animation-fill-mode:forwards]">
                        <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            {t('home.quickSearch.heading')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2">
                            {[
                                { labelKey: 'home.quickSearch.essentials', query: 'melk, brød, egg' },
                                { labelKey: 'home.quickSearch.taco', query: 'tacokrydder, tortilla, kjøttdeig, rømme, mais, salsa' },
                                { labelKey: 'home.quickSearch.chicken', query: 'kyllingfilet, ris, brokkoli' },
                                { labelKey: 'home.quickSearch.produce', query: 'eple, banan, gulrot, agurk, tomat' },
                                { labelKey: 'home.quickSearch.breakfast', query: 'havregryn, yoghurt, blåbær, juice, brød' },
                            ].map((chip) => (
                                <button
                                    key={chip.query}
                                    onClick={() => handleSearch(chip.query)}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold 
                                        bg-white/80 backdrop-blur-sm border border-gray-100 text-gray-600
                                        hover:bg-primary/10 hover:text-primary hover:border-primary/30 
                                        hover:shadow-md hover:-translate-y-0.5
                                        active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
                                >
                                    {t(chip.labelKey)}
                                </button>
                            ))}
                        </div>
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

            {/*
       ### Stats & "How it Works" Redesign
- **Stats Bar**: Replaced the "Data Console" with a classic full-width dark bar matching the "About Us" page.
- **Updated Values**: Now displays **15k+** users, **2.5M** saved (NOK), and **100%** chain coverage.
- **"How it Works"**: Section refined to be more compact with smaller cards and cleaner typography.

### Refinement & Bug Fixes
- **Aurora Removal**: Removed the dynamic aurora background after experimentation to maintain a cleaner, more readable look.
- **SEO.tsx Polish**: Removed an unused `Helmet` import that was triggering a lint warning in React 19.
- **TSConfig Stability**: Removed experimental `erasableSyntaxOnly` and `noUncheckedSideEffectImports` flags from `tsconfig.app.json` and `tsconfig.node.json` which were causing build errors in standard TypeScript environments.

![Final Home Page Redesign](file:///Users/mohammedadnan/.gemini/antigravity/brain/41ad05d8-f5b9-4b51-9102-566be8b6e03c/homepage_top_1771058558085.png)
            */}
            {/* Stats Section - Classic Dark Bar (Matching About Us) */}
            <section className="bg-dark text-white py-20 px-4">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-center items-center">
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
            <section className="py-32 text-center px-4">
                <div className="max-w-3xl mx-auto glass p-16 rounded-[3rem] animate-reveal">
                    <h2 className="text-4xl md:text-5xl font-bold text-dark mb-10 leading-tight">{t('home.cta.title')}</h2>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="inline-flex items-center gap-3 bg-dark text-white px-12 py-5 rounded-2xl text-xl font-bold hover:bg-black transition-all transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95"
                    >
                        <ShoppingBag className="w-6 h-6" />
                        {t('home.cta.button')}
                        <ArrowRight className="w-6 h-6 ml-1" />
                    </button>
                    <p className="mt-8 text-gray-400 font-medium">No sign up required. Just start saving.</p>
                </div>
            </section>
        </div>
    );
}
