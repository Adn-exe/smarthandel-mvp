import { Search, Sparkles, List, TrendingDown, Target, ArrowRight, Users, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';

export function About() {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title={t('about.title')}
                description={t('about.mission')}
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-gradient-radial from-primary/5 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 md:mb-8 animate-reveal">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest">{t('about.badge')}</span>
                    </div>

                    <h1 className="text-3xl md:text-6xl font-heading font-black text-dark mb-6 tracking-tight leading-[1.1] animate-reveal [animation-delay:200ms]">
                        {t('about.heroTitle')} <br className="hidden md:block" />
                        <span className="text-primary">{t('about.heroSubtitle')}</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base md:text-xl text-gray-500 font-medium leading-relaxed animate-reveal [animation-delay:400ms]">
                        {t('about.heroDescription')}
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 md:py-24 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
                        <div className="space-y-6 md:space-y-8 animate-reveal">
                            <h2 className="text-2xl md:text-4xl font-heading font-extrabold text-dark tracking-tight">
                                {t('about.ourMission')}
                            </h2>
                            <div className="h-2 w-20 bg-primary rounded-full"></div>
                            <p className="text-base md:text-lg text-gray-600 font-medium leading-relaxed">
                                {t('about.missionDescription1')}
                            </p>
                            <p className="text-base md:text-lg text-gray-600 font-medium leading-relaxed">
                                {t('about.missionDescription2')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button className="bg-dark text-white px-8 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-black/10">
                                    {t('common.startSearching')}
                                </button>
                                <button className="border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold hover:bg-white hover:border-dark transition-all">
                                    {t('about.viewPartners')}
                                </button>
                            </div>
                        </div>

                        <div className="relative animate-reveal [animation-delay:400ms]">
                            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl rotate-3">
                                <div className="absolute inset-0 bg-primary flex items-center justify-center p-8 md:p-12">
                                    <div className="text-center text-white space-y-4 md:space-y-6">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-xl rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto">
                                            <Target className="w-8 h-8 md:w-10 md:h-10" />
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black">100%</h3>
                                        <p className="text-sm md:text-base font-bold text-white/80 uppercase tracking-widest">{t('about.transparency')}</p>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 md:w-32 md:h-32 bg-secondary/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-24 h-24 md:w-32 md:h-32 bg-primary/20 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-heading font-extrabold text-dark tracking-tight mb-4">{t('about.howItWorks')}</h2>
                        <p className="text-gray-500 font-medium uppercase tracking-widest text-[10px] md:text-xs">{t('about.threeSimpleSteps')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            { icon: Search, title: t('about.step1Title'), desc: t('about.step1Desc') },
                            { icon: List, title: t('about.step2Title'), desc: t('about.step2Desc') },
                            { icon: TrendingDown, title: t('about.step3Title'), desc: t('about.step3Desc') }
                        ].map((step, idx) => (
                            <div key={idx} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-xl shadow-gray-50 space-y-4 md:space-y-6 transition-all hover:-translate-y-2">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <step.icon className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-dark">{step.title}</h3>
                                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 bg-dark">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-4xl font-heading font-black text-white mb-4">{t('about.faq')}</h2>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] md:text-xs">{t('about.answersToQuestions')}</p>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 transition-all hover:bg-white/10 group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base md:text-xl font-bold text-white pr-8">{t(`about.faqQ${i}`)}</h3>
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40 group-hover:text-white group-hover:rotate-90 transition-all">
                                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                </div>
                                <p className="mt-4 text-sm md:text-base text-white/50 font-medium leading-relaxed hidden group-hover:block animate-in slide-in-from-top-2">
                                    {t(`about.faqA${i}`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team / Contact */}
            <section className="py-20 bg-gray-50 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-dark mb-2">{t('about.team.title')}</h2>
                    <p className="text-gray-600 mb-8">
                        {t('about.team.description')}
                    </p>

                    <a href="mailto:kontakt@smarthandel.no" className="btn btn-outline gap-2 inline-flex">
                        <Mail className="w-4 h-4" />
                        kontakt@smarthandel.no
                    </a>
                </div>
            </section>
        </div>
    );
}
