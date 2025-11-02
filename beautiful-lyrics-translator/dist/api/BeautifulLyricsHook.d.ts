export declare class BeautifulLyricsHook {
    private observer;
    private isBeautifulLyricsActive;
    private delay;
    detectBeautifulLyrics(): Promise<boolean>;
    observeLyricsContainer(callback: (container: Element) => void): void;
    getLyricsLines(): NodeListOf<Element> | null;
    disconnect(): void;
    isActive(): boolean;
}
//# sourceMappingURL=BeautifulLyricsHook.d.ts.map