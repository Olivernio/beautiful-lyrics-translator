import { SpotifyLyricLine } from '../types/lyrics';

/**
 * Consolida todas las voces (principal, coros, secundarias) en una sola línea
 */
export function consolidateLine(line: SpotifyLyricLine): string {
  let consolidated = line.words;
  
  if (line.background) {
    consolidated += ` (${line.background})`;
  }
  
  if (line.sideVocal) {
    consolidated += ` [${line.sideVocal}]`;
  }
  
  return consolidated;
}

/**
 * Detecta el tipo de efecto según los datos de la línea
 */
export function detectEffectType(line: SpotifyLyricLine): 'karaoke' | 'line' | 'static' {
  if (line.syllables && line.syllables.length > 0) {
    return 'karaoke';
  } else if (line.startTimeMs !== undefined && line.endTimeMs !== undefined) {
    return 'line';
  }
  return 'static';
}

/**
 * Espera a que un elemento aparezca en el DOM
 */
export function waitForElement(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: Element ${selector} not found`));
      } else {
        setTimeout(checkElement, 100);
      }
    };
    
    checkElement();
  });
}

/**
 * Genera un ID único para el track actual
 */
export function getCurrentTrackId(): string | null {
  const uri = Spicetify?.Player?.data?.track?.uri;
  return uri ? uri.split(':').pop() || null : null;
}
