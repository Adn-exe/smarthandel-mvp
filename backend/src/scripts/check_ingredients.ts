import { KassalProvider } from '../services/providers/KassalProvider.js';
import config from '../config/index.js';

// Mock config for standalone run if needed, or rely on .env loading
// distinct from main app
const run = async () => {
    console.log('Verifying KassalProvider ingredients mapping...');
    const provider = new KassalProvider();

    try {
        // Use the public method to verify the mapping in normalizeProduct
        const results = await provider.searchProducts('Grandiosa Original', { radius: 1000 });

        if (results.length > 0) {
            const product = results[0];
            console.log('\n--- Mapped Product Data ---');
            console.log('Name:', product.name);
            console.log('ID:', product.id);

            console.log('Ingredients Mapped?:', product.ingredients ? '✅ Yes' : '❌ No');
            if (product.ingredients) {
                console.log('Ingredients Preview:', product.ingredients.substring(0, 100) + '...');
            }

            console.log('Allergens Mapped?:', product.allergens && product.allergens.length > 0 ? '✅ Yes' : '❌ No');
            if (product.allergens) {
                console.log('Allergens:', JSON.stringify(product.allergens, null, 2));
            }

        } else {
            console.log('No results found.');
        }

    } catch (err: any) {
        console.error('Error fetching search results:', err.message);
    }
};

run();
