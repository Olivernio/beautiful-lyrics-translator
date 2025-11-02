import { TranslationConfig } from '../types/translation';

export const DEFAULT_CONFIG: TranslationConfig = {
  targetLanguage: 'es',
  autoDetectLanguage: true,
  translateBackgroundVocals: false,
  translateSideVocals: false,
  showOriginalBackground: true,
  preTranslateAll: false,
  cacheEnabled: true,
  apiUrl: 'https://libretranslate.com'
};

export const BEAUTIFUL_LYRICS_SELECTORS = {
  container: '.Root__lyrics-cinema', // Contenedor principal
  lyricLine: '.Root__lyrics-cinema [class*="LineClamp"]', // LINEAS SOLO DENTRO DEL CONTENEDOR
  activeLine: '[class*="active"]',
  background: '[data-background="true"]',
  sideVocal: '[data-side-vocal="true"]'
};

export const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

export const API_TIMEOUT_MS = 10000; // 10 segundos

export const MAX_RETRIES = 3;

export const SUPPORTED_LANGUAGES = [
  'es', 'en', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'
];
