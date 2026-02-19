import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

async function listAllModels() {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey || '');
    try {
        console.log('Fetching model list...');
        // Note: The @google/generative-ai SDK doesn't expose listModels directly on the main class
        // It's usually a separate fetch to the REST endpoint or via the admin SDK.
        // However, we can try to use standard fetch to the models endpoint.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiApiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (Supported: ${m.supportedGenerationMethods.join(', ')})`);
            });
        } else {
            console.log('No models found or error in response:', JSON.stringify(data));
        }
    } catch (err) {
        console.error('Error listing models:', err);
    }
}

listAllModels().catch(console.error);
