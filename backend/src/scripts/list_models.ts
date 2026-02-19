import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

async function listModels() {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey || '');
    try {
        // The listModels method might not be available in the default client or might require different auth
        // But we can try to hit the models endpoint or just guess a few more.
        console.log('Attempting to check specific models...');
        const modelsToTry = [
            'gemini-3-flash',
            'gemini-3.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-2.0-flash',
            'gemini-1.5-flash'
        ];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                await model.generateContent('ping');
                console.log(`✅ Model found and responsive: ${modelName}`);
            } catch (err: any) {
                console.log(`❌ Model ${modelName} failed: ${err.message?.split('\n')[0]}`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

listModels().catch(console.error);
