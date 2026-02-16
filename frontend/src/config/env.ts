/**
 * Type-safe Environment Configuration
 * Validates required environment variables on startup.
 */

interface Config {
    apiUrl: string;
    mapboxToken?: string;
    enableAnalytics: boolean;
    env: 'development' | 'production' | 'test';
}

const getEnvVar = (key: string, required = true): string => {
    const value = import.meta.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || '';
};

export const config: Config = {
    apiUrl: getEnvVar('VITE_API_URL'),
    mapboxToken: getEnvVar('VITE_MAPBOX_TOKEN', false),
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    env: (import.meta.env.VITE_ENV as Config['env']) || 'development',
};

// Freeze to prevent accidental modification
Object.freeze(config);
