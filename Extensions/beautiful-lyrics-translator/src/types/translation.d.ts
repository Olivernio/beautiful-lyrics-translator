import { SpotifyLyricLine } from './lyrics';

export interface TranslationConfig {
  targetLanguage: string;
  autoDetectLanguage: boolean;
  translateBackgroundVocals: boolean;
  translateSideVocals: boolean;
  showOriginalBackground: boolean;
  preTranslateAll: boolean;
  cacheEnabled: boolean;
  apiUrl: string;
}

export interface ConsolidatedLine {
  original: {
    main: string;
    background?: string;
    sideVocal?: string;
    syllables?: any[];
  };
  translation: {
    full: string; // Línea consolidada traducida
  };
  timing: {
    startTimeMs: string;  // ← CAMBIADO a string
    endTimeMs: string;    // ← CAMBIADO a string
  };
  effectType: 'karaoke' | 'line' | 'static';
}

export interface TranslationCache {
  [trackId: string]: {
    [language: string]: {
      lines: ConsolidatedLine[];
      timestamp: number;
    };
  };
}
