/** In-memory snapshot. Nothing is written to disk, so uninstall leaves no quota file. */
export class QuotaCache {
    ttlMs;
    entry;
    constructor(ttlMs) {
        this.ttlMs = ttlMs;
    }
    put(card, now) {
        this.entry = { at: now, card };
    }
    clear() {
        this.entry = undefined;
    }
    get(now) {
        if (this.entry === undefined)
            return undefined;
        const freshness = now - this.entry.at <= this.ttlMs ? 'fresh' : 'stale';
        return {
            freshness,
            card: { ...this.entry.card, freshness, windows: this.entry.card.windows.slice() },
        };
    }
}
