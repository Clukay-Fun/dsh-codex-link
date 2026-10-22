# dsh-codex-link

DeepSeek Harness 设置页里的 Codex 额度卡片。仓库名和包名都是 `dsh-codex-link`。

装一个 DSH 加这一个插件，就能用自己的 ChatGPT 账号跑 Codex 模型并看到额度。不需要 ChatGPT.app，不需要 codex 命令行，不需要别的插件，不拉子进程。

插件**不注册模型提供方，也不保存任何令牌**。模型、协议和 OAuth 实现都是 Harness 自带的 `@deepseek-ai/dsh-llm-pi-ai` 的；插件补的是它缺的那个**登录入口**，外加一张额度卡片。

## 它和 pi-ai 的分工

```
DSH Desktop
└── @deepseek-ai/dsh-base            核心，必装
    └── @deepseek-ai/dsh-llm-pi-ai   模型目录、推理协议、OAuth 实现、令牌保管与轮换
        └── @earendil-works/pi-ai    第三方库：提供方目录与 OAuth 流程

dsh-codex-link                       登录入口 + 额度卡片 + 路由配置
```

| 归谁 | 做什么 |
| --- | --- |
| pi-ai | 9 个模型、`openai-codex-responses` 协议、PKCE/令牌交换/刷新、把 grant 写进凭据库 |
| 本插件 | 启动登录的界面、额度卡片、`providers: { openai-codex: {} }` |

`dsh-llm-pi-ai` 是 `dsh-base` 的直接依赖，随 Desktop 一起装。它的提供方目录里有 `openai-codex`（`env: []`，纯 OAuth，端点 `https://chatgpt.com/backend-api`），不在 `UNSERVED_OAUTH` 名单里，并且已经注册了登录流程：

```js
ctx.authorization.registerFlow({
  key: recordKeyFor('openai-codex'),   // llm-pi-ai/openai-codex
  label: 'OpenAI (ChatGPT Plus/Pro)',
  methods: [oauth, api_key],
  run: (session) => models.login('openai-codex', 'oauth', { notify, prompt }),
})
```

### 为什么登录入口得自己做

能力在，入口没接上。Harness 自带的模型设置页（`dsh-client-ui-settings-models`）对纯 OAuth 的提供方**什么都不渲染**：

```js
const keylessNativeAuth = nativeAuth?.env.length === 0 && nativeAuth.oauth
...
keylessNativeAuth ? null : (<ApiKeyInput .../>)
```

`openai-codex` 正好命中这个条件，所以那页连 API key 输入框都藏掉，也没有任何登录按钮 —— 整个文件里 `signIn` / `login` / `authorize` 零命中。pi-ai 注册的 flow 没有任何自带界面去驱动。

本插件通过 `@deepseek-ai/dsh-authorization` 驱动它：

```
点「用 ChatGPT 登录」
  → authorization.begin('llm-pi-ai/openai-codex', 'oauth', 交互)
  → pi-ai 自己的 flow 跑（开浏览器、换 token、commit 凭据）
  → 插件只渲染它的 notice（页面/码）和 prompt（text/secret/select）
```

**插件从头到尾不碰令牌。** `commit` 是 flow 的事，所以额度卡片后来读的那份 grant，就是回答登录问题的那段代码写的 —— 不存在两份令牌、两个账号。

登录不可恢复（seam 的已知限制）：登录途中刷新页面就得重来。OAuth 要等浏览器，而 HTTP 是请求/响应式，所以 `begin()` 在服务端挂着、前端轮询状态；attempt 结束轮询即停。

登出就是 `credentials.deleteRecord(key)` —— seam 明说它只遗忘本地记录，不通知签发方。要真正撤销这个应用的访问权，到 ChatGPT 那边做。

## 额度

插件读那条记录，拿 `access` 和 `accountId` 请求

```
GET https://chatgpt.com/backend-api/wham/usage
```

请求头只有 `authorization`、`chatgpt-account-id`、`originator: dsh-codex-link`。`originator` 用自己的名字，不冒充 `codex_cli_rs`（pi-ai 同样发自己的 `pi`）。

**路径是 `/wham/usage`，不是 `/codex/usage`。** 在 `chatgpt.com/backend-api` 这个 base 下，Codex 后端在 `/wham/*`；`/codex/usage` 是 `/api/codex/*` 那个 base 的写法。发到这里会被 Cloudflare 的挑战页拦下（`403` + `cf-mitigated: challenge`），而且换成和 pi-ai 一模一样的请求头也一样被拦 —— 拦的是路径，不是请求头。这个 403 看起来像令牌被拒，其实不是，所以带 `cf-mitigated` 的响应单独报成 `quota-blocked`，不会让人去重新登录。

返回结构（Plus 账号实测，身份字段略去）：

```json
{
  "plan_type": "plus",
  "rate_limit": {
    "allowed": true,
    "limit_reached": false,
    "primary_window":   { "used_percent": 0, "limit_window_seconds": 18000,  "reset_at": 1792656319 },
    "secondary_window": { "used_percent": 7, "limit_window_seconds": 604800, "reset_at": 1793082817 }
  },
  "code_review_rate_limit": null,
  "additional_rate_limits": null
}
```

