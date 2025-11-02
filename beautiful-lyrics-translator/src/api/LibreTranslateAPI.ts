import { logger } from '@utils/logger';

export class LibreTranslateAPI {
  private apiUrl: string;
  
  constructor(apiUrl: string = 'https://libretranslate.de') {
    this.apiUrl = apiUrl;
  }
  
  async translate(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translatedText;
      
    } catch (error) {
      logger.error('Error translating text:', error);
      return text; // Retorna el texto original si falla
    }
  }
  
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: text })
      });
      
      if (!response.ok) {
        throw new Error(`Language detection error: ${response.status}`);
      }
      
      const data = await response.json();
      return data[0]?.language || 'en';
      
    } catch (error) {
      logger.error('Error detecting language:', error);
      return 'en'; // Por defecto inglés
    }
  }
}
