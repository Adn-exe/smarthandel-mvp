import { KassalProvider } from '../services/providers/KassalProvider.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function deepDebug() {
    const provider = new (KassalProvider as any)();
    const query = 'milk';
    const location = { lat: 63.4305, lng: 10.3951 };

    console.log(`--- DEEP DEBUG: "${query}" ---`);
    const mappedQuery = provider.getMappedQuery(query);
    console.log(`Mapped query: ${mappedQuery}`);

    try {
        // Accessing private api to trace raw response
        const response = await provider.api.get('/products', {
            params: {
                size: 50,
                search: mappedQuery,
                lat: location.lat,
                lng: location.lng,
                km: 10
            }
        });

        const rawProducts = response.data.data || [];
        console.log(`Raw API returned ${rawProducts.length} products.`);

        if (rawProducts.length > 0) {
            console.log('First 5 raw names:', rawProducts.slice(0, 5).map((p: any) => p.name).join(', '));

            const normalized = rawProducts.map((p: any) => provider.normalizeProduct(p));
            console.log('Normalized first 5 names:', normalized.slice(0, 5).map((p: any) => p.name).join(', '));

            // Now manually run scoring to see where they go
            const processed = provider.applyRelevanceScoring(normalized, mappedQuery, { location }, rawProducts);
            console.log(`After relevance scoring and filtering, ${processed.length} products remain.`);

            if (processed.length === 0 && normalized.length > 0) {
                console.log('--- INDIVIDUAL SCORING TRACE ---');
                normalized.slice(0, 10).forEach((p: any, idx: number) => {
                    // Re-run part of applyRelevanceScoring logic to see score
                    console.log(`${idx + 1}. ${p.name} - Price: ${p.price} - Final Score: ${p.relevanceScore}`);
                });
            } else if (processed.length > 0) {
                console.log('Top 3 processed:', processed.slice(0, 3).map((p: any) => `${p.name} (${p.relevanceScore})`).join(', '));
            }
        } else {
            console.log('Checking WITHOUT location...');
            const responseNoLoc = await provider.api.get('/products', {
                params: {
                    size: 50,
                    search: mappedQuery
                }
            });
            console.log(`Raw API (NO LOC) returned ${responseNoLoc.data.data?.length || 0} products.`);
        }
    } catch (error: any) {
        console.error('Debug failed:', error.message);
        if (error.response) console.log('Response data:', error.response.data);
    }
}

deepDebug();