主限额的窗口 id 就是 `primary` / `secondary`；代码审查和额外限额加前缀（`code-review:primary`、`<limit_name>:primary`），不会撞。卡片按窗口长度起名（「5 小时窗口」「每周窗口」），不显示后端的槽位名。「额度已用尽」用后端自己的 `limit_reached` / `allowed`，不从 100% 推断。

## 状态与边界

- **未登录** —— 凭据库里没有那条记录。不发请求。
- **登录过期**（`expires` 已过）—— 报过期，**不发请求**。令牌轮换是 pi-ai 的事，它在凭据库的 `modify` 里做；发一个过期令牌只会换回 401，看起来像另一种故障。
- **后端拒绝**（401，或不带 `cf-mitigated` 的 403）—— 和"未登录"分开报，因为前者要重新授权，后者只是没登录。
- **被 Cloudflare 拦下**（带 `cf-mitigated` 的 403）—— 报 `quota-blocked`，不重试，也不叫人重新登录。
- **被限流**（429）—— 不重试。这个请求就是来问额度的，被限流后再砸一遍是最不该重复的那次。5xx 和网络错误退避重试三次。
- 查询失败时，内存里若还有上一份成功结果，卡片保留那份窗口并标成过期。
- 额度缓存在进程内存里，TTL 默认 60 秒，不写任何文件。设置页打开读一次，刷新按钮强制重读。
- 不做常驻连接，不做阈值提醒。

## 开发

```sh
pnpm install
pnpm test          # 契约检查 + 单元测试
pnpm run typecheck
pnpm run build
pnpm run read      # 直接读本机凭据库，打印这张卡片现在会显示什么
```

`pnpm run contract` 核对两条我们控制不了的假设：pi-ai 的 record scope 还是 `llm-pi-ai`，grant 的字段名还是 `access` / `refresh` / `expires` / `accountId`。它直接读本机安装的 pi-ai 源码；没装 DSH Desktop 时跳过。这两条都不是公开契约，升级 Desktop 后值得重跑。

`pnpm run read` 读 `~/.dsh/.credentials.yaml`，可用 `--credentials <path>` 指定别的文件。它内置的读取器只认 pi-ai 写的那种扁平 grant，不是通用 YAML 解析器。

## 安装

要用 Desktop CLI 目录里的 `dsh` 和 `pnpm`（pnpm 11，仓库在 `~/Library/pnpm/store/v11`）。PATH 上的 pnpm 10 会报 `ERR_PNPM_UNEXPECTED_STORE`，不要改全局 store。

```sh
CLI_BIN=$(ls -dt "$HOME/Library/Application Support/DSH Desktop/cli/"*/bin | head -1)
export PATH="$CLI_BIN:$PATH"
pnpm run build
dsh plugin --profile web add /absolute/path/to/dsh-codex-link
dsh --profile web --dump-config
```

`dump-config` 里能看到 `codex-link`。正在运行的 DSH Desktop 要重启一次才会加载新插件。

### 模型路由

`cordis.patch.yml` 会给 `llm-pi-ai` 补一条：

```yaml
- id: llm-pi-ai
  config:
    providers:
      openai-codex: {}
```

空配置不是"什么都没配"：`resolveRouteModels` 在 `models` 省略时用安装目录的内置模型兜底，所以这一条就能拿到 pi-ai 目录里 `openai-codex` 的全部 9 个模型（`gpt-5.5`、`gpt-5.6-sol`、`gpt-6-astra`、`gpt-6.1-sol` 等，上下文 272K，均带 reasoning）。端点 `https://chatgpt.com/backend-api`，协议 `openai-codex-responses`。

**两个必须知道的约束：**

1. **profile 的 patch 层在所有 bundle 层之后应用，而且是整键替换**（实测：profile 写 `providers: {}` 会把我们这条整个盖掉，不是深合并）。所以 `~/.dsh/profiles/<name>/cordis.patch.yml` 里不能有 `llm-pi-ai` 的 `providers`。设置界面的「模型」页会写这个键 —— 如果你在那里配了别的提供方，我们这条就会被盖掉，Codex 路由随之消失。那种情况下在设置界面里把 Codex 也启用一次即可。
2. **不能靠挂第二个 pi-ai 实例来绕过第 1 点。** `registerAdapter` 在同一 provider 已被占用时抛 `DUPLICATE_ADAPTER`；两行都配 `openai-codex` 就是硬失败。而且凭据 key 是常量 `llm-pi-ai/openai-codex`（不随行 id 变），所以无论哪一行登录，这张卡片都读得到。

登录和额度都在设置里的「Codex Link」页：点「用 ChatGPT 登录」，系统浏览器会自动打开授权页（打不开时页面上留着链接可以手点），授权完回来就会显示额度。

自动打开是宿主做的：pi-ai 只发出「请打开这个页面」的通知，开浏览器这一步留给驱动 flow 的一方（它自己的 CLI 会开）。设置页没法代劳 —— 轮询拿到通知时已经没有用户手势，弹窗会被拦。宿主只把 `https:` 地址交给系统打开，同一次登录同一个地址只开一次。

卸载：

```sh
dsh plugin --profile web remove dsh-codex-link
```

若 `node_modules/dsh-codex-link` 软链接还在，删掉这个链接。
