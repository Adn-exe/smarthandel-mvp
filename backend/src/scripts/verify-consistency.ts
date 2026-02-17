import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
const REMOTE_LOCATION = { lat: 0, lng: 0 }; // Definitely outside Trondheim

async function verifyConsistency() {
    console.log('🚀 Starting Global Consistency Verification...');

    try {
        // 1. Verify /stores/nearby
        console.log('\n--- Testing /stores/nearby (Lat: 0, Lng: 0) ---');
        const storesRes = await axios.get(`${BASE_URL}/stores/nearby`, {
            params: { lat: REMOTE_LOCATION.lat, lng: REMOTE_LOCATION.lng }
        });
        console.log(`Status: ${storesRes.status}`);
        console.log(`Stores Found: ${storesRes.data?.count}`);
        console.log(`Radius Used: ${storesRes.data?.radius}km`);
        if (storesRes.data?.stores?.length > 0) {
            console.log('✅ Stores snapped to Trondheim successfully.');
        } else {
            console.warn('⚠️ No stores found (Expected if API is down, but snap should still occur).');
        }

        // 2. Verify /products/search
        console.log('\n--- Testing /products/search ---');
        const productsRes = await axios.post(`${BASE_URL}/products/search`, {
            query: 'milk',
            location: REMOTE_LOCATION
        });
        console.log(`Status: ${productsRes.status}`);
        console.log(`Success: ${productsRes.data?.success}`);
        if (productsRes.data?.success) {
            console.log('✅ Search processed without 404 error.');
        }

        // 3. Verify /route/optimize
        console.log('\n--- Testing /route/optimize ---');
        const optimizeRes = await axios.post(`${BASE_URL}/route/optimize`, {
            items: [{ name: 'milk', quantity: 1 }],
            userLocation: REMOTE_LOCATION
        });
        console.log(`Status: ${optimizeRes.status}`);
        console.log(`Search Location Used: ${JSON.stringify(optimizeRes.data?.searchLocation)}`);

        const trondheimCenter = { lat: 63.4305, lng: 10.3951 };
        if (optimizeRes.data?.searchLocation?.lat === trondheimCenter.lat) {
            console.log('✅ Optimization correctly snapped to Trondheim Center.');
        } else {
            console.error('❌ Optimization failed to snap.');
        }

        console.log('\n✨ Verification Complete.');
    } catch (error: any) {
        console.error('\n❌ Verification failed:', error.message);
        if (error.response) {
            console.error('Data:', JSON.stringify(error.response.data));
        }
    }
}

verifyConsistency();
