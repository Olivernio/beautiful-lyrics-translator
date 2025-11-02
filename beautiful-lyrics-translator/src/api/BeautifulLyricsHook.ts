import { logger } from '../utils/logger';
import { waitForElement } from '../utils/helpers';
import { BEAUTIFUL_LYRICS_SELECTORS } from '../utils/constants';

export class BeautifulLyricsHook {
  private observer: MutationObserver | null = null;
  private isBeautifulLyricsActive = false;
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async detectBeautifulLyrics(): Promise<boolean> {
  await this.delay(500);
  
  // Buscar cualquier elemento que contenga letras
  const lyricElements = document.querySelectorAll(BEAUTIFUL_LYRICS_SELECTORS.lyricLine);
  
  if (lyricElements && lyricElements.length > 0) {
    logger.success(`Found ${lyricElements.length} lyric elements!`);
    return true;
  }
  
  return false;
}

  observeLyricsContainer(callback: (container: Element) => void): void {
  const targetNode = document.body;
  
  this.observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element && node.classList.contains('VocalsGroup')) {
            logger.info('🔄 Beautiful Lyrics container changed, re-rendering...');
            callback(node);
          }
        });
      }
    });
  });
  
  this.observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
  
  logger.info('🔍 Observing Beautiful Lyrics container for changes');
}

  
  getLyricsLines(): NodeListOf<Element> | null {
    const lines = document.querySelectorAll(BEAUTIFUL_LYRICS_SELECTORS.lyricLine);
    
    if (lines.length > 0) {
      logger.debug(`Found ${lines.length} lyric lines`);
      return lines;
    }
    
    return null;
  }
  
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      logger.info('Disconnected Beautiful Lyrics observer');
    }
  }
  
  isActive(): boolean {
    return this.isBeautifulLyricsActive;
  }
}
