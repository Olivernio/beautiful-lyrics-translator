import { ConsolidatedLine, TranslationCache } from '../types/translation';
import { logger } from '../utils/logger';

export class TranslationCacheManager {
  private cache: TranslationCache = {};
  private maxCacheSize = 50; // Máximo 50 canciones en cache
  
  set(trackId: string, language: string, lines: ConsolidatedLine[]): void {
    if (!this.cache[trackId]) {
      this.cache[trackId] = {};
    }
    
    this.cache[trackId][language] = {
      lines,
      timestamp: Date.now()
    };
    
    this.pruneCache();
    logger.debug(`Cached translation for track ${trackId} (${language})`);
  }
  
  get(trackId: string, language: string): ConsolidatedLine[] | null {
    const cached = this.cache[trackId]?.[language];
    
    if (!cached) {
      return null;
    }

    // Cache válido por 1 hora
    const isExpired = Date.now() - cached.timestamp > 3600000;
    
    if (isExpired) {
      logger.debug(`Cache expired for track ${trackId}`);
      delete this.cache[trackId][language];
      return null;
    }
    
    logger.debug(`Cache hit for track ${trackId} (${language})`);
    return cached.lines;
  }
  
  has(trackId: string, language: string): boolean {
    return this.get(trackId, language) !== null;
  }
  
  clear(): void {
    this.cache = {};
    logger.info('Translation cache cleared');
  }
  
  private pruneCache(): void {
    const trackIds = Object.keys(this.cache);
    
    if (trackIds.length <= this.maxCacheSize) {
      return;
    }
    
    const sorted = trackIds
    // Eliminar los más antiguos
      .map(id => ({
        id,
        timestamp: Math.min(
          ...Object.values(this.cache[id]).map(c => c.timestamp)
        )
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    const toRemove = sorted.slice(0, trackIds.length - this.maxCacheSize);
    toRemove.forEach(({ id }) => delete this.cache[id]);
    
    logger.debug(`Pruned ${toRemove.length} old entries from cache`);
  }
}
