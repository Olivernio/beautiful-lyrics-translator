import { ConsolidatedLine, TranslationConfig } from '../types/translation';
import { SpotifyLyricLine } from '../types/lyrics';
import { logger } from '../utils/logger';

export class TranslationService {
  private config: TranslationConfig;

  constructor(config: TranslationConfig) {
    this.config = config;
  }

  async translateLyrics(lines: SpotifyLyricLine[]): Promise<ConsolidatedLine[]> {
    logger.info(`Translating to ${this.config.targetLanguage}...`);
    
    const consolidatedLines: ConsolidatedLine[] = [];
    
    for (const line of lines) {
      try {
        // Traducir la línea consolidada
        const translatedText = await this.translate(
          line.words,
          this.config.targetLanguage
        );
        
        consolidatedLines.push({
          original: {
            main: line.words,
            background: line.background,
            sideVocal: line.sideVocal,
            syllables: line.syllables
          },
          translation: {
            full: translatedText
          },
          timing: {
            startTimeMs: line.startTimeMs,
            endTimeMs: line.endTimeMs,
          },
          effectType: this.detectEffectType(line)
        });
        
      } catch (error) {
        logger.error('Error translating line:', error);
        // En caso de error, usar el texto original
        consolidatedLines.push({
          original: {
            main: line.words,
            background: line.background,
            sideVocal: line.sideVocal,
            syllables: line.syllables
          },
          translation: {
            full: line.words // Fallback al original
          },
          timing: {
            startTimeMs: line.startTimeMs,
            endTimeMs: line.endTimeMs,
          },
          effectType: this.detectEffectType(line)
        });
      }
    }
    
    logger.success(`Translated ${consolidatedLines.length} lines`);
    return consolidatedLines;
  }

  private async translate(text: string, targetLang: string): Promise<string> {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      // Usar Google Translate API (método público sin CORS)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // La respuesta de Google Translate es un array anidado
      // data[0] contiene los pares [traducción, original]
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      return text; // Fallback
      
    } catch (error) {
      logger.error('Error translating text:', error);
      return text; // Fallback al original en caso de error
    }
  }

  private detectEffectType(line: SpotifyLyricLine): 'karaoke' | 'line' | 'static' {
    if (line.syllables && line.syllables.length > 0) {
      return 'karaoke';
    }
    return 'line';
  }

  updateConfig(newConfig: Partial<TranslationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Translation config updated', newConfig);
  }
}
