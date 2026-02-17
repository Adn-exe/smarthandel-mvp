import { useState } from 'react';
import { Search, Sparkles, List, TrendingDown, Target, ArrowRight, Users, Mail, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { clsx } from 'clsx';

export function About() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (id: number) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title={t('seo.aboutTitle')}
                description={t('about.heroDescription')}
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 md:pt-40 md:pb-32 overflow-hidden">
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_100%)] opacity-[0.03]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 md:mb-10 animate-reveal">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest leading-none">{t('about.badge')}</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-heading font-black text-dark mb-8 tracking-tight leading-[1.05] animate-reveal [animation-delay:200ms]">
                        {t('about.heroTitle')} <br className="hidden md:block" />
                        <span className="text-primary">{t('about.heroSubtitle')}</span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-lg md:text-2xl text-gray-500 font-medium leading-relaxed animate-reveal [animation-delay:400ms]">
                        {t('about.heroDescription')}
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-20 md:py-32 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
                        <div className="space-y-8 md:space-y-10 animate-reveal">
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-5xl font-heading font-black text-dark tracking-tight">
                                    {t('about.ourMission')}
                                </h2>
                                <div className="h-2 w-24 bg-primary rounded-full"></div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
                                    {t('about.missionDescription1')}
                                </p>
                                <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
                                    {t('about.missionDescription2')}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <button
                                    onClick={() => navigate('/')}
                                    className="bg-dark text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                                >
                                    {t('common.startOver')}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="border-2 border-gray-200 bg-white px-10 py-5 rounded-2xl font-black text-lg text-dark hover:border-dark transition-all flex items-center justify-center">
                                    {t('about.viewPartners')}
                                </button>
                            </div>
                        </div>

                        <div className="relative animate-reveal [animation-delay:400ms]">
                            <div className="aspect-square rounded-[40px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rotate-3 bg-primary">
                                <div className="absolute inset-0 flex items-center justify-center p-12">
                                    <div className="text-center text-white space-y-6">
                                        <div className="w-24 h-24 bg-white/20 backdrop-blur-3xl rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                                            <Target className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-5xl md:text-7xl font-black">100%</h3>
                                            <p className="text-xs md:text-sm font-black text-white/90 uppercase tracking-[0.2em]">{t('about.transparency')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary/10 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 md:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-3xl md:text-5xl font-heading font-black text-dark tracking-tight mb-6">{t('about.howItWorks')}</h2>
                        <div className="inline-block px-4 py-1 bg-gray-100 rounded-full">
                            <p className="text-gray-500 font-black uppercase tracking-widest text-[10px] md:text-xs">{t('about.threeSimpleSteps')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { icon: Search, title: t('about.step1Title'), desc: t('about.step1Desc'), color: 'bg-blue-50 text-blue-600' },
                            { icon: List, title: t('about.step2Title'), desc: t('about.step2Desc'), color: 'bg-green-50 text-green-600' },
                            { icon: TrendingDown, title: t('about.step3Title'), desc: t('about.step3Desc'), color: 'bg-primary/5 text-primary' }
                        ].map((step, idx) => (
                            <div key={idx} className="group bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] space-y-8 transition-all hover:shadow-[0_40px_80px_-24px_rgba(0,0,0,0.1)] hover:-translate-y-2">
                                <div className={clsx(
                                    "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm",
                                    step.color
                                )}>
                                    <step.icon className="w-10 h-10" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-dark">{step.title}</h3>
                                    <p className="text-lg text-gray-500 font-medium leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 md:py-32 bg-dark rounded-t-[40px] md:rounded-t-[80px]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-6">{t('about.faq')}</h2>
                        <p className="text-white/40 font-black uppercase tracking-widest text-[10px] md:text-xs">{t('about.answersToQuestions')}</p>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                onClick={() => toggleFaq(i)}
                                className={clsx(
                                    "bg-white/5 backdrop-blur-xl rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden",
                                    openFaq === i ? "border-primary/50 bg-white/10" : "border-white/10 hover:bg-white/10"
                                )}
                            >
                                <div className="p-6 md:p-8 flex items-center justify-between gap-4">
                                    <h3 className="text-lg md:text-2xl font-bold text-white leading-tight">{t(`about.faqQ${i}`)}</h3>
                                    <div className={clsx(
                                        "w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all duration-300",
                                        openFaq === i ? "rotate-180 bg-primary/20 text-primary" : ""
                                    )}>
                                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                </div>
                                <div className={clsx(
                                    "px-6 md:px-8 transition-all duration-300 ease-in-out",
                                    openFaq === i ? "pb-8 opacity-100 max-h-96" : "max-h-0 opacity-0 pointer-events-none"
                                )}>
                                    <div className="w-full h-px bg-white/10 mb-6" />
                                    <p className="text-base md:text-lg text-white/60 font-medium leading-relaxed">
                                        {t(`about.faqA${i}`)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team / Contact */}
            <section className="py-24 md:py-32 bg-white px-4 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="relative mb-12 inline-block">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-[32px] mx-auto flex items-center justify-center shadow-inner">
                            <Users className="w-12 h-12 md:w-16 md:h-16 text-primary/40" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg border-4 border-white">
                            <Mail className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="space-y-6 mb-12">
                        <h2 className="text-3xl md:text-5xl font-heading font-black text-dark tracking-tight">{t('about.team.title')}</h2>
                        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                            {t('about.team.description')}
                        </p>
                    </div>

                    <a
                        href="mailto:kontakt@smarthandel.no"
                        className="inline-flex items-center gap-4 px-8 py-4 bg-gray-50 rounded-2xl text-dark font-black tracking-tight hover:bg-gray-100 transition-all border border-gray-100 shadow-sm group"
                    >
                        <Mail className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
                        <span className="text-lg">kontakt@smarthandel.no</span>
                    </a>
                </div>
            </section>

            {/* Footer-like spacing */}
            <div className="h-20 bg-white" />
        </div>
    );
}
