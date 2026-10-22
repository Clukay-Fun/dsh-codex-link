---
description: "DeepSeek Harness 插件：用 ChatGPT 账号登录 Codex，在 DSH 里使用 Codex 模型并查看额度。"
kind: "package-reference"
---

# dsh-codex-link

## 概述

安装 `dsh-codex-link` 后，可以用自己的 ChatGPT 账号（Plus、Pro 等订阅）登录 Codex，在 DSH 的模型选择器里使用 Codex 模型，并在设置页查看这个账号的额度用量。除 DSH Desktop 外不需要安装其他软件，不依赖 ChatGPT 桌面应用或 Codex 命令行。

模型、推理协议与 OAuth 登录由 DSH 自带的 `@deepseek-ai/dsh-llm-pi-ai` 提供。本插件为它的 `openai-codex` 路由补上设置页缺少的登录入口，并读取同一份登录显示额度，因此额度一定属于正在跑推理的那个账号。插件本身不注册模型提供方，也不保存令牌：令牌由 pi-ai 写入 DSH 凭据库并负责刷新。

安装后可以使用：

- **登录**：设置 → Codex Link → 用 ChatGPT 登录。系统浏览器会自动打开授权页，授权完成后回到 DSH 即可。
- **模型**：在模型选择器里选择 Codex 模型（如 `gpt-5.5`、`gpt-6.1-sol`），模型列表来自 pi-ai 的内置目录。
- **额度**：设置 → Codex Link 显示 5 小时窗口和每周窗口的已用百分比与重置时间，额度用尽时会标出。

## 安装

需要 DSH Desktop，内置 `@deepseek-ai/dsh` 版本为 `>=0.2.1-rc.2 <0.3.0`。

请使用 DSH Desktop 自带的 `dsh` 与 `pnpm` 命令，系统 PATH 上的其他版本 pnpm 可能报 `ERR_PNPM_UNEXPECTED_STORE`：

```sh
CLI_BIN=$(ls -dt "$HOME/Library/Application Support/DSH Desktop/cli/"*/bin | head -1)
export PATH="$CLI_BIN:$PATH"
```

获取源码并构建：

```sh
git clone https://github.com/Clukay-Fun/dsh-codex-link.git
cd dsh-codex-link
pnpm install
pnpm run build
```

安装到 profile（以 Desktop 默认的 `web` 为例），路径需为绝对路径：

```sh
dsh plugin --profile web add "$(pwd)"
```

重启 DSH Desktop，在设置中打开 **Codex Link** 完成登录。

### 模型没有出现时

插件会为 `llm-pi-ai` 写入 `providers.openai-codex` 配置。如果 profile 自己的 `~/.dsh/profiles/web/cordis.patch.yml` 中已有 `llm-pi-ai` 的 `providers` 设置，它会覆盖插件的配置。删除该文件中的 `llm-pi-ai` 段，重启 DSH Desktop 即可。

可用以下命令确认配置已生效：

```sh
dsh --profile web --dump-config | grep -A 4 "id: llm-pi-ai"
```

输出中应包含 `openai-codex: {}`。

### 卸载

```sh
dsh plugin --profile web remove dsh-codex-link
```

卸载插件不会删除 pi-ai 保存的登录。如需退出登录，请在卸载前到设置 → Codex Link 点击「退出登录」。
