// Tipos para las letras de Spotify
export interface SpotifyLyricLine {
  startTimeMs: string;  // ← CAMBIAR de number a string
  endTimeMs: string;    // ← CAMBIAR de number a string
  words: string;
  syllables?: Syllable[];
  background?: string; // Coros
  sideVocal?: string; // Voces secundarias
}

export interface Syllable {
  chars: string;
  startTimeMs: string;  // ← CAMBIAR de number a string
  endTimeMs: string;    // ← CAMBIAR de number a string
}

export interface SpotifyLyrics {
  syncType: 'LINE_SYNCED' | 'SYLLABLE_SYNCED' | 'UNSYNCED';
  lines: SpotifyLyricLine[];
  provider: string;
  providerLyricsId: string;
  providerDisplayName: string;
  syncLyricsUri: string;
  isDenseTypeface: boolean;
  alternatives: any[];
  language: string;
  isRtlLanguage: boolean;
  fullscreenAction: string;
}
