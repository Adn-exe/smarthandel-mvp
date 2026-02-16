
import { GoogleGenerativeAI } from '@google/generative-ai';
import aiService from '../services/aiService.js';
import dotenv from 'dotenv';
import config from '../config/index.js';

dotenv.config();

async function testGemini() {
    console.log('Testing Gemini Integration...');
    console.log(`API Key present: ${!!config.geminiApiKey}`);

    try {
        // Create a local client to list models if possible, or just test a known working model
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);

        console.log('1. Attempting to generate content with gemini-1.5-flash (Known Stable)...');
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent('hello');
            console.log('Success with gemini-1.5-flash:', result.response.text());
        } catch (e: any) {
            console.error('Failed with gemini-1.5-flash:', e.message);
        }

        console.log('\n2. Attempting to generate content with gemini-3-flash-preview (User Requested)...');
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
            const result = await model.generateContent('hello');
            console.log('Success with gemini-3-flash-preview:', result.response.text());
        } catch (e: any) {
            console.error('Failed with gemini-3-flash-preview:', e.message);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testGemini();
