window.__ModuleLoader__.load({
  id: 'dsh-codex-link',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-codex-link'

    const copy = {
      zh: {
        nav: 'ChatGPT Link',
        intro: '用 ChatGPT 账号在 DSH 里使用 GPT 模型，额度与推理走同一个账号。',
        account: 'ChatGPT 账号',
        signedIn: '已登录',
        signedOut: '未登录',
        signingIn: '正在登录…',
        loginCancelled: '登录已取消',
        loginFailed: '登录失败',
        signedOutHint: '登录后即可在模型列表中选择 GPT 模型。',
        signedInHint: '模型列表中的 GPT 模型已可使用。',
        signIn: '用 ChatGPT 登录',
        signOut: '退出登录',
        cancel: '取消',
        submit: '提交',
        chooseMethod: '选择登录方式',
        method_browser: '浏览器登录（推荐）',
        method_device_code: '设备码登录',
        browserOpened: '已在浏览器中打开授权页，完成授权后这里会自动更新。',
        browserFallback: '浏览器没有打开？',
        openManually: '手动打开授权页',
        deviceCode: '在验证页面输入下面的代码：',
        openVerification: '打开验证页面',
        pasteCallback: '授权后浏览器没有自动返回？把地址栏中的完整地址粘贴到这里。',
        revokedOk: '已退出，并结束了 OpenAI 上的这次会话。',
        revokedFailed: '已在本机退出，但未能结束 OpenAI 上的会话。可在 ChatGPT 设置 → 安全 → 活动会话中手动移除。',
        NO_FLOW: '没有找到 ChatGPT 登录流程。请确认 DSH 已挂载 dsh-llm-pi-ai。',
        ALREADY_IN_FLIGHT: '已有一次登录在进行中。',
        NOT_COMMITTED: '登录结束了，但没有保存凭据。请重试。',
        UNKNOWN_METHOD: '这个登录方式不可用。',
        'bad-request': '请求格式不正确。',
        'login-failed': '登录没有完成，请重试。',
        'logout-failed': '退出没有完成：本机的登录记录没能删除，请重试。',
        quota: '额度',
        refresh: '刷新',
        refreshing: '正在刷新',
        updatedJustNow: '刚刚更新',
        updatedAt: '更新于 {time}',
        staleAt: '数据已过期，截至 {time}',
        limitReached: '已用尽',
        used: '已用 {n}%',
        resetsIn: '{span}后重置',
        noReset: '无重置时间',
        day: '{n} 天',
        hour: '{n} 小时',
        minute: '{n} 分钟',
        soon: '即将',
        windowFiveHour: '5 小时',
        windowWeekly: '每周',
        windowHours: '{n} 小时',
        windowDays: '{n} 天',
        windowMinutes: '{n} 分钟',
        'group-code-review': '代码审查',
        noWindows: '这次没有返回额度窗口。',
        'quota-signed-out': '登录后显示额度。',
        'quota-token-stale': '登录已过期。发送一条消息会自动刷新，或重新登录。',
        'quota-token-rejected': 'OpenAI 拒绝了这次登录，请重新登录。',
        'quota-throttled': '查询太频繁，稍后再刷新。',
        'quota-blocked': '请求被 ChatGPT 的防护拦截，与登录无关，稍后再刷新。',
        'quota-unavailable': '暂时读不到额度，请检查网络后刷新。',
        'quota-stopped': '插件已停止。',
      },
      en: {
        nav: 'ChatGPT Link',
        intro: 'Use GPT models in DSH with your ChatGPT account. Quota and inference use the same account.',
        account: 'ChatGPT account',
        signedIn: 'Signed in',
        signedOut: 'Not signed in',
        signingIn: 'Signing in…',
        loginCancelled: 'Sign-in cancelled',
        loginFailed: 'Sign-in failed',
        signedOutHint: 'Sign in to pick GPT models in the model list.',
        signedInHint: 'GPT models in the model list are ready to use.',
        signIn: 'Sign in with ChatGPT',
        signOut: 'Sign out',
        cancel: 'Cancel',
        submit: 'Submit',
        chooseMethod: 'Choose how to sign in',
        method_browser: 'Browser (recommended)',
        method_device_code: 'Device code',
        browserOpened: 'The sign-in page is open in your browser. This updates once you finish.',
        browserFallback: 'Browser did not open?',
        openManually: 'Open the sign-in page',
        deviceCode: 'Enter this code on the verification page:',
        openVerification: 'Open the verification page',
        pasteCallback: 'Browser did not return after signing in? Paste the full address from its address bar here.',
        revokedOk: 'Signed out, and the session was ended at OpenAI.',
        revokedFailed: 'Signed out here, but the session at OpenAI could not be ended. Remove it under ChatGPT Settings → Security → Active sessions.',
        NO_FLOW: 'No ChatGPT sign-in flow was found. Check that DSH mounts dsh-llm-pi-ai.',
        ALREADY_IN_FLIGHT: 'A sign-in is already running.',
        NOT_COMMITTED: 'The sign-in finished without storing a credential. Try again.',
        UNKNOWN_METHOD: 'That sign-in method is not available.',
        'bad-request': 'The request was malformed.',
        'login-failed': 'The sign-in did not complete. Try again.',
        'logout-failed': 'Sign-out did not finish: the stored sign-in could not be removed. Try again.',
        quota: 'Quota',
        refresh: 'Refresh',
        refreshing: 'Refreshing',
        updatedJustNow: 'Updated just now',
        updatedAt: 'Updated {time}',
        staleAt: 'Out of date, as of {time}',
        limitReached: 'Limit reached',
        used: '{n}% used',
        resetsIn: 'Resets in {span}',
        noReset: 'No reset time',
        day: '{n}d',
        hour: '{n}h',
        minute: '{n}m',
        soon: 'a moment',
        windowFiveHour: '5 hours',
        windowWeekly: 'Weekly',
        windowHours: '{n} hours',
        windowDays: '{n} days',
        windowMinutes: '{n} minutes',
        'group-code-review': 'Code review',
        noWindows: 'This response included no quota window.',
        'quota-signed-out': 'Sign in to see your quota.',
        'quota-token-stale': 'The sign-in has expired. Sending a message refreshes it, or sign in again.',
        'quota-token-rejected': 'OpenAI refused this sign-in. Sign in again.',
        'quota-throttled': 'Too many checks. Refresh again shortly.',
        'quota-blocked': 'ChatGPT’s edge protection stopped this request; the sign-in is fine. Refresh again shortly.',
        'quota-unavailable': 'Quota is unavailable right now. Check the network, then refresh.',
        'quota-stopped': 'The plugin has stopped.',
      },
    }

    const css = `
.gl{width:100%;max-width:760px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:14px;font-size:14px;line-height:22px}
.gl-heading{margin:0;font-size:18px;font-weight:600;line-height:26px}
.gl-intro{margin:-6px 0 0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.gl-card{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);display:flex;flex-direction:column;min-width:0;overflow:hidden}
.gl-row{display:flex;align-items:center;gap:12px;padding:14px;min-width:0}
.gl-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.gl-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;line-height:20px;min-width:0}
.gl-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.gl-end{flex:none;display:flex;align-items:center;gap:8px}
.gl-dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsw-alias-label-tertiary)}
.gl-dot[data-tone="ok"]{background:var(--dsw-alias-state-success-primary)}
.gl-dot[data-tone="busy"]{background:var(--dsw-alias-state-business-primary);animation:gl-pulse 1.2s ease-in-out infinite}
.gl-dot[data-tone="error"]{background:var(--dsw-alias-state-error-primary)}
@keyframes gl-pulse{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.gl-dot[data-tone="busy"]{animation:none}}
.gl-chip{border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);padding:0 6px;font-size:12px;line-height:18px;font-weight:400}
.gl-chip[data-tone="error"]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary)}
.gl-btn{height:32px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 12px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.gl-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.gl-btn:disabled{opacity:.5;cursor:default}
.gl-btn:focus-visible,.gl-icon:focus-visible,.gl-input:focus-visible,.gl-link:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color);outline-offset:2px}
.gl-btn[data-kind="primary"]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent;font-weight:500}
.gl-btn[data-kind="primary"]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill))}
.gl-icon{width:28px;height:28px;border-radius:var(--dsw-radius-sm);border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.gl-icon:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.gl-icon:disabled{cursor:default}
.gl-icon[data-spin="true"] svg{animation:gl-spin .9s linear infinite}
@keyframes gl-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.gl-icon[data-spin="true"] svg{animation:none}}
.gl-sub{border-top:.5px solid var(--dsw-alias-border-l2);padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.gl-note{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.gl-note[data-tone="error"]{border-radius:var(--dsw-radius-lg);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);color:var(--dsw-alias-state-error-primary);padding:8px 10px}
.gl-link{color:var(--dsw-alias-state-business-primary);font:inherit;font-size:12px;background:0 0;border:0;padding:0;cursor:pointer;text-decoration:none}
.gl-link:hover{text-decoration:underline}
.gl-code{font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:20px;line-height:28px;letter-spacing:.12em;font-weight:500}
.gl-choices{display:flex;flex-wrap:wrap;gap:8px}
.gl-form{display:flex;gap:8px;min-width:0}
.gl-input{flex:1;min-width:0;height:32px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;font-size:13px;padding:0 10px}
.gl-head{display:flex;align-items:center;gap:8px;padding:12px 14px 0}
.gl-head-title{font-size:14px;font-weight:500;line-height:20px}
.gl-head-meta{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap}
.gl-windows{display:flex;flex-direction:column;gap:16px;padding:14px}
.gl-window{display:flex;flex-direction:column;gap:6px}
.gl-window-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.gl-window-name{font-size:13px;line-height:20px}
.gl-window-used{font-size:13px;line-height:20px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.gl-window-used[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}
.gl-track{height:6px;border-radius:999px;background:var(--dsw-alias-bg-module-platform);box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l2);overflow:hidden}
.gl-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-brand-primary));transition:width .4s ease}
.gl-fill[data-tone="error"]{background:var(--dsw-alias-state-error-primary)}
@media (prefers-reduced-motion:reduce){.gl-fill{transition:none}}
.gl-window-reset{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.gl-skeleton{height:12px;border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-skeleton)}
`

    function text(t, key, vars) {
      let value = t(key)
      if (vars) {
        for (const name of Object.keys(vars)) value = value.split(`{${name}}`).join(vars[name])
      }
      return value
    }

    /** A translation, or null when the key is not one of ours. */
    function known(t, key) {
      const value = t(key)
      return value === key ? null : value
    }

    const RefreshIcon = h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }))

    function shortTime(ms) {
      return new Date(ms).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    function clockTime(ms) {
      return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }

    /** "4 小时 12 分钟" / "4h 12m": the two largest units, which is what a person plans around. */
    function span(t, ms) {
      const minutes = Math.max(0, Math.round(ms / 60000))
      if (minutes < 1) return text(t, 'soon')
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      const mins = minutes % 60
      const parts = []
      if (days > 0) parts.push(text(t, 'day', { n: String(days) }))
      if (hours > 0) parts.push(text(t, 'hour', { n: String(hours) }))
      if (days === 0 && mins > 0) parts.push(text(t, 'minute', { n: String(mins) }))
      return parts.slice(0, 2).join(' ')
    }

    /**
     * Name a window by its length, which is what a person recognizes; `primary` and
     * `secondary` are the backend's slots, not names. A prefixed id belongs to a limit other
     * than the main one, so its group leads the label.
     */
    function windowLabel(t, window) {
      const mins = window.windowDurationMins
      const length = mins == null
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
      if (cut < 0) return length
      const group = window.id.slice(0, cut)
      return `${known(t, `group-${group}`) ?? group} · ${length}`
    }

    function planName(plan) {
      return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : null
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

    /** What the flow is asking, in this page's words where the question is one we recognize. */
    function PromptArea({ t, prompt, busy, send }) {
      const [draft, setDraft] = React.useState('')
      React.useEffect(() => {
        setDraft('')
      }, [prompt.id])

      if (prompt.kind === 'select') {
        return h('div', { className: 'gl-sub' },
          h('p', { className: 'gl-note' }, text(t, 'chooseMethod')),
          h('div', { className: 'gl-choices' }, (prompt.options ?? []).map((option, index) =>
            h('button', {
              key: option.id,
              type: 'button',
              className: 'gl-btn',
              'data-kind': index === 0 ? 'primary' : undefined,
              disabled: busy,
              onClick: () => void send({ action: 'answer', id: prompt.id, value: option.id }),
            }, known(t, `method_${option.id}`) ?? option.label))),
        )
      }
      const isCallback = typeof prompt.placeholder === 'string' && prompt.placeholder.includes('/auth/callback')
      const label = isCallback ? text(t, 'pasteCallback') : prompt.message
      return h('div', { className: 'gl-sub' },
        h('p', { className: 'gl-note' }, label),
        h('form', {
          className: 'gl-form',
          onSubmit: (event) => {
            event.preventDefault()
            void send({ action: 'answer', id: prompt.id, value: draft })
          },
        },
          h('input', {
            className: 'gl-input',
            type: prompt.kind === 'secret' ? 'password' : 'text',
            value: draft,
            placeholder: prompt.placeholder ?? '',
            'aria-label': label,
            onChange: (event) => setDraft(event.target.value),
          }),
          h('button', { type: 'submit', className: 'gl-btn', disabled: busy || draft === '' }, text(t, 'submit')),
        ),
      )
    }

    /** The page the flow announced: a device code to type, or a sign-in page already opened. */
    function NoticeArea({ t, notice }) {
      if (notice.code) {
        return h('div', { className: 'gl-sub' },
          h('p', { className: 'gl-note' }, text(t, 'deviceCode')),
          h('div', { className: 'gl-code' }, notice.code),
          notice.url
            ? h('a', { className: 'gl-link', href: notice.url, target: '_blank', rel: 'noreferrer' }, text(t, 'openVerification'))
            : null,
        )
      }
      if (notice.url) {
        return h('div', { className: 'gl-sub' },
          h('p', { className: 'gl-note' },
            text(t, 'browserOpened'), ' ',
            text(t, 'browserFallback'), ' ',
            h('a', { className: 'gl-link', href: notice.url, target: '_blank', rel: 'noreferrer' }, text(t, 'openManually'))),
        )
      }
      return h('div', { className: 'gl-sub' }, h('p', { className: 'gl-note' }, notice.message))
    }

    /**
     * The sign-in the harness does not offer.
     *
     * The flow belongs to pi-ai; this only starts it and renders its notices and questions.
     * An attempt is not resumable, so a reload during sign-in means starting over.
     */
    function AccountCard({ t, auth, setAuth, plan, onSignedOut }) {
      const [busy, setBusy] = React.useState(false)

      const send = React.useCallback(async (body) => {
        setBusy(true)
        try {
          setAuth(await postAuth(body))
        } catch (caught) {
          setAuth({ status: 'failed', label: null, methods: [], notice: null, prompt: null, code: caught instanceof Error ? caught.message : 'login-failed', revoked: null })
        } finally {
          setBusy(false)
        }
      }, [setAuth])

      const status = auth?.status ?? 'signed-out'
      const pending = status === 'pending'
      const signedIn = status === 'signed-in'
      const tone = signedIn ? 'ok' : pending ? 'busy' : status === 'failed' ? 'error' : undefined
      const title = signedIn
        ? text(t, 'signedIn')
        : pending
          ? text(t, 'signingIn')
          : status === 'cancelled'
            ? text(t, 'loginCancelled')
            : status === 'failed'
              ? text(t, 'loginFailed')
              : text(t, 'signedOut')
      const description = signedIn ? text(t, 'signedInHint') : pending ? null : text(t, 'signedOutHint')
      const error = (status === 'failed' || signedIn) && auth?.code ? (known(t, auth.code) ?? auth.code) : null
      const revokedNote = auth?.revoked === true
        ? text(t, 'revokedOk')
        : auth?.revoked === false
          ? text(t, 'revokedFailed')
          : null

      return h('section', { className: 'gl-card', 'aria-label': text(t, 'account') },
        h('div', { className: 'gl-row' },
          h('span', { className: 'gl-dot', 'data-tone': tone, 'aria-hidden': true }),
          h('div', { className: 'gl-main' },
            h('div', { className: 'gl-title' },
              h('span', null, title),
              signedIn && plan ? h('span', { className: 'gl-chip' }, plan) : null,
            ),
            description ? h('div', { className: 'gl-desc' }, description) : null,
          ),
          h('div', { className: 'gl-end' },
            pending
              ? h('button', { type: 'button', className: 'gl-btn', disabled: busy, onClick: () => void send({ action: 'cancel' }) }, text(t, 'cancel'))
              : signedIn
                ? h('button', {
                  type: 'button',
                  className: 'gl-btn',
                  disabled: busy,
                  onClick: async () => {
                    await send({ action: 'logout' })
                    onSignedOut()
                  },
                }, text(t, 'signOut'))
                : h('button', {
                  type: 'button',
                  className: 'gl-btn',
                  'data-kind': 'primary',
                  disabled: busy,
                  onClick: () => void send({ action: 'login' }),
                }, text(t, 'signIn')),
          ),
        ),
        pending && auth?.notice ? h(NoticeArea, { t, notice: auth.notice }) : null,
        pending && auth?.prompt ? h(PromptArea, { t, prompt: auth.prompt, busy, send }) : null,
        error ? h('div', { className: 'gl-sub' }, h('p', { className: 'gl-note', 'data-tone': 'error' }, error)) : null,
        !error && revokedNote
          ? h('div', { className: 'gl-sub' }, h('p', { className: 'gl-note', 'data-tone': auth.revoked ? undefined : 'error' }, revokedNote))
          : null,
      )
    }

    function WindowRow({ t, window, now }) {
      const percent = Math.max(0, Math.min(100, window.usedPercent))
      const danger = percent >= 90
      const when = window.resetsAt == null
        ? null
        : window.resetsAt - now < 86_400_000
          ? clockTime(window.resetsAt)
          : shortTime(window.resetsAt)
      const reset = window.resetsAt == null
        ? text(t, 'noReset')
        : `${text(t, 'resetsIn', { span: span(t, window.resetsAt - now) })} · ${when}`
      const label = windowLabel(t, window)
      return h('div', { className: 'gl-window' },
        h('div', { className: 'gl-window-top' },
          h('span', { className: 'gl-window-name' }, label),
          h('span', { className: 'gl-window-used', 'data-tone': danger ? 'error' : undefined }, text(t, 'used', { n: String(Math.round(window.usedPercent)) })),
        ),
        h('div', {
          className: 'gl-track',
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(percent),
          'aria-label': label,
        }, h('div', { className: 'gl-fill', 'data-tone': danger ? 'error' : undefined, style: { width: `${percent}%` } })),
        h('div', { className: 'gl-window-reset' }, reset),
      )
    }

    function QuotaCard({ t, card, pending, onRefresh }) {
      const now = Date.now()
      const meta = pending
        ? text(t, 'refreshing')
        : !card || card.fetchedAt == null
          ? null
          : card.freshness === 'fresh'
            ? (now - card.fetchedAt < 60_000 ? text(t, 'updatedJustNow') : text(t, 'updatedAt', { time: clockTime(card.fetchedAt) }))
            : text(t, 'staleAt', { time: shortTime(card.fetchedAt) })
      const message = card && card.status !== 'logged-in' && card.message
        ? (known(t, card.message) ?? card.message)
        : null
      const windows = card?.windows ?? []
      return h('section', { className: 'gl-card', 'aria-label': text(t, 'quota') },
        h('div', { className: 'gl-head' },
          h('span', { className: 'gl-head-title' }, text(t, 'quota')),
          card?.limitReached ? h('span', { className: 'gl-chip', 'data-tone': 'error' }, text(t, 'limitReached')) : null,
          meta ? h('span', { className: 'gl-head-meta' }, meta) : null,
          h('button', {
            type: 'button',
            className: 'gl-icon',
            'aria-label': text(t, 'refresh'),
            title: text(t, 'refresh'),
            'data-spin': pending ? 'true' : undefined,
            disabled: pending,
            onClick: onRefresh,
            style: meta ? undefined : { marginLeft: 'auto' },
          }, RefreshIcon),
        ),
        h('div', { className: 'gl-windows' },
          !card && pending
            ? [h('div', { key: 'a', className: 'gl-skeleton', style: { width: '40%' } }), h('div', { key: 'b', className: 'gl-skeleton', style: { width: '80%' } })]
            : null,
          message ? h('p', { className: 'gl-note', 'data-tone': card.freshness === 'stale' ? undefined : 'error' }, message) : null,
          card?.status === 'logged-in' && windows.length === 0 ? h('p', { className: 'gl-note' }, text(t, 'noWindows')) : null,
          windows.map((window) => h(WindowRow, { key: window.id, t, window, now })),
        ),
      )
    }

    function GptLinkSection({ t }) {
      const [auth, setAuth] = React.useState(null)
      const [card, setCard] = React.useState(null)
      const [pending, setPending] = React.useState(false)

      const loadQuota = React.useCallback(async (refresh) => {
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
        } catch {
          setCard((current) => ({
            status: 'query-failed',
            freshness: current?.fetchedAt ? 'stale' : 'empty',
            fetchedAt: current?.fetchedAt ?? null,
            message: 'quota-unavailable',
            planType: current?.planType ?? null,
            limitReached: false,
            windows: current?.windows ?? [],
          }))
        } finally {
          setPending(false)
        }
      }, [])

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

      // The quota card exists only for a signed-in account, so a signed-out page shows its
      // state once instead of the same "not signed in" in two places.
      const signedIn = auth?.status === 'signed-in'
      React.useEffect(() => {
        if (signedIn) void loadQuota(false)
        else setCard(null)
      }, [signedIn, loadQuota])

      return h('div', { className: 'gl' },
        h('style', null, css),
        h('h2', { className: 'gl-heading' }, text(t, 'nav')),
        h('p', { className: 'gl-intro' }, text(t, 'intro')),
        h(AccountCard, {
          t,
          auth,
          setAuth,
          plan: planName(card?.planType),
          onSignedOut: () => setCard(null),
        }),
        signedIn ? h(QuotaCard, { t, card, pending, onRefresh: () => void loadQuota(true) }) : null,
      )
    }

    // A link glyph, drawn with currentColor through a mask so it follows the nav's own color.
    const NAV_GLYPH = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7.2 5.6l.9-.9a2.6 2.6 0 0 1 3.7 3.7l-1.5 1.5a2.6 2.6 0 0 1-3.7 0"/><path d="M8.8 10.4l-.9.9a2.6 2.6 0 0 1-3.7-3.7l1.5-1.5a2.6 2.6 0 0 1 3.7 0"/></svg>')
    const navCss = `
[data-gl-nav] > svg{display:none}
[data-gl-nav]::before{content:"";flex:none;width:16px;height:16px;background:currentColor;-webkit-mask:url("data:image/svg+xml,${NAV_GLYPH}") center/16px no-repeat;mask:url("data:image/svg+xml,${NAV_GLYPH}") center/16px no-repeat}
`

    /**
     * Give this section's nav entry its own icon.
     *
     * The settings shell picks nav icons from a fixed table of built-in ids and gives every
     * other section a gear, with no way to pass one in. So the entry is found by its label
     * and only marked with an attribute; the swap itself is CSS, which leaves React's nodes
     * untouched. If the shell changes its markup, the gear simply comes back.
     */
    function markNavEntry(label) {
      const style = document.createElement('style')
      style.textContent = navCss
      document.head.appendChild(style)
      let queued = 0
      const mark = () => {
        queued = 0
        const name = label()
        for (const span of document.querySelectorAll('button > span:last-child')) {
          const button = span.parentElement
          if (span.textContent === name && button.firstElementChild?.tagName.toLowerCase() === 'svg') {
            if (!button.hasAttribute('data-gl-nav')) button.setAttribute('data-gl-nav', '')
          } else if (button.hasAttribute('data-gl-nav')) {
            button.removeAttribute('data-gl-nav')
          }
        }
      }
      // Element additions are what open settings or relabel the nav; text edits (a streaming
      // reply) are not watched, and a burst of mutations costs one scan per frame.
      const observer = new MutationObserver(() => {
        if (queued === 0) queued = requestAnimationFrame(mark)
      })
      observer.observe(document.body, { childList: true, subtree: true })
      mark()
      return () => {
        observer.disconnect()
        cancelAnimationFrame(queued)
        style.remove()
        for (const button of document.querySelectorAll('[data-gl-nav]')) button.removeAttribute('data-gl-nav')
      }
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, copy), 'dsh-codex-link: locale')
        const t = ctx.locale.bind(NS)
        ctx.effect(() => markNavEntry(() => t('nav')), 'dsh-codex-link: nav icon')
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'codex-link',
          order: 40,
          label: () => t('nav'),
          locale: NS,
        }, function GptLinkSettings() {
          return h(GptLinkSection, { t })
        }))
      },
    }
  },
})
