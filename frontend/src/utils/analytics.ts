/**
 * Simple Analytics Utility for SmartHandel MVP
 * For now, this just logs to the console.
 * Can be easily integrated with Google Analytics, Mixpanel, or Plausible later.
 */

type AnalyticsEvent = 'search_performed' | 'route_optimized' | 'store_selected' | 'share_clicked' | 'error_occurred';

interface AnalyticsProperties {
    [key: string]: string | number | boolean | null | undefined;
}

export const trackPageView = (page: string) => {
    if (import.meta.env.DEV) {
        console.log(`[Analytics] Page View: ${page}`);
    } else {
        // Production: Send to analytics service
        console.log(`[Analytics] Recording page view for: ${page}`);
    }
};

export const trackEvent = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
    if (import.meta.env.DEV) {
        console.log(`[Analytics] Event: ${event}`, properties);
    } else {
        // Production: Send to analytics service
        console.log(`[Analytics] Recording event: ${event}`, properties);
    }
};

export const trackError = (error: Error, context?: string) => {
    if (import.meta.env.DEV) {
        console.error(`[Analytics] Error in ${context || 'unknown context'}:`, error);
    } else {
        // Production: Send to monitoring service
        console.log(`[Analytics] Recording error:`, {
            message: error.message,
            context,
            timestamp: new Date().toISOString()
        });
    }
};
