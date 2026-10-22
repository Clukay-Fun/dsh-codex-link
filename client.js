window.__ModuleLoader__.load({
  id: 'dsh-codex-link',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-codex-link'

    const copy = {
      zh: {
        nav: 'Codex Link',
        title: 'Codex 额度',
        intro: '登录走 Harness 自带的 Codex 模型路由，令牌由它保管和刷新，这个插件不碰。额度读的是同一份登录，所以数字就是跑推理那个账号的。',
        signIn: '用 ChatGPT 登录',
        signingIn: '正在登录',
        signOut: '退出登录',
        cancel: '取消',
        signedIn: '已登录',
        signedOut: '未登录',
        loginCancelled: '登录已取消',
        loginFailed: '登录失败',
        openPage: '打开这个页面继续',
        enterCode: '在那个页面输入这个码',
        submit: '提交',
        choose: '选择',
        NO_FLOW: '这台 DSH 上没有 Codex 登录流程。确认 dsh-llm-pi-ai 已挂载。',
        ALREADY_IN_FLIGHT: '已经有一次登录在进行中。',
        NOT_COMMITTED: '登录结束了但没有写入凭据。请重试。',
        UNKNOWN_METHOD: '这个登录方式不可用。',
        'bad-request': '请求格式不对。',
        'login-failed': '登录没有完成。请重试。',
        refresh: '刷新',
        refreshing: '正在查询',
        loggedIn: '已登录',
        queryFailed: '查询失败',
        loggedOut: '未登录',
        fresh: '数据状态：刚刚更新',
        empty: '数据状态：无数据',
        stale: '数据状态：过期，截至 {time}',
        'quota-signed-out': '还没有登录 Codex。点上面的「用 ChatGPT 登录」。',
        'quota-token-stale': '登录已过期。发一次消息会让它自动刷新，或者在上面重新登录。',
        'quota-token-rejected': '后端拒绝了这份登录。在上面重新登录一次。',
        'quota-throttled': '查询太频繁，被后端限流了。等一会儿再刷新。',
        'quota-blocked': '请求被 ChatGPT 的防护拦下了，不是登录的问题。等一会儿再刷新。',
        limitReached: '额度已用尽',
        windowFiveHour: '5 小时窗口',
        windowWeekly: '每周窗口',
        windowHours: '{n} 小时窗口',
        windowDays: '{n} 天窗口',
        windowMinutes: '{n} 分钟窗口',
        'group-code-review': '代码审查',
        'quota-unavailable': '读不到额度。检查网络，然后再刷新。',
        'quota-stopped': '插件已停止。',
        noWindows: '这次没有返回额度窗口。',
        plan: '套餐',
        used: '已用',
        noReset: '无重置时间',
        resetsAt: '重置于 {time}',
      },
      en: {
        nav: 'Codex Link',
        title: 'Codex quota',
        intro: 'Sign-in and inference belong to the harness’s own Codex model route. This card reads that same sign-in, so the numbers describe the account that answers prompts.',
        signIn: 'Sign in with ChatGPT',
        signingIn: 'Signing in',
        signOut: 'Sign out',
        cancel: 'Cancel',
        signedIn: 'Signed in',
        signedOut: 'Not signed in',
        loginCancelled: 'Sign-in was cancelled',
        loginFailed: 'Sign-in failed',
        openPage: 'Open this page to continue',
        enterCode: 'Enter this code on that page',
        submit: 'Submit',
        choose: 'Choose',
        NO_FLOW: 'No Codex sign-in flow is registered here. Check that dsh-llm-pi-ai is mounted.',
        ALREADY_IN_FLIGHT: 'A sign-in is already running.',
        NOT_COMMITTED: 'The sign-in finished without storing a credential. Try again.',
        UNKNOWN_METHOD: 'That sign-in method is not available.',
        'bad-request': 'The request was malformed.',
        'login-failed': 'The sign-in did not complete. Try again.',
        refresh: 'Refresh',
        refreshing: 'Checking',
        loggedIn: 'Signed in',
        queryFailed: 'Query failed',
        loggedOut: 'Signed out',
        fresh: 'Data: just updated',
        empty: 'Data: none',
        stale: 'Data: stale, as of {time}',
        'quota-signed-out': 'Codex is not signed in. Enable Codex under Settings → Models and sign in with ChatGPT.',
        'quota-token-stale': 'The sign-in has expired. The next request refreshes it, or sign in again under Settings → Models.',
        'quota-token-rejected': 'The backend refused this sign-in. Signing in again under Settings → Models may be needed.',
        'quota-throttled': 'The backend rate-limited this read. Refresh again in a moment.',
        'quota-blocked': 'ChatGPT\u2019s edge protection stopped this request; the sign-in is fine. Refresh again in a moment.',
        limitReached: 'Limit reached',
        windowFiveHour: '5-hour window',
        windowWeekly: 'Weekly window',
        windowHours: '{n}-hour window',
        windowDays: '{n}-day window',
        windowMinutes: '{n}-minute window',
        'group-code-review': 'Code review',
        'quota-unavailable': 'Quota could not be read. Check the network, then refresh.',
        'quota-stopped': 'The plugin has stopped.',
        noWindows: 'This response did not include a quota window.',
        plan: 'Plan',
        used: 'Used',
        noReset: 'No reset time',
        resetsAt: 'Resets {time}',
      },
    }

    const css = `
.cq-card{max-width:720px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.cq-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.cq-title{margin:0;font-size:20px;line-height:28px;font-weight:650}
.cq-button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;border-radius:8px;padding:6px 12px;cursor:pointer}
.cq-button:disabled{cursor:default;opacity:.6}
.cq-status{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.cq-badge{border-radius:999px;padding:2px 8px;background:var(--dsw-alias-interactive-bg-hover)}
.cq-badge[data-kind="logged-in"]{color:var(--dsw-alias-state-success-primary)}
.cq-badge[data-kind="query-failed"],.cq-badge[data-kind="logged-out"]{color:var(--dsw-alias-state-error-primary)}
.cq-meta{color:var(--dsw-alias-label-secondary)}
.cq-message{margin:0 0 12px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.cq-window{padding:12px 0;border-top:1px solid var(--dsw-alias-border-l2)}
.cq-window-row{display:flex;justify-content:space-between;gap:12px}
.cq-track{height:8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;margin-top:8px}
.cq-fill{height:100%;background:var(--dsw-alias-brand-primary-new-colorprimary-new-color)}
.cq-signin{padding:12px 0;margin-bottom:12px;border-top:1px solid var(--dsw-alias-border-l2);border-bottom:1px solid var(--dsw-alias-border-l2)}
.cq-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.cq-input{flex:1 1 240px;min-width:0;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:inherit;border-radius:8px;padding:6px 10px;font:inherit}
.cq-notice code,.cq-signin code{word-break:break-all;font-size:12px}
`

    function text(t, key, vars) {
      let value = t(key)
      if (vars) {
        for (const name of Object.keys(vars)) value = value.split(`{${name}}`).join(vars[name])
      }
      return value
    }

    function freshnessLine(t, card) {
      if (!card || card.freshness === 'empty' || card.fetchedAt == null) return text(t, 'empty')
      if (card.freshness === 'fresh') return text(t, 'fresh')
      return text(t, 'stale', { time: new Date(card.fetchedAt).toLocaleString() })
    }

    function statusLabel(t, status) {
      if (status === 'logged-in') return text(t, 'loggedIn')
      if (status === 'logged-out') return text(t, 'loggedOut')
      return text(t, 'queryFailed')
    }

    /**
     * Name a window by its length, which is what a person recognizes; `primary` and
     * `secondary` are the backend's slots, not names. A prefixed id belongs to a limit other
     * than the main one, so its group leads the label.
     */
    function windowLabel(t, window) {
      const mins = window.windowDurationMins
      const span = mins == null
        ? window.id
        : mins === 300
          ? text(t, 'windowFiveHour')
          : mins === 10080
            ? text(t, 'windowWeekly')
            : mins % 1440 === 0
              ? text(t, 'windowDays', { n: String(mins / 1440) })
              : mins % 60 === 0
                ? text(t, 'windowHours', { n: String(mins / 60) })
                : text(t, 'windowMinutes', { n: String(mins) })
      const cut = window.id.lastIndexOf(':')
      if (cut < 0) return span
      const group = window.id.slice(0, cut)
      const named = text(t, `group-${group}`)
      return `${named === `group-${group}` ? group : named} · ${span}`
    }

    /** Host message codes carry no prose, so an unknown code falls back to the raw text. */
    function messageOf(t, card) {
      if (!card || card.status === 'logged-in' || !card.message) return ''
      const translated = text(t, card.message)
      return translated === card.message ? card.message : translated
    }

    async function postAuth(body) {
      const response = await fetch('/api/codex-auth', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok && response.status !== 400 && response.status !== 500) throw new Error(`HTTP ${response.status}`)
      return response.json()
    }

    /**
     * The sign-in the harness does not offer.
     *
     * The flow belongs to pi-ai; this only starts it and renders its notices and questions.
     * An attempt is not resumable, so a reload during sign-in means starting over.
     */
    function SignIn({ t, auth, setAuth, onSettled }) {
      const [busy, setBusy] = React.useState(false)
      const [draft, setDraft] = React.useState('')

      const send = React.useCallback(async (body) => {
        setBusy(true)
        try {
          setAuth(await postAuth(body))
        } catch (caught) {
          setAuth({ status: 'failed', label: null, methods: [], notice: null, prompt: null, code: caught instanceof Error ? caught.message : 'login-failed' })
        } finally {
          setBusy(false)
        }
      }, [setAuth])

      const prompt = auth?.prompt ?? null
      React.useEffect(() => {
        setDraft('')
      }, [prompt?.id])

      const pending = auth?.status === 'pending'
      const signedIn = auth?.status === 'signed-in'
      const label = signedIn
        ? text(t, 'signedIn')
        : pending
          ? text(t, 'signingIn')
          : auth?.status === 'cancelled'
            ? text(t, 'loginCancelled')
            : auth?.status === 'failed'
              ? text(t, 'loginFailed')
              : text(t, 'signedOut')
      const note = auth?.status === 'failed' && auth.code ? text(t, auth.code) : ''

      return h('div', { className: 'cq-signin' },
        h('div', { className: 'cq-status' },
          h('span', { className: 'cq-badge', 'data-kind': signedIn ? 'logged-in' : pending ? 'query-failed' : 'logged-out' }, label),
          auth?.label ? h('span', { className: 'cq-meta' }, auth.label) : null,
        ),
        note ? h('p', { className: 'cq-message' }, note) : null,
        pending && auth.notice
          ? h('div', { className: 'cq-notice' },
            h('p', { className: 'cq-message' }, auth.notice.message),
            auth.notice.url
              ? h('p', { className: 'cq-message' },
                h('a', { href: auth.notice.url, target: '_blank', rel: 'noreferrer' }, text(t, 'openPage')),
                ' ',
                h('code', null, auth.notice.url),
              )
              : null,
            auth.notice.code
              ? h('p', { className: 'cq-message' }, `${text(t, 'enterCode')}: `, h('code', null, auth.notice.code))
              : null,
          )
          : null,
        pending && prompt
          ? h('div', { className: 'cq-prompt' },
            h('p', { className: 'cq-message' }, prompt.message),
            prompt.kind === 'select'
              ? h('div', { className: 'cq-row' }, (prompt.options ?? []).map((option) =>
                h('button', {
                  key: option.id,
                  type: 'button',
                  className: 'cq-button',
                  disabled: busy,
                  onClick: () => void send({ action: 'answer', id: prompt.id, value: option.id }),
                }, option.label)))
              : h('form', {
                className: 'cq-row',
                onSubmit: (event) => {
                  event.preventDefault()
                  void send({ action: 'answer', id: prompt.id, value: draft })
                },
              },
                h('input', {
                  className: 'cq-input',
                  type: prompt.kind === 'secret' ? 'password' : 'text',
                  value: draft,
                  placeholder: prompt.placeholder ?? '',
                  'aria-label': prompt.message,
                  onChange: (event) => setDraft(event.target.value),
                }),
                h('button', { type: 'submit', className: 'cq-button', disabled: busy || draft === '' }, text(t, 'submit')),
              ),
          )
          : null,
        h('div', { className: 'cq-row' },
          signedIn
            ? h('button', {
              type: 'button',
              className: 'cq-button',
              disabled: busy,
              onClick: async () => {
                await send({ action: 'logout' })
                onSettled()
              },
            }, text(t, 'signOut'))
            : h('button', {
              type: 'button',
              className: 'cq-button',
              disabled: busy || pending,
              onClick: () => void send({ action: 'login' }),
            }, text(t, 'signIn')),
          pending
            ? h('button', {
              type: 'button',
              className: 'cq-button',
              disabled: busy,
              onClick: () => void send({ action: 'cancel' }),
            }, text(t, 'cancel'))
            : null,
        ),
      )
    }

    function QuotaCard({ t }) {
      const [card, setCard] = React.useState(null)
      const [pending, setPending] = React.useState(false)

      const load = React.useCallback(async (refresh) => {
        setPending(true)
        try {
          const response = await fetch('/api/codex-quota', {
            method: refresh ? 'POST' : 'GET',
            cache: 'no-store',
            credentials: 'same-origin',
            headers: { accept: 'application/json' },
          })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const body = await response.json()
          if (!body || (body.status !== 'logged-in' && body.status !== 'query-failed' && body.status !== 'logged-out')) {
            throw new Error('bad quota payload')
          }
          setCard(body)
        } catch (caught) {
          const message = caught instanceof Error ? caught.message : String(caught)
          setCard((current) => ({
            status: 'query-failed',
            freshness: current?.fetchedAt ? 'stale' : 'empty',
            fetchedAt: current?.fetchedAt ?? null,
            message,
            planType: current?.planType ?? null,
            windows: current?.windows ?? [],
          }))
        } finally {
          setPending(false)
        }
      }, [])

      const [auth, setAuth] = React.useState(null)

      const loadAuth = React.useCallback(async () => {
        const response = await fetch('/api/codex-auth', {
          cache: 'no-store',
          credentials: 'same-origin',
          headers: { accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        setAuth(await response.json())
      }, [])

      React.useEffect(() => {
        void loadAuth().catch(() => {})
      }, [loadAuth])

      // An attempt waits on a browser, so the only way this transport learns it finished is
      // to ask. Polling stops as soon as the attempt settles.
      React.useEffect(() => {
        if (auth?.status !== 'pending') return undefined
        const timer = setInterval(() => {
          void loadAuth().catch(() => {})
        }, 1000)
        return () => clearInterval(timer)
      }, [auth?.status, loadAuth])

      const signedIn = auth?.status === 'signed-in'
      React.useEffect(() => {
        if (signedIn) void load(true)
      }, [signedIn, load])

      React.useEffect(() => {
        void load(false)
      }, [load])

      const shown = card ?? {
        status: 'query-failed',
        freshness: 'empty',
        fetchedAt: null,
        message: '',
        planType: null,
        windows: [],
      }
      const message = pending && !card ? text(t, 'refreshing') : messageOf(t, shown)

      return h('section', { className: 'cq-card' },
        h('style', null, css),
        h('div', { className: 'cq-head' },
          h('h2', { className: 'cq-title' }, text(t, 'title')),
          h('button', {
            type: 'button',
            className: 'cq-button',
            disabled: pending,
            onClick: () => void load(true),
          }, pending ? text(t, 'refreshing') : text(t, 'refresh')),
        ),
        h('p', { className: 'cq-message' }, text(t, 'intro')),
        h(SignIn, {
          t,
          auth,
          setAuth,
          onSettled: () => {
            setCard(null)
            void load(true)
          },
        }),
        h('div', { className: 'cq-status' },
          h('span', { className: 'cq-badge', 'data-kind': shown.status }, statusLabel(t, shown.status)),
          h('span', { className: 'cq-meta' }, freshnessLine(t, shown)),
          shown.planType
            ? h('span', { className: 'cq-meta' }, `${text(t, 'plan')} ${shown.planType}`)
            : null,
          shown.limitReached
            ? h('span', { className: 'cq-badge', 'data-kind': 'query-failed' }, text(t, 'limitReached'))
            : null,
        ),
        message ? h('p', { className: 'cq-message' }, message) : null,
        shown.status === 'logged-in' && shown.windows.length === 0
          ? h('p', { className: 'cq-message' }, text(t, 'noWindows'))
          : null,
        shown.windows.map((window) => {
          const width = Math.max(0, Math.min(100, window.usedPercent))
          const reset = window.resetsAt == null
            ? text(t, 'noReset')
            : text(t, 'resetsAt', { time: new Date(window.resetsAt).toLocaleString() })
          return h('div', { className: 'cq-window', key: window.id },
            h('div', { className: 'cq-window-row' },
              h('span', null, windowLabel(t, window)),
              h('span', null, `${text(t, 'used')} ${Math.round(window.usedPercent)}%`),
            ),
            h('div', {
              className: 'cq-track',
              role: 'progressbar',
              'aria-valuemin': 0,
              'aria-valuemax': 100,
              'aria-valuenow': Math.round(width),
              'aria-label': window.id,
            }, h('div', { className: 'cq-fill', style: { width: `${width}%` } })),
            h('div', { className: 'cq-meta' }, reset),
          )
        }),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, copy), 'dsh-codex-link: locale')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'codex-link',
          order: 40,
          label: () => t('nav'),
          locale: NS,
        }, function CodexLinkSection() {
          return h(QuotaCard, { t })
        }))
      },
    }
  },
})
