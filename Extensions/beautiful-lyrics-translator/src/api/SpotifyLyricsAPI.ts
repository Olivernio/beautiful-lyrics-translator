import { SpotifyLyrics, SpotifyLyricLine } from "../types/lyrics";
import { logger } from "../utils/logger";
import { BEAUTIFUL_LYRICS_SELECTORS } from "../utils/constants";

export class SpotifyLyricsAPI {
  async getLyrics(trackId: string): Promise<SpotifyLyrics | null> {
    try {
      // Buscar el contenedor de Beautiful Lyrics
      const lyricsContainer = document.querySelector(".Root__lyrics-cinema");

      if (!lyricsContainer) {
        logger.warn("Beautiful Lyrics container not found");
        return null;
      }

      // Buscar todos los VocalsGroup dentro del contenedor
      const vocalsGroups = lyricsContainer.querySelectorAll(".VocalsGroup");

      if (!vocalsGroups || vocalsGroups.length === 0) {
        logger.warn("No VocalsGroup elements found");
        return null;
      }

      logger.success(
        `Found ${vocalsGroups.length} vocal groups in Beautiful Lyrics`
      );

      const lines: SpotifyLyricLine[] = [];

      vocalsGroups.forEach((group) => {
        // Buscar la voz principal dentro del grupo
        const vocals = group.querySelector(".Vocals.Lead");
        if (!vocals) return;

        // Extraer el texto completo
        const text = vocals.textContent?.trim() || "";

        if (text) {
          lines.push({
            startTimeMs: "0", // Placeholder
            words: text,
            syllables: [],
            endTimeMs: "0", // Placeholder
          });
        }
      });

      logger.success(`Extracted ${lines.length} lines from Beautiful Lyrics`);

      return {
        syncType: "LINE_SYNCED",
        lines,
        provider: "beautiful-lyrics",
        providerLyricsId: trackId,
        providerDisplayName: "Beautiful Lyrics",
        syncLyricsUri: "",
        isDenseTypeface: false,
        alternatives: [],
        language: "unknown",
        isRtlLanguage: false,
        fullscreenAction: "FULLSCREEN_LYRICS",
      };
    } catch (error) {
      logger.error("Error getting lyrics from Beautiful Lyrics:", error);
      return null;
    }
  }

  private getLyricsFromBeautifulLyricsDOM(): SpotifyLyrics | null {
    try {
      // Buscar todas las líneas de letras en Beautiful Lyrics
      const lyricElements = document.querySelectorAll(
        BEAUTIFUL_LYRICS_SELECTORS.lyricLine
      );

      if (!lyricElements || lyricElements.length === 0) {
        logger.debug("No lyric elements found in DOM");
        return null;
      }

      logger.debug(`Found ${lyricElements.length} lyric elements in DOM`);

      const lines: SpotifyLyricLine[] = [];

      lyricElements.forEach((element, index) => {
        const text = element.textContent?.trim() || "";

        if (text && text.length > 0) {
          lines.push({
            startTimeMs: (index * 3000).toString(), // Aproximado: 3 segundos por línea
            words: text,
            syllables: [],
            endTimeMs: ((index + 1) * 3000).toString(),
          });
        }
      });

      if (lines.length === 0) {
        logger.debug("No valid lines extracted from DOM");
        return null;
      }

      return {
        syncType: "LINE_SYNCED",
        lines: lines,
        provider: "BeautifulLyrics",
        providerLyricsId: "",
        providerDisplayName: "Beautiful Lyrics",
        syncLyricsUri: "",
        isDenseTypeface: false,
        alternatives: [],
        language: "auto",
        isRtlLanguage: false,
        fullscreenAction: "FULLSCREEN_LYRICS",
      };
    } catch (error) {
      logger.error("Error reading from DOM:", error);
      return null;
    }
  }
}
