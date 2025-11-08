export class LrcParser {
    constructor() {
        this.lyrics = [];
        this.metadata = {};
    }

    parse(lrcContent) {
        this.lyrics = [];
        this.metadata = {};

        const lines = lrcContent.split('\n');
        const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
        const metaRegex = /\[(\w+):([^\]]+)\]/;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            const metaMatch = line.match(metaRegex);
            if (metaMatch && !line.match(timeRegex)) {
                this.metadata[metaMatch[1].toLowerCase()] = metaMatch[2];
                continue;
            }

            const matches = [...line.matchAll(timeRegex)];
            if (matches.length === 0) continue;

            const text = line.replace(timeRegex, '').trim();
            
            for (const match of matches) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const centiseconds = match[3].length === 2 
                    ? parseInt(match[3], 10) 
                    : parseInt(match[3], 10) / 10;
                
                const time = minutes * 60 + seconds + centiseconds / 100;

                this.lyrics.push({
                    time: time,
                    text: text || ''
                });
            }
        }

        this.lyrics.sort((a, b) => a.time - b.time);
        return this.lyrics;
    }

    getCurrentLine(currentTime) {
        if (this.lyrics.length === 0) return null;

        for (let i = this.lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= this.lyrics[i].time) {
                return {
                    index: i,
                    ...this.lyrics[i]
                };
            }
        }

        return null;
    }

    getNextLine(currentIndex) {
        if (currentIndex < this.lyrics.length - 1) {
            return this.lyrics[currentIndex + 1];
        }
        return null;
    }

    getAllLines() {
        return this.lyrics;
    }

    getMetadata() {
        return this.metadata;
    }
}
