window.__ModuleLoader__.load({
  id: 'dsh-codex-quota',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-codex-quota'

    const copy = {
      zh: {
        nav: '额度',
        title: 'Codex 额度',
        refresh: '刷新',
        refreshing: '正在查询',
        loggedIn: '已登录',
        queryFailed: '查询失败',
        loggedOut: '未登录',
        fresh: '数据状态：刚刚更新',
        empty: '数据状态：无数据',
        stale: '数据状态：过期，截至 {time}',
        loginHint: '本机 Codex CLI 还没有登录。在终端执行 codex login，完成后点刷新。',
        noWindows: '这次没有返回额度窗口。',
        plan: '套餐',
        used: '已用',
        resets: '重置',
        noReset: '无重置时间',
      },
      en: {
        nav: 'Quota',
        title: 'Codex quota',
        refresh: 'Refresh',
        refreshing: 'Checking',
        loggedIn: 'Signed in',
        queryFailed: 'Query failed',
        loggedOut: 'Signed out',
        fresh: 'Data: just updated',
        empty: 'Data: none',
        stale: 'Data: stale, as of {time}',
        loginHint: 'The local Codex CLI is not signed in. Run codex login, then refresh.',
        noWindows: 'This response did not include a quota window.',
        plan: 'Plan',
        used: 'Used',
        resets: 'Resets',
        noReset: 'No reset time',
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
.cq-message{margin:0 0 12px;color:var(--dsw-alias-label-secondary)}
.cq-window{padding:12px 0;border-top:1px solid var(--dsw-alias-border-l2)}
.cq-window-row{display:flex;justify-content:space-between;gap:12px}
.cq-track{height:8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden;margin-top:8px}
.cq-fill{height:100%;background:var(--dsw-alias-brand-primary-new-colorprimary-new-color)}
`

    function text(t, key, vars) {
      let value = t(key)
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) value = value.replace(`{${name}}`, replacement)
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

    function windowLabel(window) {
      if (window.windowDurationMins == null) return window.id
      const hours = window.windowDurationMins / 60
      if (window.windowDurationMins % 1440 === 0) return `${window.id} · ${window.windowDurationMins / 1440}d`
      if (window.windowDurationMins % 60 === 0) return `${window.id} · ${hours}h`
      return `${window.id} · ${window.windowDurationMins}m`
    }

    function QuotaCard({ t }) {
      const [card, setCard] = React.useState(null)
      const [pending, setPending] = React.useState(false)
      const [error, setError] = React.useState('')

      const load = React.useCallback(async (refresh) => {
        setPending(true)
        setError('')
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
          setError(message)
          setCard((current) => ({
            status: 'query-failed',
            freshness: current?.fetchedAt ? 'stale' : 'empty',
            fetchedAt: current?.fetchedAt ?? null,
            message,
            planType: current?.planType ?? null,
            email: current?.email,
            windows: current?.windows ?? [],
          }))
        } finally {
          setPending(false)
        }
      }, [])

      React.useEffect(() => {
        void load(false)
      }, [load])

      const shown = card ?? {
        status: 'query-failed',
        freshness: 'empty',
        fetchedAt: null,
        message: pending ? text(t, 'refreshing') : error,
        planType: null,
        windows: [],
      }
      const message = shown.status === 'logged-out'
        ? text(t, 'loginHint')
        : shown.status === 'query-failed'
          ? (shown.message || error)
          : ''

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
        h('div', { className: 'cq-status' },
          h('span', { className: 'cq-badge', 'data-kind': shown.status }, statusLabel(t, shown.status)),
          h('span', { className: 'cq-meta' }, freshnessLine(t, shown)),
          shown.planType ? h('span', { className: 'cq-meta' }, `${text(t, 'plan')} ${shown.planType}`) : null,
          shown.email ? h('span', { className: 'cq-meta' }, shown.email) : null,
        ),
        message ? h('p', { className: 'cq-message' }, message) : null,
        shown.windows.length === 0 && shown.status === 'logged-in'
          ? h('p', { className: 'cq-message' }, text(t, 'noWindows'))
          : null,
        shown.windows.map((window) => {
          const width = Math.max(0, Math.min(100, window.usedPercent))
          const reset = window.resetsAt == null ? text(t, 'noReset') : new Date(window.resetsAt).toLocaleString()
          return h('div', { className: 'cq-window', key: window.id },
            h('div', { className: 'cq-window-row' },
              h('span', null, windowLabel(window)),
              h('span', null, `${text(t, 'used')} ${Math.round(window.usedPercent)}%`),
            ),
            h('div', { className: 'cq-track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(width), 'aria-label': window.id },
              h('div', { className: 'cq-fill', style: { width: `${width}%` } }),
            ),
            h('div', { className: 'cq-meta' }, `${text(t, 'resets')} ${reset}`),
          )
        }),
      )
    }

    function Section({ t }) {
      return h(QuotaCard, { t })
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, copy), 'dsh-codex-quota: locale')
        const t = ctx.locale.bind(NS)
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'codex-quota',
          order: 40,
          label: () => t('nav'),
          locale: NS,
        }, function CodexQuotaSection() {
          return h(Section, { t })
        }))
      },
    }
  },
})
