import { Shield, Zap, TrendingUp, Users, HelpCircle, Mail } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import SEO from '../components/SEO';

export function About() {
    const { t } = useTranslation();

    return (
        <div className="bg-white">
            <SEO title={t('seo.aboutTitle')} description={t('about.hero.description')} />
            {/* Hero / Mission */}
            <section className="bg-primary/5 py-20 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-6">
                        <Trans i18nKey="about.hero.title">
                            We help people <span className="text-primary">save money</span> on groceries
                        </Trans>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {t('about.hero.description')}
                    </p>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-dark mb-4">{t('about.howItWorks.title')}</h2>
                    <p className="text-gray-600">{t('about.howItWorks.subtitle')}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-10">
                    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                            < Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t('about.howItWorks.aiSearch.title')}</h3>
                        <p className="text-gray-500">
                            {t('about.howItWorks.aiSearch.description')}
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t('about.howItWorks.comparison.title')}</h3>
                        <p className="text-gray-500">
                            {t('about.howItWorks.comparison.description')}
                        </p>
                    </div>

                    <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-3">{t('about.howItWorks.privacy.title')}</h3>
                        <p className="text-gray-500">
                            {t('about.howItWorks.privacy.description')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-dark text-white py-20">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-5xl font-bold text-primary mb-2">15k+</div>
                        <div className="text-gray-400">{t('about.stats.users')}</div>
                    </div>
                    <div>
                        <div className="text-5xl font-bold text-secondary mb-2">2.5M</div>
                        <div className="text-gray-400">{t('about.stats.saved')}</div>
                    </div>
                    <div>
                        <div className="text-5xl font-bold text-accent mb-2">100%</div>
                        <div className="text-gray-400">{t('about.stats.coverage')}</div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-dark mb-4">{t('about.faq.title')}</h2>
                </div>

                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            {t('about.faq.q1.question')}
                        </h3>
                        <p className="text-gray-600 ml-7">
                            {t('about.faq.q1.answer')}
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            {t('about.faq.q2.question')}
                        </h3>
                        <p className="text-gray-600 ml-7">
                            {t('about.faq.q2.answer')}
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            {t('about.faq.q3.question')}
                        </h3>
                        <p className="text-gray-600 ml-7">
                            {t('about.faq.q3.answer')}
                        </p>
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
