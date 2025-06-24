// Simple test for Ghana NLP translation API
import translationService from './src/services/translationService.js';

async function testTranslation() {
  console.log('Testing Ghana NLP Translation Service...');
  
  try {
    // Test simple English to Twi translation
    const result = await translationService.translate('Hello, how are you?', 'tw', 'en');
    console.log('Translation Result:', result);
    
    // Test disease result translation
    const diseaseResult = {
      plant: 'Tomato',
      disease: 'Late Blight',
      remedy: 'Apply copper-based fungicide spray every 7-10 days'
    };
    
    const translatedResult = await translationService.translateDiseaseResults(diseaseResult, 'tw');
    console.log('Disease Result Translation:', translatedResult);
    
  } catch (error) {
    console.error('Translation Test Error:', error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testTranslation();
}

export { testTranslation };