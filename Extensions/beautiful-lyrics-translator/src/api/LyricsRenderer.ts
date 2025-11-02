import { ConsolidatedLine } from '../types/translation';
import { logger } from '../utils/logger';

export class LyricsRenderer {
  
  renderTranslations(lines: ConsolidatedLine[]): void {
    const lyricsLines = document.querySelectorAll('.lyrics-lyricsContent-lyric');
    
    if (lyricsLines.length === 0) {
      logger.warn('No lyrics lines found to render translations');
      return;
    }
    
    lyricsLines.forEach((lineElement, index) => {
      if (index >= lines.length) return;
      
      const translatedLine = lines[index];
      
      // Verificar si ya existe una traducción
      const existingTranslation = lineElement.querySelector('.blt-translation');
      if (existingTranslation) {
        existingTranslation.remove();
      }
      
      // Crear elemento de traducción
      const translationElement = document.createElement('div');
      translationElement.className = 'blt-translation';
      translationElement.textContent = translatedLine.translation.full;
      translationElement.style.opacity = '0';
      
      // Añadir al DOM
      lineElement.appendChild(translationElement);
      
      // Animar entrada
      requestAnimationFrame(() => {
        translationElement.style.transition = 'opacity 0.3s ease';
        translationElement.style.opacity = '0.85';
      });
    });
    
    logger.success(`Rendered ${lyricsLines.length} translations`);
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
