// import { TranslationService } from '../translation/TranslationService';
// import { BeautifulLyricsHook } from '../api/BeautifulLyricsHook';
// import { SpotifyLyricsAPI } from '../api/SpotifyLyricsAPI';
// import { LyricsRenderer } from '../ui/LyricsRenderer';
// import { DEFAULT_CONFIG } from '../utils/constants';
// import { logger } from '../utils/logger';
// import '../../styles/main.scss';

// class BeautifulLyricsTranslator {
//   private translationService: TranslationService;
//   private beautifulLyricsHook: BeautifulLyricsHook;
//   private spotifyLyricsAPI: SpotifyLyricsAPI;
//   private lyricsRenderer: LyricsRenderer;
//   private currentTrackUri: string | null = null;
//   private isInitialized = false;
//   private retryCount = 0;
//   private maxRetries = 3;
  
//   constructor() {
//     this.translationService = new TranslationService(DEFAULT_CONFIG);
//     this.beautifulLyricsHook = new BeautifulLyricsHook();
//     this.spotifyLyricsAPI = new SpotifyLyricsAPI();
//     this.lyricsRenderer = new LyricsRenderer();
//     logger.info('Beautiful Lyrics Translator initialized');
//   }
  
//   async init(): Promise<void> {
//     if (this.isInitialized) {
//       return;
//     }
    
//     try {
//       await this.waitForSpicetify();
//       this.setupTrackChangeListener();
      
//       // Esperar un poco antes de procesar
//       await this.delay(2000);
//       await this.processCurrentTrack();
      
//       this.isInitialized = true;
//       logger.success('Extension fully initialized');
      
//     } catch (error) {
//       logger.error('Failed to initialize extension:', error);
//     }
//   }
  
//   private async waitForSpicetify(): Promise<void> {
//     return new Promise((resolve) => {
//       const checkSpicetify = () => {
//         if (typeof Spicetify !== 'undefined' && Spicetify?.Player) {
//           resolve();
//         } else {
//           setTimeout(checkSpicetify, 100);
//         }
//       };
//       checkSpicetify();
//     });
//   }
  
//   private setupTrackChangeListener(): void {
//     Spicetify.Player.addEventListener('songchange', () => {
//       logger.info('Song changed, processing new track...');
//       this.retryCount = 0;
//       // Esperar un poco para que Beautiful Lyrics renderice
//       setTimeout(() => this.processCurrentTrack(), 1500);
//     });
//   }
  
//     private async processCurrentTrack(): Promise<void> {
//     try {
//       // Esperar un momento para que Spotify cargue los datos
//       await this.delay(500);
      
//       // Obtener URI del track directamente con múltiples métodos
//       let trackUri: string | undefined;
      
//       // Método 1: Spicetify API
//       if (Spicetify?.Player?.data?.track?.uri) {
//         trackUri = Spicetify.Player.data.track.uri;
//       }
      
//       // Método 2: Desde el contexto actual
//       if (!trackUri && Spicetify?.Platform?.PlayerAPI?._state?.item?.uri) {
//         trackUri = Spicetify.Platform.PlayerAPI._state.item.uri;
//       }
      
//       // Método 3: Desde la URL
//       if (!trackUri) {
//         const urlMatch = window.location.pathname.match(/\/track\/([a-zA-Z0-9]+)/);
//         if (urlMatch && urlMatch[1]) {
//           trackUri = `spotify:track:${urlMatch[1]}`;
//         }
//       }
      
//       if (!trackUri) {
//         logger.warn('Could not get track URI - trying again in 2s');
//         setTimeout(() => this.processCurrentTrack(), 2000);
//         return;
//       }

      
//       if (!trackData || !trackData.uri) {
//         logger.warn('No track data available');
//         return;
//       }
      
//       const trackUri = trackData.uri;
      
//       if (trackUri === this.currentTrackUri) {
//         logger.debug('Same track, skipping...');
//         return;
//       }
      
//       this.currentTrackUri = trackUri;
//       const trackId = trackUri.split(':').pop() || '';
      
//       logger.info(`Processing track: ${trackId}`);
//       logger.info(`Track URI: ${trackUri}`);
      
//       // Limpiar traducciones anteriores
//       this.lyricsRenderer.clearTranslations();
      
//       // Detectar Beautiful Lyrics con reintentos
//       const isBeautifulLyricsActive = await this.detectBeautifulLyricsWithRetry();
      
//       if (!isBeautifulLyricsActive) {
//         logger.warn('Beautiful Lyrics not active - skipping translation');
//         return;
//       }
      
//       logger.info('Fetching lyrics from Spotify...');
      
//       // Obtener letras de Spotify
//       const lyrics = await this.spotifyLyricsAPI.getLyrics(trackUri);
      
//       if (!lyrics || !lyrics.lines || lyrics.lines.length === 0) {
//         logger.warn('No lyrics available for this track');
//         return;
//       }
      
//       logger.success(`Found ${lyrics.lines.length} lyric lines`);
      
//       // Traducir letras
//       logger.info(`Translating to ${DEFAULT_CONFIG.targetLanguage}...`);
//       const translatedLines = await this.translationService.translateLyrics(
//         lyrics,
//         trackId
//       );
      
//       logger.success(`Translated ${translatedLines.length} lines`);
      
//       // Esperar a que Beautiful Lyrics termine de renderizar
//       await this.delay(1000);
      
//       // Renderizar traducciones
//       this.lyricsRenderer.renderTranslations(translatedLines);
      
//       logger.success('✨ Translation complete and rendered!');
      
//     } catch (error) {
//       logger.error('Error processing track:', error);
//     }
//   }
  
//   private async detectBeautifulLyricsWithRetry(): Promise<boolean> {
//     while (this.retryCount < this.maxRetries) {
//       logger.info(`Detecting Beautiful Lyrics (attempt ${this.retryCount + 1}/${this.maxRetries})...`);
      
//       const detected = await this.beautifulLyricsHook.detectBeautifulLyrics();
      
//       if (detected) {
//         logger.success('✅ Beautiful Lyrics detected!');
//         return true;
//       }
      
//       this.retryCount++;
      
//       if (this.retryCount < this.maxRetries) {
//         logger.warn('Retry in 1 second...');
//         await this.delay(1000);
//       }
//     }
    
//     return false;
//   }
  
//   private delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }
// }

// // Auto-inicializar
// (async () => {
//   const translator = new BeautifulLyricsTranslator();
//   await translator.init();
// })();
