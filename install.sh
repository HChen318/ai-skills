#!/usr/bin/env bash

# ==============================================================================
# AI Skills 安装脚本 (AI Skills Installer)
# 支持 Cursor / CodeX / Antigravity / 命令行一键配置
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${SCRIPT_DIR}/skills"
BIN_DIR="${HOME}/.local/bin"
ANTIGRAVITY_DIR="${HOME}/.gemini/config/skills"

echo "=================================================="
echo "🚀 正在安装 AI Skills 到本机环境..."
echo "=================================================="

# 1. 检查运行环境
echo ""
echo "🔍 [1/3] 检查环境与依赖..."

if command -v node >/dev/null 2>&1; then
    echo "  ✓ Node.js 已就绪: $(node -v)"
else
    echo "  ⚠️ 未检测到 Node.js，脚本运行需要 Node.js (推荐 v18+)"
fi

if command -v ego-browser >/dev/null 2>&1; then
    echo "  ✓ ego-browser 已就绪"
else
    echo "  ⚠️ 未检测到 ego-browser 命令"
    echo "    提示: 涉及自动化浏览器操作的技能（如 KYC 自动上传）需要 ego-browser 支持。"
fi

# 2. 安装全局 CLI 命令 ai-skill 到 ~/.local/bin
echo ""
echo "📦 [2/3] 安装全局命令行工具 'ai-skill'..."
mkdir -p "${BIN_DIR}"
ln -sf "${SCRIPT_DIR}/bin/ai-skill" "${BIN_DIR}/ai-skill"
chmod +x "${SCRIPT_DIR}/bin/ai-skill"

# 检查 PATH 是否包含 ~/.local/bin
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo "  ℹ️ 提示: 请确保 ~/.local/bin 在您的 PATH 环境变量中。"
    echo "     可在 ~/.zshrc 或 ~/.bashrc 中添加: export PATH=\"\$HOME/.local/bin:\$PATH\""
else
    echo "  ✓ 全局命令已就绪: ai-skill"
fi

# 3. 安装到 Antigravity 全局技能目录（若使用 Antigravity）
echo ""
echo "🔗 [3/3] 链接 Skills 模块..."
mkdir -p "${ANTIGRAVITY_DIR}"

for skill_path in "${SKILLS_DIR}"/*; do
    if [ -d "${skill_path}" ]; then
        skill_name="$(basename "${skill_path}")"
        dest_path="${ANTIGRAVITY_DIR}/${skill_name}"

        if [ -d "${skill_path}/scripts" ]; then
            chmod +x "${skill_path}/scripts"/* 2>/dev/null || true
        fi

        rm -rf "${dest_path}"
        ln -s "${skill_path}" "${dest_path}"
        echo "  ✓ 已链接技能: ${skill_name}"
    fi
done

# 4. 如果指定了 --cursor 参数，将 Cursor Rules 安装到指定项目
if [ "$1" = "--cursor" ] && [ -n "$2" ]; then
    TARGET_PROJECT="$2"
    if [ -d "${TARGET_PROJECT}" ]; then
        echo ""
        echo "🎯 正在将 Cursor Rules 安装到项目: ${TARGET_PROJECT}"
        mkdir -p "${TARGET_PROJECT}/.cursor/rules"
        cp -r "${SCRIPT_DIR}/cursor/rules/"* "${TARGET_PROJECT}/.cursor/rules/"
        echo "  ✓ 已成功复制 Cursor Rules 到 ${TARGET_PROJECT}/.cursor/rules/"
    fi
fi

echo ""
echo "=================================================="
echo "🎉 安装完成！"
echo "=================================================="
echo ""
echo "💡 如何在不同工具中使用："
echo ""
echo "1️⃣ 【Cursor 用户】"
echo "   - 方式 A：在 Cursor 项目中添加规则，将 ${SCRIPT_DIR}/cursor/rules/ 下的文件放入项目 .cursor/rules/ 目录。"
echo "   - 方式 B：在 Cursor 对话/Composer 中直接对 AI 说：「帮我生成一个高级身份认证测试账号」"
echo ""
echo "2️⃣ 【CodeX / CLI 用户】"
echo "   - 终端直接执行："
echo "     ai-skill create-test-account --level 2   # 高级认证 (Level 2)"
echo "     ai-skill create-test-account --level 1   # 标准认证 (Level 1)"
echo "     ai-skill create-test-account --level 0   # 基础账号"
echo ""
echo "3️⃣ 【Antigravity 用户】"
echo "   - 自动识别全局技能，直接在对话框使用自然语言下达指令即可。"
echo ""
