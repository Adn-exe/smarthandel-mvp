
import aiService from '../services/aiService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
    console.log('Testing Gemini Integration...');

    try {
        console.log('1. Testing Health Check...');
        const health = await aiService.checkHealth();
        console.log(`Health Check Result: ${health}`);

        if (!health) {
            console.warn('Health check failed. Check if GEMINI_API_KEY is set correctly.');
        }

        console.log('\n2. Listing Available Models...');
        // @ts-ignore
        const modelList = await aiService.client.getGenerativeModel({ model: 'gemini-1.5-flash' }).apiKey ? "Key Present" : "Key Missing";
        console.log("Client initialized.");
        // We cannot easily list models with the current instance without a specific manager, 
        // but we can try a known working model to see if it's the key or the model name.

        console.log('\n3. Testing Parse Shopping Query...');
        const query = 'I need 2 liters of milk and a loaf of bread';
        console.log(`Query: "${query}"`);
        try {
            const result = await aiService.parseShoppingQuery(query);
            console.log('Result:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Parse Query Failed:', error);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testGemini();
