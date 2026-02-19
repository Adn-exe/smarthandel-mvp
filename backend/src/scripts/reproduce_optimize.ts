
import axios from 'axios';

async function reproduce() {
    const url = 'http://localhost:3001/api/route/optimize';
    const payload = {
        items: [
            { name: 'Milk', quantity: 1 },
            { name: 'Bread', quantity: 1 },
            { name: 'Eggs', quantity: 1 },
            { name: 'Cheese', quantity: 1 },
            { name: 'Apple', quantity: 5 },
            { name: 'Banana', quantity: 1 },
            { name: 'Potato', quantity: 3 },
            { name: 'Sugar', quantity: 1 },
            { name: 'Coffee', quantity: 1 },
            { name: 'Pasta', quantity: 2 }
        ],
        userLocation: { lat: 63.4305, lng: 10.3951 }
    };

    console.log('Sending optimization request...');
    try {
        const response = await axios.post(url, payload);
        console.log('Success!', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
    } catch (error: any) {
        console.error('Failed!', error.response?.status, error.response?.data);
    }
}

reproduce();
