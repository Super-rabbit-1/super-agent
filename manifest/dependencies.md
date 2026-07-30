# 可重装依赖

这里只记录来源和安装方式，不记录任何授权信息。版本变化快的依赖由各自 CLI 管理，不把安装产物复制进个人 Git 仓库。

## 飞书 CLI 与 Skills

```bash
npm install -g @larksuite/cli
npx skills add https://github.com/larksuite/cli -y -g
lark-cli auth login
```

授权必须在每台设备单独完成。

## bytedcli

仅适用于能访问公司内部 npm 源的设备：

```bash
NPM_CONFIG_REGISTRY=http://bnpm.byted.org npm install -g @bytedance-dev/bytedcli@latest
bytedcli self skill install --all -g
```

认证必须在每台设备单独完成。

## 浏览器工具

```bash
npm install -g agent-browser playwright-cli
```

`browser-use` 的运行时依赖按其 `SKILL.md` 当前说明安装，不在这里锁死易过期命令。

## 说人话 Skill

```bash
git clone https://github.com/MrGeDiao/shuorenhua.git ~/.agents/shuorenhua
```

当前验证过的提交：`6318b703e0c264dcf8822ee817bbea0519c6a62b`。如需完全复现，可在克隆后切到该提交；日常使用可跟随上游更新。
