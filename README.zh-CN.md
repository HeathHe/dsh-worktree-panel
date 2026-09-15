# dsh-worktree-panel

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-worktree-panel"><img alt="npm 版本" src="https://img.shields.io/npm/v/dsh-worktree-panel?label=npm&color=blue"></a>
  <a href="https://www.npmjs.com/package/dsh-worktree-panel"><img alt="月下载量" src="https://img.shields.io/npm/dm/dsh-worktree-panel?label=%E6%9C%88%E4%B8%8B%E8%BD%BD&color=brightgreen"></a>
  <a href="https://github.com/HeathHe/dsh-worktree-panel"><img alt="stars" src="https://img.shields.io/github/stars/HeathHe/dsh-worktree-panel?style=social"></a>
  <a href="https://github.com/HeathHe/dsh-worktree-panel/blob/main/LICENSE"><img alt="许可证" src="https://img.shields.io/github/license/HeathHe/dsh-worktree-panel?color=orange"></a>
  <img alt="平台" src="https://img.shields.io/badge/platform-DeepSeek%20Harness%20Web-8A2BE2">
</p>

<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面增加 Git worktree 维度的分支管理面板：在官方工作区/会话侧边栏上展示 **项目 → 主工作树 / 分支 worktree → 会话**，同时保留官方列表的原有交互。

---

## 使用

### 安装

```sh
dsh plugin --profile web add dsh-worktree-panel
```

安装完成后重启 `dsh web`，工作区侧边栏中将出现 worktree 层级。

安装指定版本：

```sh
dsh plugin --profile web add dsh-worktree-panel@0.1.6
```

### 升级

```sh
dsh plugin --profile web add dsh-worktree-panel@<版本>
# 然后重启 dsh web。
```

### 本地开发

```sh
dsh plugin --profile web add link:/到/dsh-worktree-panel/的绝对路径
```

---

## 功能

- **主工作树 + 分支 worktree** — 在项目组中展示主工作树、当前分支、干净/有改动状态和各分支 worktree。
- **会话管理** — 在 worktree 中开启会话、删除 worktree，以及切换主工作树分支。
- **一键创建** — 为已有分支创建 worktree，或新建分支并同时创建 worktree。
- **非 Git 目录会话优先** — 项目行「＋」默认直接开启对话；「初始化 Git 并启用 Worktree」位于项目的更多操作菜单中。
- **落盘位置可配置** — 默认存放在 `<项目>/.dsh/workspaces/`，也可以改为自定义全局目录。
- **安全迁移** — 更改存放位置时检测并迁移已有 worktree，自动跳过存在未提交改动或活跃会话的目录。
- **渐进增强** — 非 Git 工作区保留默认会话流程，只额外提供可选的 Git/worktree 初始化入口。

---

## 兼容性

- 已适配并测试 **DSH Desktop 2.0.3 / DeepSeek Harness 0.1.1-rc.2**。
- DSH peerDependencies 范围：`>=0.1.1-rc.2 <0.2.0`。
- 通过 `settings.section` 注册独立的 Worktree 设置页。
- 兼容当前 Host 描述数据源和用户主目录路径缩写。

### 生成客户端 bundle

`lib/client.js` 由 `lib/build.mjs` 从官方 `@deepseek-ai/dsh-client-ui-workspace` 浏览器 bundle 生成。构建过程会验证官方包版本，并在生成文件头部记录来源版本。

构建还会根据客户端实际引用的模块，同步 `package.json` 中的 `dsh.client.external`，确保 DSH 在启动插件前加载依赖代码。`inject` 是服务注入声明，不能替代这份模块加载声明。

需要时可以显式指定官方 bundle：

```sh
DSH_WORKSPACE_BUNDLE=/到/client.js/的绝对路径 npm run build
```

---

## 许可证

MIT。`lib/client.js` 衍生自 `@deepseek-ai/dsh-client-ui-workspace`，详见 `NOTICE` 和 `LICENSE`。
