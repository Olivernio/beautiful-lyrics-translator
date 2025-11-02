import { TranslationService } from '../translation/TranslationService';
import { BeautifulLyricsHook } from '../api/BeautifulLyricsHook';
import { SpotifyLyricsAPI } from '../api/SpotifyLyricsAPI';
import { LyricsRenderer } from '../ui/LyricsRenderer';
import { DEFAULT_CONFIG } from '../utils/constants';
import { logger } from '../utils/logger';
import '../../styles/main.scss';

class BeautifulLyricsTranslator {
  private translationService: TranslationService;
  private beautifulLyricsHook: BeautifulLyricsHook;
  private spotifyLyricsAPI: SpotifyLyricsAPI;
  private lyricsRenderer: LyricsRenderer;
  private currentTrackUri: string | null = null;
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;
  
  constructor() {
    this.translationService = new TranslationService(DEFAULT_CONFIG);
    this.beautifulLyricsHook = new BeautifulLyricsHook();
    this.spotifyLyricsAPI = new SpotifyLyricsAPI();
    this.lyricsRenderer = new LyricsRenderer();
    logger.info('Beautiful Lyrics Translator initialized');
  }
  
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      await this.waitForSpicetify();
      this.setupTrackChangeListener();
      
      logger.info('Waiting 3s before first processing...');
      await this.delay(3000);
      await this.processCurrentTrack();
      
      this.isInitialized = true;
      logger.success('Extension fully initialized');
      
    } catch (error) {
      logger.error('Failed to initialize extension:', error);
    }
  }
  
  private async waitForSpicetify(): Promise<void> {
    return new Promise((resolve) => {
      const checkSpicetify = () => {
        if (typeof Spicetify !== 'undefined' && Spicetify?.Player) {
          logger.info('Spicetify API ready');
          resolve();
        } else {
          setTimeout(checkSpicetify, 100);
        }
      };
      checkSpicetify();
    });
  }
  
  private setupTrackChangeListener(): void {
    Spicetify.Player.addEventListener('songchange', () => {
      logger.info('🎵 Song changed detected!');
      this.retryCount = 0;
      setTimeout(() => this.processCurrentTrack(), 2000);
    });
    
    logger.info('Track change listener registered');
  }
  
    private getTrackUriMultipleMethods(): string | null {
    // Método 1: Spicetify.Player.data.item
    try {
      if (Spicetify?.Player?.data?.item?.uri) {
        logger.info('Got URI from Player.data.item');
        return Spicetify.Player.data.item.uri;
      }
    } catch (e) {
      logger.debug('Method 1 failed');
    }
    
    // Método 2: Spicetify.Player.data.track
    try {
      if (Spicetify?.Player?.data?.track?.uri) {
        logger.info('Got URI from Player.data.track');
        return Spicetify.Player.data.track.uri;
      }
    } catch (e) {
      logger.debug('Method 2 failed');
    }
    
    // Método 3: Spicetify.Player.data (directo)
    try {
      if (Spicetify?.Player?.data?.uri) {
        logger.info('Got URI from Player.data');
        return Spicetify.Player.data.uri;
      }
    } catch (e) {
      logger.debug('Method 3 failed');
    }
    
    // Método 4: Platform API
    try {
      if (Spicetify?.Platform?.PlayerAPI?._state?.item?.uri) {
        logger.info('Got URI from Platform API');
        return Spicetify.Platform.PlayerAPI._state.item.uri;
      }
    } catch (e) {
      logger.debug('Method 4 failed');
    }
    
    // Método 5: Desde la cola
    try {
      if (Spicetify?.Queue?.track?.uri) {
        logger.info('Got URI from Queue');
        return Spicetify.Queue.track.uri;
      }
    } catch (e) {
      logger.debug('Method 5 failed');
    }
    
    // Método 6: Desde el estado global (con chequeo de existencia)
    try {
      if (Spicetify?.Player?.getState) {  // ← ARREGLADO: verificamos que existe
        const state = Spicetify.Player.getState();
        if (state?.item?.uri) {
          logger.info('Got URI from Player state');
          return state.item.uri;
        }
      }
    } catch (e) {
      logger.debug('Method 6 failed');
    }
    
    return null;
  }

  
  private async processCurrentTrack(): Promise<void> {
    try {
      logger.info('--- START PROCESSING TRACK ---');
      
      await this.delay(500);
      
      // Intentar obtener URI con múltiples métodos
      const trackUri = this.getTrackUriMultipleMethods();
      
      if (!trackUri) {
        logger.error('❌ Could not get track URI after trying all methods');
        
        // Debug: Mostrar toda la estructura disponible
        logger.info('Spicetify object:', Spicetify);
        logger.info('Player object:', Spicetify?.Player);
        logger.info('Player.data:', Spicetify?.Player?.data);
        
        return;
      }
      
      if (trackUri === this.currentTrackUri) {
        logger.debug('Same track, skipping...');
        return;
      }
      
      this.currentTrackUri = trackUri;
      const trackId = trackUri.split(':').pop() || '';
      
      logger.info(`✅ Processing track ID: ${trackId}`);
      logger.info(`📀 Full URI: ${trackUri}`);
      
      this.lyricsRenderer.clearTranslations();
      
      logger.info('🔍 Looking for Beautiful Lyrics...');
      const isBeautifulLyricsActive = await this.detectBeautifulLyricsWithRetry();
      
      if (!isBeautifulLyricsActive) {
        logger.warn('⚠️ Beautiful Lyrics not active');
        return;
      }
      
      logger.info('📥 Fetching lyrics from Spotify API...');
      const lyrics = await this.spotifyLyricsAPI.getLyrics(trackUri);
      
      if (!lyrics || !lyrics.lines || lyrics.lines.length === 0) {
        logger.warn('❌ No lyrics available for this track');
        return;
      }
      
      logger.success(`✅ Found ${lyrics.lines.length} lyric lines!`);
      
      logger.info(`🌐 Translating to ${DEFAULT_CONFIG.targetLanguage}...`);
      const translatedLines = await this.translationService.translateLyrics(lyrics.lines);
      
      logger.success(`✅ Translated ${translatedLines.length} lines`);
      
      await this.delay(1000);
      
      logger.info('🎨 Rendering translations...');
      this.lyricsRenderer.renderTranslations(translatedLines);
      
      logger.success('🎉 ✨ Translation complete and rendered!');
      logger.info('--- END PROCESSING TRACK ---');
      
    } catch (error) {
      logger.error('💥 Error processing track:', error);
    }
  }
  
  private async detectBeautifulLyricsWithRetry(): Promise<boolean> {
    while (this.retryCount < this.maxRetries) {
      logger.info(`Attempt ${this.retryCount + 1}/${this.maxRetries}...`);
      
      const detected = await this.beautifulLyricsHook.detectBeautifulLyrics();
      
      if (detected) {
        logger.success('✅ Beautiful Lyrics found!');
        return true;
      }
      
      this.retryCount++;
      
      if (this.retryCount < this.maxRetries) {
        logger.warn(`Retry in 1s...`);
        await this.delay(1000);
      }
    }
    
    return false;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

(async () => {
  logger.info('🚀 Starting Beautiful Lyrics Translator...');
  const translator = new BeautifulLyricsTranslator();
  await translator.init();
})();
