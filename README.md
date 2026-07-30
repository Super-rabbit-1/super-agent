# Personal Agent Configuration

这是孙沛涵的 Agent 配置事实源。它保存长期有效、由本人维护的行为定义，不保存对话、缓存、登录态或第三方安装产物。

## 仓库边界

会进入 Git：

- `AGENTS.md`：Codex 与 Claude 共用的全局行为原则。
- `skills/`：个人创建或实质改造的 Skill。
- `rules/`、`agents/`：未来的规则和 Agent 定义。
- `manifest/`、`.skill-lock.json`：可重装依赖的来源说明。
- `bootstrap.sh`、`sync.sh`、`scripts/`：新机恢复与安全同步工具。

不会进入 Git：

- OAuth、Cookie、Token、凭据和 `.env`。
- 对话记录、缓存、日志、临时文件。
- 飞书、bytedcli 等能够从来源重新安装的第三方 Skill 内容。
- 工具运行时配置，除非经过人工检查并明确加入白名单。

## 新机器恢复

先把私有仓库克隆到 `~/.agents`，然后执行：

```bash
~/.agents/bootstrap.sh
```

脚本会把全局指令和个人 Skill 链接到 Codex/Claude 的配置目录，并安装提交前敏感信息检查。第三方工具按 [manifest/dependencies.md](manifest/dependencies.md) 安装；每台机器需要独立完成登录授权，凭据不跨设备同步。

## 日常同步

查看变化：

```bash
git -C ~/.agents status --short
git -C ~/.agents diff
```

确认内容无误后同步：

```bash
~/.agents/sync.sh "说明这次 Agent 学会了什么"
```

`sync.sh` 会先拉取远端、暂存白名单内变化、执行敏感信息检查、提交并推送。没有配置远端时只允许本地提交，不会猜测仓库地址。

## 新增个人 Skill

默认创建到 `~/.agents/skills/<skill-name>`。同时在 `.gitignore` 的 Skill 白名单中放行该目录，完成结构校验后再提交。第三方原样安装的 Skill 不加入白名单，记录来源即可。
