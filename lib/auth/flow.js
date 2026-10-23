/**
 * The sign-in entry the harness is missing.
 *
 * `dsh-llm-pi-ai` registers an authorization flow for `openai-codex` and owns the whole
 * OAuth protocol: it opens the browser, exchanges the code, writes the record and rotates
 * it. What no shipped surface does is *start* that flow — the models settings page renders
 * nothing for a provider that is keyless and OAuth-only. This drives it instead.
 *
 * Nothing here handles a token. `commit` belongs to pi-ai's flow, so the grant this plugin
 * later reads for the quota card is written by the same code that answers prompts.
 *
 * @module dsh-codex-link/flow
 */
import { spawn } from 'node:child_process';
import { PI_AI_RECORD_KEY } from '../quota/grant.js';
import { revocableOf, revokeGrant } from './revoke.js';
/**
 * Open a page in the system browser, on the host.
 *
 * pi-ai only *announces* the sign-in page ("A browser window should open") and leaves
 * opening it to whoever drives the flow; its own CLI does that step. The settings page
 * cannot do it for us: by the time a poll sees the notice there is no user gesture left,
 * and a popup without one is blocked.
 */
export async function openSystemBrowser(url) {
    const command = process.platform === 'darwin' ? '/usr/bin/open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    await new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'ignore' });
        child.once('error', reject);
        child.once('exit', (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`browser exited ${code}`));
        });
    });
}
/** Only a web page is handed to the OS opener; anything else stays a link to click. */
function openable(url) {
    try {
        return new URL(url).protocol === 'https:';
    }
    catch {
        return false;
    }
}
function errorCode(error) {
    const code = error?.code;
    if (typeof code === 'string' && /^[A-Z_]{1,40}$/.test(code))
        return code;
    return 'login-failed';
}
export class CodexLogin {
    options;
    notice = null;
    open = null;
    nextPromptId = 1;
    running = false;
    outcome = null;
    code = null;
    disposed = false;
    opened = new Set();
    revoked = null;
    /** The last sign-out could not delete the record, so the grant is still stored. */
    signOutFailed = false;
    openBrowser;
    constructor(options) {
        this.options = options;
        this.openBrowser = options.openBrowser ?? openSystemBrowser;
    }
    dispose() {
        this.disposed = true;
        this.cancel();
    }
    entry() {
        try {
            return this.options.authorization.describe(PI_AI_RECORD_KEY);
        }
        catch {
            return undefined;
        }
    }
    clearPrompt(reason) {
        const prompt = this.open;
        if (prompt === null)
            return;
        this.open = null;
        prompt.reject(new Error(reason));
    }
    async status() {
        const entry = this.entry();
        let configured = false;
        try {
            configured = (await this.options.credentials.describeRecord(PI_AI_RECORD_KEY)).configured;
        }
        catch {
            configured = false;
        }
        const inFlight = this.running || entry?.inFlight === true;
        const status = inFlight
            ? 'pending'
            : configured
                ? 'signed-in'
                : this.outcome === 'cancelled'
                    ? 'cancelled'
                    : this.outcome === 'failed'
                        ? 'failed'
                        : 'signed-out';
        return {
            status,
            label: entry?.label ?? null,
            methods: entry?.methods.map((method) => method.id) ?? [],
            notice: inFlight ? this.notice : null,
            prompt: inFlight && this.open !== null
                ? {
                    id: this.open.id,
                    kind: this.open.kind,
                    message: this.open.message,
                    placeholder: this.open.placeholder,
                    options: this.open.options,
                }
                : null,
            // A sign-out that could not delete the record leaves the person signed in; the view
            // says so instead of looking like nothing happened.
            code: status === 'failed' || (status === 'signed-in' && this.signOutFailed) ? this.code : null,
            revoked: status === 'signed-out' || (status === 'signed-in' && this.signOutFailed) ? this.revoked : null,
        };
    }
    /**
     * Start pi-ai's flow and return at once.
     *
     * OAuth waits on a browser while this transport is request/response, so the attempt runs
     * detached and the client polls `status()`. An attempt is not resumable, which the seam
     * states: a reload during sign-in loses it and the person starts again.
     */
    async start(method) {
        if (this.disposed) {
            this.outcome = 'failed';
            this.code = 'login-failed';
            return this.status();
        }
        if (this.running || this.entry()?.inFlight === true)
            return this.status();
        const entry = this.entry();
        if (entry === undefined) {
            this.outcome = 'failed';
            this.code = 'NO_FLOW';
            return this.status();
        }
        this.running = true;
        this.outcome = null;
        this.code = null;
        this.notice = null;
        this.revoked = null;
        this.signOutFailed = false;
        this.opened.clear();
        void this.run(method).finally(() => {
            this.running = false;
            this.notice = null;
            this.clearPrompt('attempt finished');
        });
        return this.status();
    }
    async run(method) {
        try {
            const result = await this.options.authorization.begin({
                key: PI_AI_RECORD_KEY,
                ...method === undefined ? {} : { method },
                interaction: {
                    notify: (notice) => {
                        this.notice = {
                            message: notice.message,
                            ...notice.url === undefined ? {} : { url: notice.url },
                            ...notice.code === undefined ? {} : { code: notice.code },
                        };
                        this.openPage(notice.url);
                    },
                    prompt: (prompt) => this.ask(prompt),
                },
            });
            this.outcome = result.status === 'authorized' ? null : 'cancelled';
        }
        catch (error) {
            this.options.logger?.warn(`dsh-codex-link: codex sign-in ${errorCode(error)}`);
            this.outcome = 'failed';
            this.code = errorCode(error);
        }
    }
    /**
     * Open each announced page once per attempt. A failure leaves the link on screen, which
     * is what the person would fall back to anyway, so it is logged and not raised.
     */
    openPage(url) {
        if (url === undefined || !openable(url) || this.opened.has(url))
            return;
        this.opened.add(url);
        this.openBrowser(url).catch(() => {
            this.options.logger?.warn('dsh-codex-link: could not open the system browser');
        });
    }
    /**
     * Hold one question for the client.
     *
     * pi-ai races a loopback callback against a pasted redirect URL, so a prompt carries its
     * own signal and is withdrawn when the callback wins. Rejecting on that signal is what
     * lets the attempt finish instead of waiting on a question nobody needs to answer.
     */
    ask(prompt) {
        this.clearPrompt('superseded by a later question');
        return new Promise((resolve, reject) => {
            const entry = {
                id: this.nextPromptId++,
                kind: prompt.kind,
                message: prompt.message,
                placeholder: prompt.placeholder ?? null,
                options: prompt.options ?? null,
                resolve,
                reject,
            };
            this.open = entry;
            prompt.signal?.addEventListener('abort', () => {
                if (this.open === entry)
                    this.open = null;
                reject(new Error('withdrawn'));
            }, { once: true });
        });
    }
    /** Answer the open question. A stale id is ignored, not misapplied. */
    async answer(id, value) {
        const prompt = this.open;
        if (prompt !== null && prompt.id === id) {
            this.open = null;
            prompt.resolve(value);
        }
        return this.status();
    }
    async cancel() {
        this.clearPrompt('cancelled');
        try {
            this.options.authorization.cancel(PI_AI_RECORD_KEY);
        }
        catch {
            // No attempt to withdraw.
        }
        return this.status();
    }
    /**
     * Sign out: end the session at the issuer, then delete pi-ai's record.
     *
     * The seam's own sign-out only forgets the local grant, so each sign-in used to leave a
     * live session on the account. Revocation runs first because the record holds the only
     * copy of the refresh token. It is best effort: an unreachable issuer still signs out
     * locally, and the view says the session may remain.
     */
    async logout() {
        await this.cancel();
        this.outcome = null;
        this.code = null;
        this.revoked = null;
        this.signOutFailed = false;
        let grant = null;
        try {
            grant = revocableOf(await this.options.credentials.readRecord(PI_AI_RECORD_KEY));
        }
        catch {
            grant = null;
        }
        if (grant !== null) {
            this.revoked = await (this.options.revoke ?? revokeGrant)(grant);
            if (!this.revoked)
                this.options.logger?.warn('dsh-codex-link: codex sign-out could not revoke the session');
        }
        try {
            await this.options.credentials.deleteRecord(PI_AI_RECORD_KEY);
        }
        catch (error) {
            this.options.logger?.warn(`dsh-codex-link: codex sign-out ${errorCode(error)}`);
            this.signOutFailed = true;
            this.code = 'logout-failed';
        }
        return this.status();
    }
}
