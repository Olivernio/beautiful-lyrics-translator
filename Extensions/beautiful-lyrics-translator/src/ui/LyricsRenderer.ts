import { ConsolidatedLine } from '../types/translation';
import { logger } from '../utils/logger';
import { BEAUTIFUL_LYRICS_SELECTORS } from '../utils/constants';

export class LyricsRenderer {
  
  renderTranslations(lines: ConsolidatedLine[]): void {
    // Buscar SOLO las líneas dentro del contenedor de Beautiful Lyrics
    const lyricElements = document.querySelectorAll(BEAUTIFUL_LYRICS_SELECTORS.lyricLine);
    
    if (lyricElements.length === 0) {
      logger.warn('No lyric lines found in Beautiful Lyrics container');
      return;
    }
    
    logger.info(`Found ${lyricElements.length} lyric elements, have ${lines.length} translations`);
    
    let translatedCount = 0;
    
    lyricElements.forEach((lyricElement, index) => {
      if (index >= lines.length) return;
      
      const translatedLine = lines[index];
      
      // Verificar si ya existe una traducción para esta línea
      let existingTranslation = lyricElement.nextElementSibling;
      if (existingTranslation && existingTranslation.classList.contains('blt-translation')) {
        existingTranslation.remove();
      }
      
      // Crear elemento de traducción
      const translationElement = document.createElement('div');
      translationElement.className = 'blt-translation';
      translationElement.textContent = translatedLine.translation.full;
      
      // Insertar DESPUÉS de la línea original
      if (lyricElement.parentElement) {
        lyricElement.parentElement.insertBefore(
          translationElement, 
          lyricElement.nextSibling
        );
        translatedCount++;
      }
    });
    
    logger.success(`Rendered ${translatedCount} translations`);
  }
  
  clearTranslations(): void {
    const translations = document.querySelectorAll('.blt-translation');
    translations.forEach(el => el.remove());
    logger.info('Cleared all translations');
  }
  
  updateActiveLine(index: number): void {
    const translations = document.querySelectorAll('.blt-translation');
    
    translations.forEach((el, i) => {
      if (i === index) {
        el.classList.add('blt-active');
      } else {
        el.classList.remove('blt-active');
      }
    });
  }
}
