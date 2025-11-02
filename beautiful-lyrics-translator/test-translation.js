// Script de prueba rápida
async function testTranslation() {
  const text = "I want you to stay";
  const targetLang = "es";
  
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      })
    });
    
    const data = await response.json();
    console.log('Translation:', data.translatedText);
  } catch (error) {
    console.error('Error:', error);
  }
}

testTranslation();
