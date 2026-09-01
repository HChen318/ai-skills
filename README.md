# 🤖 AI Skills

团队共享的 Agent Skills 技能库。

---

## ⚡ 安装方式 (Install)

### 1. 全局安装（推荐，所有项目通用）

```bash
npx skills add HChen318/ai-skills -g
```

### 2. 项目级安装（仅当前项目生效）

在业务项目根目录下执行：

```bash
npx skills add HChen318/ai-skills
```

> 备选命令：`npx bzskills add HChen318/ai-skills --skill create-test-account`

---

## 🛠️ 前置环境依赖

1. **Node.js**：`>= 18.0.0`
2. **ego lite 浏览器**（完成 Level 1/2 身份认证必需）：
   - 官网下载：[https://lite.ego.app/](https://lite.ego.app/)
   - 安装 `ego lite.app` 并打开完成首次引导，命令行工具 `ego-browser` 会自动注册到系统。
   - 终端验证：`ego-browser --version`

---

## 📑 技能列表 (Skills)

### `create-test-account`

3World 开发测试环境账号秒级生成与身份认证（KYC）。

#### 💡 使用方式

安装后，在 **Cursor**、**CodeX** 或 **Antigravity** 对话框中直接使用自然语言提需求：

- 💬 *"帮我生成一个高级身份认证测试账号"*
- 💬 *"生成一个完成了标准 KYC 认证的测试账号"*
- 💬 *"生成一个已绑定手机的普通测试账号"*

#### 🔑 环境默认常量
- **测试环境地址**：`https://dev-app.3worldglobal.com`
- **默认密码**：`Password123!`
- **测试环境验证码**：`123456`
