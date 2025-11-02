export declare class LibreTranslateAPI {
    private apiUrl;
    constructor(apiUrl?: string);
    translate(text: string, targetLang: string, sourceLang?: string): Promise<string>;
    detectLanguage(text: string): Promise<string>;
}
//# sourceMappingURL=LibreTranslateAPI.d.ts.map