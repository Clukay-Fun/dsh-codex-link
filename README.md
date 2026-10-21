# dsh-codex-quota

DeepSeek Harness 设置页里的 Codex 额度卡片。插件只向本机 `codex app-server` 发 `account/read` 和 `account/rateLimits/read`，不保存令牌，也不注册模型路由。

## 阶段 0

2026-10-21 在这台机器上核对过：

| 组件 | 实际版本 | 计划里的门槛 |
| --- | --- | --- |
| DSH Desktop | 2.0.18 | 和包版本不是同一套编号 |
| `@deepseek-ai/dsh` | 0.2.1-rc.2 | wingoo 要求 `>=0.1.0-rc.5 <0.2.0` |
| Node | 24.13.1 | `^22.19.0` 或 `>=24` |
| Codex CLI | 0.163.0-alpha.11（ChatGPT.app 内置，不在 PATH） | `>=0.147.0` |
| `codex login status` | 未登录 | 额度数字要等登录之后 |

`0.2.1-rc.2` 落在「wingoo 装不上」那一档。把 `wingoo/codex-plugin-dsh` 的依赖改到 `0.2.1-rc.2` 之后，`tsc` 有 33 个错误：`CallId` 导出方式变了，`tool-result` 不再是内容块，回放状态要带 `response`。只改依赖范围不能用，因此没有安装 wingoo，也没有自己写一套模型提供方。

这台 DSH 的 `dsh-llm-pi-ai` 已经带有 `openai-codex` 目录项，模型登录走 Harness 自己的 OAuth。本插件和那条路由互不持有令牌：额度查询每次另起一个 app-server，查完就退出。

## 已关掉的开放问题

- `account/usage/read` 在 Codex `0.163.0-alpha.11` 的 `generate-ts` 结果里存在。卡片不用它，只用 `account/rateLimits/read` 的 `usedPercent` 和 `resetsAt`。
- 不做常驻连接，因此收不到 `account/rateLimits/updated`。设置页打开时读一次，刷新按钮再读一次。
- 不复用别的插件的 app-server 进程。
- 不做阈值提醒。

## 开发

```sh
pnpm install
pnpm test
pnpm run typecheck
pnpm run build
pnpm run read
```

`typecheck` 会用本机 `codex app-server generate-ts --experimental` 生成本次校验用的协议文件，并确认 `account/read`、`account/rateLimits/read`、`account/usage/read`、`usedPercent`、`resetsAt` 还在。生成文件不入库。

安装到当前 Desktop 使用的 `web` profile。这条命令要用 Desktop CLI 目录里的 `dsh` 和 `pnpm`（pnpm 11，仓库在 `~/Library/pnpm/store/v11`）。PATH 上的 pnpm 10 会报 `ERR_PNPM_UNEXPECTED_STORE`，不要改全局 store。

```sh
CLI_BIN=$(ls -dt "$HOME/Library/Application Support/DSH Desktop/cli/"*/bin | head -1)
export PATH="$CLI_BIN:$PATH"
pnpm run build
dsh plugin --profile web add /absolute/path/to/dsh-codex-link
dsh --profile web --dump-config
```

`dump-config` 里能看到 `codex-quota`。正在运行的 DSH Desktop 要重启一次才会加载新插件。设置里会出现「额度」。三态是已登录、查询失败、未登录；数据行分开显示刚刚更新、过期（带截至时间）、无数据。查询失败时如果内存里还有上一份成功结果，卡片保留那份窗口并标成过期。本机 Codex CLI 未登录时，卡片是未登录，终端执行 `codex login` 后再点刷新才会出现用量。

卸载：

```sh
dsh plugin --profile web remove dsh-codex-quota
```

若 `node_modules/dsh-codex-quota` 软链接还在，删掉这个链接。profile 的 `package.json` 和 `cordis.patch.yml` 里不会留下这项。

额度缓存在进程内存里，不写配置文件。查询进程在单次读取的 `finally` 里结束，插件卸载时会中止还没完成的那一次。
