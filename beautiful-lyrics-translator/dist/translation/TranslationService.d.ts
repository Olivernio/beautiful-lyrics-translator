import { ConsolidatedLine, TranslationConfig } from '../types/translation';
import { SpotifyLyricLine } from '../types/lyrics';
export declare class TranslationService {
    private config;
    constructor(config: TranslationConfig);
    translateLyrics(lines: SpotifyLyricLine[]): Promise<ConsolidatedLine[]>;
    private translate;
    private detectEffectType;
    updateConfig(newConfig: Partial<TranslationConfig>): void;
}
//# sourceMappingURL=TranslationService.d.ts.map