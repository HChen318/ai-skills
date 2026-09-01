#!/usr/bin/env bash

# ==============================================================================
# AI Skills 安装脚本 (AI Skills Installer)
# 支持将本仓库的所有 Skills 安装/软链接到 Antigravity 全局 Skills 目录
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${SCRIPT_DIR}/skills"
TARGET_DIR="${HOME}/.gemini/config/skills"

echo "=========================================="
echo "🚀 正在安装 AI Skills 到本机环境..."
echo "=========================================="

# 1. 确保目标目录存在
mkdir -p "${TARGET_DIR}"

# 2. 检查前置依赖
echo ""
echo "🔍 检查运行环境与依赖..."

if command -v node >/dev/null 2>&1; then
    echo "  ✓ Node.js 已安装: $(node -v)"
else
    echo "  ⚠️ 未检测到 Node.js，部分脚本执行可能需要 Node.js (推荐 v18+)"
fi

if command -v ego-browser >/dev/null 2>&1; then
    echo "  ✓ ego-browser 已安装"
else
    echo "  ⚠️ 未检测到 ego-browser CLI 命令"
    echo "    提示: 涉及自动化浏览器操作的技能需要 ego-browser 支持。"
fi

# 3. 安装各个 Skill
echo ""
echo "📦 正在链接技能模块..."

for skill_path in "${SKILLS_DIR}"/*; do
    if [ -d "${skill_path}" ]; then
        skill_name="$(basename "${skill_path}")"
        dest_path="${TARGET_DIR}/${skill_name}"

        # 确保脚本具备可执行权限
        if [ -d "${skill_path}/scripts" ]; then
            chmod +x "${skill_path}/scripts"/* 2>/dev/null || true
        fi

        # 创建软链接（若已存在则替换）
        rm -rf "${dest_path}"
        ln -s "${skill_path}" "${dest_path}"
        echo "  ✓ 已安装技能: ${skill_name} -> ${dest_path}"
    fi
done

echo ""
echo "=========================================="
echo "🎉 安装完成！所有 Skills 已就绪。"
echo "=========================================="
echo ""
echo "💡 使用方式："
echo "1. 在 AI 对话窗口中直接下达指令："
echo "   - 「帮我在开发环境生成一个高级身份认证测试账号」"
echo "   - 「生成一个已绑定手机的标准认证账号」"
echo ""
echo "2. 或通过命令行直接调用脚本："
echo "   node ~/.gemini/config/skills/create-test-account/scripts/fast-create-account.mjs --level 2"
echo ""
