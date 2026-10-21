# DSH Codex 额度卡片插件 · 开发计划

Oct 21, 2026 · @xh

模型接入已被 `wingoo/codex-plugin-dsh` 完整解决,你的插件只需补上它没做的额度卡片。但 wingoo 要求 DSH `>=0.1.0-rc.5 <0.2.0`,必须先验证你的版本,否则整个方案要换形态。

## 阶段 0:先验证版本,它决定项目形态

`wingoo/codex-plugin-dsh` 声明的依赖是 DeepSeek Harness `>=0.1.0-rc.5 <0.2.0`、Codex CLI `>=0.147.0`、Node `^22.19.0` 或 `>=24`。它的验证环境是 macOS + DSH `0.1.0-rc.5` 源码包 / `0.1.0-rc.6` 发布包 + Codex CLI `0.147.0`。

你提到的是 Desktop v2.0.18。桌面客户端版本号和 `@deepseek-ai/dsh` 包版本号是两套东西,必须分别确认。

先跑这四条:

```
npx @deepseek-ai/dsh --version
codex --version
codex login status
codex app-server --help
```

结果决定走哪条路:

| `@deepseek-ai/dsh` 版本 | 结论 | 本计划 |
| --- | --- | --- |
| 0.1.0-rc.5 \~ 0.1.x | wingoo 可直接装 | 按下面全部阶段走,你只做额度卡片 |
| >= 0.2.0 | wingoo 装不上 | 先试 fork 改 peer range 实测;不行则退回轻量 OAuth 方案 |
| < 0.1.0-rc.5 | 太旧 | 先升级 DSH |

第二步是实测 wingoo 本体:装上、重启 web profile、在模型选择器里找 **Codex App Server (local)**、发一条消息确认能回复。能跑通,这个项目就只剩额度卡片;跑不通,先解决它,不要绕过去自己写 provider。

## 生态对照:你的缺口只剩额度卡片

DSH 生态已有至少七个 Codex 接入插件。按「模型接入」和「额度 UI」两半拆开看,没有一个两半都做好,而 wingoo 把更难的那半做完了。

