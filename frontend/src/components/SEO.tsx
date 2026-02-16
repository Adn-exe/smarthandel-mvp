import React from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
}

const SEO: React.FC<SEOProps> = ({
    title: propTitle,
    description: propDescription,
    image = '/logo-preview.png', // Fallback to a default image
    url = window.location.href,
    type = 'website',
}) => {
    const { t } = useTranslation();

    // Default values from requirements or fallbacks
    const defaultTitle = t('seo.defaultTitle', 'SmartHandel - Spar penger på dagligvarer');
    const defaultDescription = t('seo.defaultDescription', 'AI-drevet prissammenligning og ruteoptimalisering for din dagligvarehandel. Spar tid og penger hver dag.');

    const title = propTitle ? `${propTitle} | SmartHandel` : defaultTitle;
    const description = propDescription || defaultDescription;

    // Twitter handle (optional, can be moved to config)
    const twitterHandle = '@smarthandel';

    return (
        <>
            {/* Standard metadata tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content="SmartHandel" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:site" content={twitterHandle} />
            <meta name="twitter:creator" content={twitterHandle} />

            {/* Additional app tags */}
            <meta name="theme-color" content="#3b82f6" />
        </>
    );
};

export default SEO;
