# 🤖 AI Skills 技能库

团队共享的 AI Agent 技能仓库（Skills Repository），专为 Antigravity / Cursor / Claude Code 等 AI 助手打造，用于沉淀自动化流程、自动化测试、运维操作与研发辅助技能。

---

## 📑 技能列表 (Skills Catalog)

| 技能名称 | 目录 | 功能描述 | 执行耗时 |
| :--- | :--- | :--- | :--- |
| **`create-test-account`** | `skills/create-test-account` | 3World 开发环境测试账号极速生成与 KYC 认证（支持普通账号、标准 Level 1、高级 Level 2 认证） | **~1.5s ~ 45s** |

---

## 🔒 私有仓库访问与同事安装说明（必读）

如果本仓库为 **Private（私密）仓库**，同事无法直接匿名拉取。请按以下步骤配置权限：

### 1. 仓库管理员配置
- 仓库管理员进入 GitHub 仓库页面：`Settings` -> `Collaborators` -> 点击 `Add people`。
- 搜索同事的 GitHub 用户名或注册邮箱，添加为协作者（赋予 Read 或 Write 权限）。

### 2. 同事本地环境准备
- 确保本地已配置好 GitHub SSH Key 或 Personal Access Token (PAT)，能正常拉取私有仓库。
- 测试 SSH 连通性：
  ```bash
  ssh -T git@github.com
  # 若输出 "Hi <username>! You've successfully authenticated..." 则说明权限正常
  ```

---

## 🚀 快速安装指南 (Installation)

### 方式一：一键自动安装（推荐）

克隆本仓库到本地（如 `~/project/ai-skills`），并运行一键安装脚本：

```bash
# 1. 克隆仓库
git clone git@github.com:HChen318/ai-skills.git ~/project/ai-skills

# 2. 进入目录并执行安装
cd ~/project/ai-skills
chmod +x install.sh
./install.sh
```

> **原理说明**：`install.sh` 会自动将 `skills/` 下的所有技能软链接至 Antigravity 的全局技能目录 `~/.gemini/config/skills/`，安装后全局生效，无需每次重启。

---

### 方式二：手动安装 / 软链接

如果您只想安装某个特定技能（例如 `create-test-account`）：

```bash
# 确保全局 skills 目录存在
mkdir -p ~/.gemini/config/skills

# 软链接技能到全局配置
ln -s ~/project/ai-skills/skills/create-test-account ~/.gemini/config/skills/create-test-account
```

---

## 📖 技能详细使用指南

### 1. `create-test-account`（测试账号与 KYC 生成器）

用于在 3World 测试环境（`https://dev-app.3worldglobal.com`）快速生成测试账号，并自动完成手机绑定、标准身份认证（Level 1）及高级身份认证（Level 2）。

#### ⚡ 性能指标

| 认证级别 | 操作内容 | 耗时 | 权限与额度 |
| :--- | :--- | :--- | :--- |
| **Level 0 (普通账号)** | 自动注册 + 邮箱验证 + 绑定 `+852` 手机号 | **~1.5 秒** | 基础账户权限 |
| **Level 1 (标准认证)** | 包含 Level 0 + 自动上传德国身份证正反面完成 Level 1 | **~15 - 20 秒** | 充值/提现每日 **10,000 USDT** |
| **Level 2 (高级认证)** | 包含 Level 1 + 自动上传地址证明账单完成 Level 2 | **~35 - 45 秒** | 充值/提现每日 **50,000 USDT** |

#### 💬 方式 A：在 AI 对话中直接调用（最便捷）

安装后，您可以在 Antigravity 聊天窗口中直接向 AI 发送自然语言指令：

- *"帮我在测试环境生成一个高级身份认证测试账号"*
- *"生成一个完成了标准 KYC 认证的账号"*
- *"生成一个已绑定手机的普通测试账号"*

AI 会自动触发 `create-test-account` 技能并在后台全自动完成所有步骤，最终将生成的账号、密码、绑定手机号及认证状态返回给您。

#### 💻 方式 B：终端命令行一键执行

也可以直接在终端中运行底层 Node 脚本：

```bash
# 生成高级认证账号（Level 2，默认）
node ~/.gemini/config/skills/create-test-account/scripts/fast-create-account.mjs --level 2

# 生成标准认证账号（Level 1）
node ~/.gemini/config/skills/create-test-account/scripts/fast-create-account.mjs --level 1

# 生成基础账号（Level 0，仅注册和绑手机）
node ~/.gemini/config/skills/create-test-account/scripts/fast-create-account.mjs --level 0
```

---

## 🛠️ 运行依赖与环境要求

1. **Node.js**：推荐 `Node.js >= 18.0.0`
2. **ego-browser**：用于浏览器自动化（涉及 Sumsub SDK 上传等场景）
3. **测试环境固定验证码**：测试环境邮箱和短信验证码均为 `123456`

---

## ➕ 如何贡献新 Skill

欢迎向本仓库添加更多通用的 AI 技能！标准目录结构如下：

```
skills/
└── your-skill-name/
    ├── SKILL.md            # 技能定义文件（包含元数据与详细执行指引，必填）
    ├── resources/          # 静态资源（模板、图片、测试文档等，选填）
    └── scripts/            # 自动化执行脚本（JS/Python/Bash 等，选填）
```

添加后提交 PR 并同步至主分支，团队其他成员 `git pull` 后执行 `./install.sh` 即可同步更新。

---

## ❓ 常见问题 (FAQ)

**Q1：同事执行 `git clone` 提示 `Permission denied (publickey)` 或 `Repository not found`？**  
A：说明该同事尚未被添加为仓库协作者，或本地未配置正确的 GitHub SSH 密钥。请让管理员在 GitHub 仓库的 `Settings` -> `Collaborators` 中添加该同事。

**Q2：运行脚本提示 `ego-browser: command not found`？**  
A：部分涉及 Sumsub 页面上传的流程依赖 `ego-browser`。如未安装，请联系管理员获取 ego-browser 安装包或配置。若只需纯注册/绑手机功能（Level 0），纯 API 流程不受影响。

**Q3：更新仓库后如何同步？**  
A：如果通过 `./install.sh` 创建的是软链接，只需在本地 `ai-skills` 目录执行 `git pull`，所有更新即刻实时生效。