| 插件 | 凭据来源 | 模型接入 | 额度 UI |
| --- | --- | --- | --- |
| [wingoo/codex-plugin-dsh](https://github.com/wingoo/codex-plugin-dsh) | 委托 Codex CLI,插件不碰 | app-server provider,完整 | 无 |
| [yoke233/dsh-openai-codex-auth](https://github.com/yoke233/dsh-openai-codex-auth) | 自持,PKCE + localhost:1455 | 注入 `DSH_OPENAI_CODEX_TOKEN` | 短周期 + 周窗口 |
| [Hu9956/dsh-codex-provider](https://github.com/Hu9956/dsh-codex-provider) | 自持,设备码 | 写 `apiKeyEnv` 激活内置路由 | 套餐和过期时间 |
| [Player-MINEPIG/dsh-llm-codex-oauth](https://github.com/Player-MINEPIG/dsh-llm-codex-oauth) | 自持,`.credentials.yaml` | 注册 `codex-oauth` 提供方 | 无 |
| [solstice621/dsh-openai-auth](https://github.com/solstice621/dsh-openai-auth/releases) | 依赖 Codex 文件登录态 | 用 app-server `model/list` 同步 | 额度窗口 |
| [nzfern/dsh-codex-auth](https://github.com/nzfern/dsh-codex-auth/releases) | 自持,设备码 | 有 | 悬浮徽标,走 WHAM 端点 |

**结论:装 wingoo 解决模型接入,你的插件只做额度卡片。** 两者职责不重叠——wingoo 管推理路由,你管设置页的额度展示,都通过同一个本机 Codex 登录态,互不抢令牌。

这也让项目范围从「OAuth + 额度 + 模型接入」缩成「额度卡片」,工作量少一大半,而且不和任何现有插件重复。

## 目标架构

&#91;embedded content: 目标架构 · 两个插件共用一个 app-server\]

两个插件各走各的 JSON-RPC 方法,都不持有令牌。你的插件只调 `account/read` 和 `account/rateLimits/read`,不碰 thread 和 turn;wingoo 只做推理路由,不做额度。令牌和 OAuth 始终在 Codex CLI 手里,因此不存在 refresh token 轮换互抢的问题。

## 开发阶段

每一阶段都有一个能二分判定的验收标准。任何一阶段不过,先解决它,不要往下叠。

| 阶段 | 做什么 | 验收标准 | 预估 |
| --- | --- | --- | --- |
| 0 | 版本核对 + 装 wingoo 跑通推理 | 模型选择器出现 Codex App Server (local) 且能回复 | 半天 |
| 1 | 手搓 JSON-RPC 客户端,跑通握手 | `initialize` → `initialized` → `account/read` 返回账号 | 1 晚 |
| 2 | `codex app-server generate-ts` 接进构建 | `pnpm run typecheck` 通过,接口类型来自本机版本 | 1 晚 |
| 3 | 读额度 + 缓存层 | `account/rateLimits/read` 返回 `usedPercent` 和 `resetsAt` | 1 晚 |
| 4 | 最小 DSH 插件骨架 | 启用后无模块导入错误,`--dump-config` 能看到插件 | 1 晚 |
| 5 | 设置页卡片,三态 UI | 已登录 / 查询失败 / 未登录 都能正确渲染 | 2 晚 |
| 6 | 清理与回滚 | 重启、刷新、卸载后无残留进程和残留配置 | 1 晚 |

阶段 1 到 3 完全不依赖 DSH,可以先写成一个独立 Node 脚本,在终端里把数据跑出来。这样调试快,而且万一 DSH 那边出问题,这部分代码还能直接变成 CLI 工具。

阶段 5 的三态按你的原型做,但要把「数据状态」那行利用起来,区分三种情况:新鲜数据、过期数据(标注截至时间)、完全无数据。

## 技术约束与已知坑

**协议不是标准 JSON-RPC。** 官方文档写明 wire 上省略了 `"jsonrpc":"2.0"` 头,所以标准 JSON-RPC 库对不上。手写 NDJSON 读写反而省事。

**必须先握手。** 顺序是 `initialize` 请求 → 响应 → `initialized` 通知,握手前的任何请求都会被拒。

**错误码分不出原因。** `account/rateLimits/read` 在后端拒绝凭据(401)时返回的是通用 `-32603`,`data` 为空——源码里把所有 fetch 错误映射成同一个 internal\_error([issue #48591](https://github.com/openai/codex/issues/48591))。令牌过期、网络不通、后端故障三者无法从错误码区分。对策是先调 `account/read` 判断认证状态,再据此推断。

**还有一个过载码。** 内部队列积压时服务端用 `-32001` 拒绝新请求,消息是 server overloaded,应当退避重试而不是报错给用户。

**超时参数可以直接抄。** 有实现调出来的值:`account/read` 给 25 秒(带 `refreshToken: true` 会串一次 OAuth 刷新往返),`account/rateLimits/read` 给 15 秒,会话上限 60 秒。

**解析一律宽松。** `plan_type` 用字符串或带兜底分支的开放枚举,绝不用封闭枚举——有账号返回 `prolite` 导致 Codex CLI 整个额度获取失败([issue #17353](https://github.com/openai/codex/issues/17353))。未知窗口类型跳过而不是报错。

**窗口可能缺失。** 已有用户报告某些版本只返回周窗口。数据结构按窗口数组设计,UI 按返回内容动态渲染,不要写死 primary / secondary 两个字段。

**额度模块必须和模型调用完全解耦。** 这是整个项目的架构约束,不是异常处理细节。额度整个挂掉,wingoo 的推理路由一点不受影响——物理上它们本来就是两个独立的 app-server 调用。

**版本全部锁死。** DSH、Codex CLI、插件自身都写进 README 的验证矩阵。wingoo 支持用 commit SHA 锁定安装,你的插件也该这么做。

## 开放问题

- [ ] `@deepseek-ai/dsh` 实际版本是多少?落在 wingoo 的 `>=0.1.0-rc.5 <0.2.0` 区间内吗
- [ ] `account/usage/read` 在你本机的 Codex 版本里存不存在?用 `generate-ts` 导出的 schema 确认,我在公开资料里没查到这个方法
- [ ] 额度数据要不要常驻刷新?`account/rateLimits/updated` 是服务端推送通知,但要收到它就得维持一个常驻 app-server 连接;只做手动刷新的话一次性进程更省资源
- [ ] 进程策略:每次查询起一个 app-server 再关掉,还是复用 wingoo 已经起的那个?后者要看它暴不暴露连接,大概率不暴露,那就各起各的
- [ ] 额度卡片要不要做阈值提醒?Codex-Tracker 有这个功能,但会把项目从「展示」推向「常驻监控」

## 参考实现

| 项目 | 看什么 |
| --- | --- |
| [wingoo/codex-plugin-dsh](https://github.com/wingoo/codex-plugin-dsh) | `docs/architecture.md` 的协议细节,以及它怎么管理 app-server 子进程生命周期 |
| [heavymaskstudio/Codex-Tracker](https://github.com/heavymaskstudio/Codex-Tracker) | app-server JSON-RPC 客户端实现、阈值提醒、断线后保留过期快照 |
| [openai/codex app-server 文档](https://developers.openai.com/codex/app-server) | 握手流程、方法清单、`generate-ts` 用法 |
| [Cmochance/Codex\_Account\_Switch PR #33](https://github.com/Cmochance/Codex_Account_Switch/pull/33) | 超时参数的调优过程和理由 |
