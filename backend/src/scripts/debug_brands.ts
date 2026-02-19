import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
// Trondheim coordinates
const LOCATION = { lat: 63.4305, lng: 10.3951 };

async function testBrands() {
    const items = ['milk', 'bread', 'eple', 'juice'];

    console.log('--- Testing Brands Endpoint ---');

    for (const item of items) {
        console.log(`\n🔍 Checking item: "${item}"`);
        try {
            const res = await axios.get(`${BASE_URL}/products/brands/${encodeURIComponent(item)}`, {
                params: {
                    lat: LOCATION.lat,
                    lng: LOCATION.lng,
                    radius: 10
                }
            });

            console.log(`Status: ${res.status}`);
            console.log(`Count: ${res.data.count}`);
            if (res.data.brands && res.data.brands.length > 0) {
                console.log(`First 3 brands:`, res.data.brands.slice(0, 3).map((b: any) => b.name).join(', '));
            } else {
                console.log('❌ No brands found for this item.');
            }
        } catch (error: any) {
            console.error(`❌ Error checking "${item}":`, error.message);
            if (error.response) console.log('Response:', error.response.data);
        }
    }
}

testBrands();
