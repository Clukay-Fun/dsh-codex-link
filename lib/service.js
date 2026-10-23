import { QuotaCache } from './quota/cache.js';
import { isExpired, readGrant } from './quota/grant.js';
import { DEFAULT_CACHE_TTL_MS, } from './quota/model.js';
import { readUsage, UsageError } from './quota/usage.js';
/** Message codes the client turns into copy. The host ships no prose to the UI. */
const SIGNED_OUT = 'quota-signed-out';
const TOKEN_STALE = 'quota-token-stale';
const TOKEN_REJECTED = 'quota-token-rejected';
const THROTTLED = 'quota-throttled';
const BLOCKED = 'quota-blocked';
const UNAVAILABLE = 'quota-unavailable';
const STOPPED = 'quota-stopped';
function signedOut() {
    return {
        status: 'logged-out',
        freshness: 'empty',
        fetchedAt: null,
        message: SIGNED_OUT,
        planType: null,
        windows: [],
    };
}
function failed(message, stale) {
    if (stale === undefined) {
        return {
            status: 'query-failed',
            freshness: 'empty',
            fetchedAt: null,
            message,
            planType: null,
            windows: [],
        };
    }
    return {
        status: 'query-failed',
        freshness: 'stale',
        fetchedAt: stale.card.fetchedAt,
        message,
        planType: stale.card.planType,
        windows: stale.card.windows,
    };
}
function messageFor(error) {
    if (!(error instanceof UsageError))
        return UNAVAILABLE;
    if (error.reason === 'auth')
        return TOKEN_REJECTED;
    if (error.reason === 'rate-limit')
        return THROTTLED;
    if (error.reason === 'blocked')
        return BLOCKED;
    return UNAVAILABLE;
}
/**
 * Serial usage reads against the Codex grant `dsh-llm-pi-ai` owns.
 *
 * Nothing here holds a token. An absent grant is simply "not signed in", and a token pi-ai
 * has not rotated yet is reported stale rather than sent, because an expired token would
 * come back as a rejected sign-in and read like a different fault. A fresh cache hit makes
 * no request, so reopening settings does not hit the backend each time.
 */
export class QuotaReader {
    options;
    cache;
    tail = Promise.resolve();
    disposed = false;
    active;
    constructor(options) {
        this.options = options;
        const ttl = options.cacheTtlMs;
        this.cache = new QuotaCache(ttl !== undefined && Number.isFinite(ttl) && ttl >= 0 ? ttl : DEFAULT_CACHE_TTL_MS);
    }
    read(refresh = false) {
        const job = this.tail.then(() => this.load(refresh));
        this.tail = job.then(() => undefined, () => undefined);
        return job;
    }
    /**
     * Drop the cached card, after a sign-out. The cache is not keyed by account, so without
     * this a sign-in with another account within the TTL would be shown the last one's quota.
     */
    forget() {
        this.cache.clear();
    }
    dispose() {
        this.disposed = true;
        this.active?.abort();
    }
    async load(refresh) {
        if (this.disposed)
            return failed(STOPPED, undefined);
        if (!refresh) {
            const hit = this.cache.get(Date.now());
            if (hit?.freshness === 'fresh')
                return hit.card;
        }
        let grant;
        try {
            grant = await readGrant(this.options.credentials);
        }
        catch {
            return failed(UNAVAILABLE, this.cache.get(Date.now()));
        }
        if (grant === null) {
            this.cache.clear();
            return signedOut();
        }
        if (isExpired(grant, Date.now()))
            return failed(TOKEN_STALE, this.cache.get(Date.now()));
        if (this.disposed)
            return failed(STOPPED, undefined);
        this.active = new AbortController();
        try {
            const quota = await readUsage(grant, this.active.signal, this.options.fetch);
            const card = {
                status: 'logged-in',
                freshness: 'fresh',
                fetchedAt: Date.now(),
                planType: quota.planType,
                limitReached: quota.limitReached,
                windows: quota.windows,
            };
            this.cache.put(card, card.fetchedAt);
            return card;
        }
        catch (error) {
            return failed(messageFor(error), this.cache.get(Date.now()));
        }
        finally {
            this.active = undefined;
        }
    }
}
