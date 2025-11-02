import { SpotifyLyricLine } from '../types/lyrics';
/**
 * Consolida todas las voces (principal, coros, secundarias) en una sola línea
 */
export declare function consolidateLine(line: SpotifyLyricLine): string;
/**
 * Detecta el tipo de efecto según los datos de la línea
 */
export declare function detectEffectType(line: SpotifyLyricLine): 'karaoke' | 'line' | 'static';
/**
 * Espera a que un elemento aparezca en el DOM
 */
export declare function waitForElement(selector: string, timeout?: number): Promise<Element>;
/**
 * Genera un ID único para el track actual
 */
export declare function getCurrentTrackId(): string | null;
//# sourceMappingURL=helpers.d.ts.map