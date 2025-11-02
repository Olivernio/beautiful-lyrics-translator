import { ConsolidatedLine } from '../types/translation';
export declare class TranslationCacheManager {
    private cache;
    private maxCacheSize;
    set(trackId: string, language: string, lines: ConsolidatedLine[]): void;
    get(trackId: string, language: string): ConsolidatedLine[] | null;
    has(trackId: string, language: string): boolean;
    clear(): void;
    private pruneCache;
}
//# sourceMappingURL=TranslationCache.d.ts.map