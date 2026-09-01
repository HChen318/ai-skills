# 🤖 AI Agent Skills 技能库

遵循业界标准 **Agent Skills 规范** 的团队共享技能库，专为 **Cursor**、**CodeX**、**Antigravity**、**Claude Code** 等 AI 编程助手与自动化智能体设计。

---

## 🎯 什么是 Agent Skills 规范？

在现代 AI Agent 生态中，每个 **Skill（技能）** 都是一个**完全独立、自包含**的模块目录：

```
skills/
└── <skill-name>/
    ├── SKILL.md            # 核心技能定义（YAML Frontmatter 元数据 + AI 指引）
    ├── scripts/            # 自动化执行脚本（Node.js / Python / Bash）
    └── resources/          # 静态资产（证件模板、数据文件、示例资源）
```

### ✨ 为什么不需要多余的胶水代码？
- **自包含与单一事实源**：AI Agent（Cursor / CodeX / Antigravity）原生具备阅读 `SKILL.md`、理解上下文并直接在后台调度 `scripts/` 下脚本的能力。
- **跨平台通用**：无需维护各 IDE 专有的冗余配置，一份标准的 Skill 可在所有 AI Agent 环境中即插即用。

---

## 📑 技能列表 (Skills Catalog)

| 技能名称 | 目录 | 功能描述 | 耗时 | 依赖环境 |
| :--- | :--- | :--- | :--- | :--- |
| **`create-test-account`** | [`skills/create-test-account`](./skills/create-test-account/SKILL.md) | 3World 测试环境账号极速生成与 KYC 认证（支持普通账号、标准 Level 1、高级 Level 2 认证） | **~1.5s ~ 45s** | Node.js (Level 0)<br>+ ego lite 浏览器 (Level 1/2) |

---

## ⚡ 快速安装与配置 (1 分钟)

### 步骤 1：克隆仓库并挂载技能

在本地终端运行：

```bash
# 1. 克隆仓库到本地
git clone git@github.com:HChen318/ai-skills.git ~/project/ai-skills

# 2. 运行一键挂载脚本
cd ~/project/ai-skills
chmod +x install.sh
./install.sh
```

> **原理**：`install.sh` 会将 `skills/` 目录下的所有标准技能软链接至全局 Agent 技能目录（`~/.gemini/config/skills/`），后续执行 `git pull` 即可实时无缝同步团队最新技能。

---

## 💬 如何使用？（一定要在终端运行吗？）

> ### 💡 重点说明：**不需要手动在本地终端运行！**
> 
> 在 **Cursor**（Composer / Agent 模式）、**CodeX** 或 **Antigravity** 中，你**只需在 AI 聊天窗口直接使用自然语言提需求**，AI 会在后台自动执行脚本，执行完毕后将生成的账号信息直接回复给你。
> 
> 终端命令行仅作为**备用/批量脚本**使用方式。

### 方式一：在 Cursor / CodeX 对话中直接使用（最推荐）

安装完成后，在 Cursor 或 CodeX 中直接发指令：

- 💬 *"帮我在测试环境生成一个高级身份认证测试账号"*
- 💬 *"生成一个完成了标准 KYC 认证的账号"*
- 💬 *"生成一个已绑定手机的普通测试账号"*

**AI 执行逻辑**：
1. AI 自动识别 `create-test-account` 技能及其触发词。
2. AI 读取技能目录下的 `scripts/fast-create-account.mjs` 并在后台自动执行。
3. 几秒至几十秒内将生成的**账号邮箱**、**登录密码**、**绑定手机号**及**认证状态/限额**整理输出。

---

### 方式二：在本地终端直接运行（可选 / CLI 模式）

若需跳过 AI 对话在本地脚本、CI/CD 流水线或批量创建账号时，可直接在终端执行：

```bash
# 生成高级认证账号（Level 2，推荐，默认耗时约 35-45 秒）
node ~/project/ai-skills/skills/create-test-account/scripts/fast-create-account.mjs --level 2

# 生成标准认证账号（Level 1，耗时约 18 秒）
node ~/project/ai-skills/skills/create-test-account/scripts/fast-create-account.mjs --level 1

# 生成基础注册账号（Level 0，仅注册+绑手机，纯 API，耗时约 1.5 秒）
node ~/project/ai-skills/skills/create-test-account/scripts/fast-create-account.mjs --level 0
```

---

## 🛠️ 前置环境与 ego lite 浏览器安装说明

### 1. Node.js
- 要求：`Node.js >= 18.0.0`

### 2. ego lite 浏览器 (ego-browser) 安装
- **什么时候需要安装？**
  - **Level 0 (普通账号)**：纯后台 HTTP API 交互，**无需任何浏览器**，有 Node.js 即可 1.5 秒秒级生成。
  - **Level 1 (标准认证) & Level 2 (高级认证)**：涉及第三方 **Sumsub WebSDK** 的跨域 iframe 自动化操作及证件图片注入，**需要安装 ego lite 浏览器**。
- **如何安装 ego lite？**
  1. 访问官网下载安装包：[https://lite.ego.app/](https://lite.ego.app/)
  2. 安装 `ego lite.app` 到「应用程序」（Applications）目录。
  3. 首次打开 `ego lite` 完成引导，它会自动在系统 `~/.local/bin/ego-browser` 注册命令行工具。
  4. 验证安装：在终端输入 `ego-browser --version`，输出版本号即代表就绪。

---

## 📖 技能详情：`create-test-account`

### 🚀 认证级别与性能对比

| 认证级别 | 操作内容 | 优化前耗时 | 优化后耗时 | 提速效果 | 账户限额 | 依赖 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 0 (普通账号)** | 纯 API 注册 + 邮箱验证 + 绑定 `+852` 手机号 | ~180s | **~1.5 秒** | **⚡ 99.2%** | 基础权限 | Node.js |
| **Level 1 (标准认证)** | Level 0 + 自动上传德国身份证正反面完成认证 | ~240s | **~15 - 20 秒** | **⚡ 92.5%** | 每日 **10,000 USDT** | Node.js + ego lite |
| **Level 2 (高级认证)** | Level 1 + 自动上传地址证明账单完成高级认证 | ~353s (5m 53s) | **~35 - 45 秒** | **⚡ 88.7%** | 每日 **50,000 USDT** | Node.js + ego lite |

### 🔑 默认环境常量
- **测试环境地址**：`https://dev-app.3worldglobal.com`
- **默认密码**：`Password123!`
- **测试环境验证码**：`123456`（邮箱验证码与手机短信验证码均固定为 `123456`）
- **内置证件资源**：`resources/` 目录下提供德国身份证（正反面）与公共事业账单。

---

## ➕ 如何新增一个标准 Skill

向团队仓库贡献新技能极其简单：

1. 在 `skills/` 下新建技能目录：`skills/your-skill-name/`
2. 创建核心定义文件 `SKILL.md`，编写 YAML Frontmatter 和操作指引：
   ```markdown
   ---
   name: your-skill-name
   description: 简明描述技能的用途与触发场景
   ---

   # 技能名称

   ## 触发条件与使用指南
   ...
   ```
3. 如有可执行脚本或资源，放入 `scripts/` 和 `resources/` 目录。
4. 提交 PR 合并至 `main` 分支。
