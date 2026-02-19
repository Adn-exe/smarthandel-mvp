import { aiService } from '../services/aiService.js';

async function checkHealth() {
    console.log('--- CHECKING GEMINI 3.0 FLASH HEALTH ---');
    const isHealthy = await aiService.checkHealth();
    if (isHealthy) {
        console.log('✅ SUCCESS: Gemini 3.0 Flash is responsive.');
    } else {
        console.log('❌ FAILURE: Gemini 3.0 Flash is not responding. Check API key or model name.');
    }

    console.log('\n--- TESTING PARSING WITH GEMINI 3.0 ---');
    try {
        const result = await aiService.parseShoppingQuery('Jeg trenger 2 liter melk og brød');
        console.log('Parsed Query Result:');
        console.log(JSON.stringify(result, null, 2));
        if (result.items.length >= 2) {
            console.log('✅ SUCCESS: Parsing logic is working.');
        } else {
            console.log('❌ FAILURE: Parsing logic returned incomplete results.');
        }
    } catch (err) {
        console.error('❌ ERROR during parsing:', err);
    }
}

checkHealth().catch(console.error);
