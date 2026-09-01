# 🤖 AI Skills 团队技能库

团队共享的 AI Agent 技能仓库（Skills Repository），全面支持 **Cursor**、**CodeX**、**Antigravity**、**Claude Code** 等主流 AI 编程工具与终端命令行，用于沉淀自动化流程、测试账号生成、KYC 认证与研发提效工具。

---

## 📑 技能列表 (Skills Catalog)

| 技能名称 | 对应目录 | 功能描述 | 耗时 |
| :--- | :--- | :--- | :--- |
| **`create-test-account`** | `skills/create-test-account` | 3World 测试环境账号极速生成与 KYC 认证（支持普通账号、标准 Level 1、高级 Level 2 认证） | **~1.5s ~ 45s** |

---

## ⚡ 1 分钟快速安装 (Quick Start)

同事在本地终端中运行以下命令克隆并完成环境初始化：

```bash
# 1. 克隆仓库到本地
git clone git@github.com:HChen318/ai-skills.git ~/project/ai-skills

# 2. 进入目录并执行一键安装
cd ~/project/ai-skills
chmod +x install.sh
./install.sh
```

> **安装脚本做了什么？**
> 1. 在 `~/.local/bin` 中注册全局命令行工具 `ai-skill`。
> 2. 自动配置全局技能软链接，后续执行 `git pull` 即可实时同步团队最新技能。

---

## 🎯 Cursor 接入与使用指南

Cursor 用户可以通过以下两种方式让 AI 自动调度技能：

### 方式一：为你的前端/业务项目接入 Cursor Rules（推荐，最省心）

通过安装脚本直接将规则同步到你的当前项目：

```bash
cd ~/project/ai-skills
./install.sh --cursor /path/to/your/project
```

*（或者手动将 `ai-skills/cursor/rules/` 目录下的 `.mdc` 文件复制到你项目的 `.cursor/rules/` 目录下）*

**在 Cursor 中使用效果**：
在 Cursor 的 **Composer** 或 **Chat (Agent 模式)** 中，直接用自然语言对 AI 说：
> 💬 *"帮我在测试环境生成一个高级身份认证测试账号"*  
> 💬 *"生成一个完成了标准 KYC 认证的账号用于测试"*  
> 💬 *"生成一个已绑定手机的普通测试账号"*

Cursor 会自动读取 `.cursor/rules` 规则，并在后台终端静默调用 `ai-skill` 脚本，几秒到数十秒内将生成的账号、密码、手机号和认证状态返回给您！

---

### 方式二：在 Cursor 全局配置 Rules for AI

如果您希望在所有项目中都能直接唤起技能，无需在每个项目放规则文件：
1. 打开 Cursor：`Settings` -> `Features` -> 找到 **Rules for AI**（或 `User Rules`）。
2. 在输入框中添加以下指令：

```markdown
当用户要求生成 3World 测试环境账号或完成 KYC 身份认证时，请在终端执行对应命令：
- 高级认证账号 (Level 2): ai-skill create-test-account --level 2
- 标准认证账号 (Level 1): ai-skill create-test-account --level 1
- 基础注册账号 (Level 0): ai-skill create-test-account --level 0
执行完成后将账号邮箱、密码、手机号和限额信息整理呈现给用户。
```

---

## 💻 CodeX / 终端命令行接入指南

CodeX 及终端用户可以直接使用全局命令 `ai-skill` 或底层脚本执行：

### 1. 全局 CLI 命令调用

```bash
# 生成高级认证账号（Level 2，推荐，默认耗时约 35-45 秒）
ai-skill create-test-account --level 2

# 生成标准认证账号（Level 1，耗时约 18 秒）
ai-skill create-test-account --level 1

# 生成基础账号（Level 0，仅注册和绑定 +852 手机，耗时约 1.5 秒）
ai-skill create-test-account --level 0
```

### 2. CodeX Prompt 提示词集成

在 CodeX 自定义指令或对话中加入：
> *"如需生成测试账号，请调用 `ai-skill create-test-account --level 2` 并解析结果。"*

---

## 📖 技能详细说明：`create-test-account`

用于在 3World 测试环境（`https://dev-app.3worldglobal.com`）全自动生成测试账号与完成 KYC。

### 🚀 认证级别与性能指标

| 认证级别 | 自动化执行内容 | 耗时 | 账户权益与额度 |
| :--- | :--- | :--- | :--- |
| **Level 0 (普通账号)** | 纯 API 注册 + 邮箱验证 + 绑定 `+852` 手机号 | **~1.5 秒** | 基础账户权限 |
| **Level 1 (标准认证)** | 包含 Level 0 + 自动上传德国身份证正反面完成 Level 1 | **~15 - 20 秒** | 充值/提现每日 **10,000 USDT** |
| **Level 2 (高级认证)** | 包含 Level 1 + 自动上传地址证明账单完成 Level 2 | **~35 - 45 秒** | 充值/提现每日 **50,000 USDT** |

### 🔑 账号环境默认常量
- **测试环境地址**：`https://dev-app.3worldglobal.com`
- **默认密码**：`Password123!`
- **测试环境验证码**：`123456`（邮箱验证码与手机短信验证码均固定为 `123456`）
- **认证证件**：内置德国身份证样本与公共事业缴费地址证明账单

---

## 🛠️ 前置环境与依赖

1. **Node.js**：需安装 `Node.js >= 18.0.0`
2. **ego-browser**：用于浏览器自动化（涉及 Sumsub SDK 文件上传流程）。
3. **PATH 配置**：确保 `~/.local/bin` 在环境变量中。若终端找不到 `ai-skill`，可在 `~/.zshrc` 或 `~/.bashrc` 中追加：
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   ```

---

## ➕ 如何贡献新 Skill

欢迎向团队仓库贡献更多自动化技能！标准规范如下：

```
skills/
└── your-skill-name/
    ├── SKILL.md            # 技能元数据与提示词规则（必填）
    ├── resources/          # 静态测试文档、证件、模板等（选填）
    └── scripts/            # 自动化 Node.js/Python/Shell 脚本（选填）
```

添加后提 PR 合并到 `main` 分支，团队同事只需在 `ai-skills` 目录下执行 `git pull` 即可同步更新。

---

## ❓ 常见问题 (FAQ)

**Q1：终端提示 `command not found: ai-skill`？**  
A：请检查环境变量是否包含 `~/.local/bin`，运行 `export PATH="$HOME/.local/bin:$PATH"` 或重新打开终端窗口。

**Q2：运行高级认证时提示 `ego-browser` 相关的错误？**  
A：涉及 Sumsub SDK 页面上传的流程依赖 `ego-browser`。如未安装，请联系管理员获取 ego-browser 安装包。若仅需要纯注册/绑手机（Level 0），纯 API 流程不受影响。

**Q3：如何更新技能库？**  
A：进入 `~/project/ai-skills` 目录执行 `git pull` 即可自动同步所有最新技能与脚本。
