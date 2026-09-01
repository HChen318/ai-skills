#!/usr/bin/env bash

# ==============================================================================
# AI Skills 安装脚本 (Agent Skills Standard Installer)
# 将 skills/ 下的所有技能软链接到全局 AI Skills 目录 (~/.gemini/config/skills/)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="${SCRIPT_DIR}/skills"
TARGET_DIR="${HOME}/.gemini/config/skills"

echo "=========================================="
echo "🚀 正在安装 AI Skills..."
echo "=========================================="

mkdir -p "${TARGET_DIR}"

for skill_path in "${SKILLS_DIR}"/*; do
    if [ -d "${skill_path}" ]; then
        skill_name="$(basename "${skill_path}")"
        dest_path="${TARGET_DIR}/${skill_name}"

        # 赋予脚本执行权限
        if [ -d "${skill_path}/scripts" ]; then
            chmod +x "${skill_path}/scripts"/* 2>/dev/null || true
        fi

        # 创建全局软链接
        rm -rf "${dest_path}"
        ln -s "${skill_path}" "${dest_path}"
        echo "  ✓ 已挂载技能: ${skill_name}"
    fi
done

echo ""
echo "=========================================="
echo "🎉 安装完成！所有技能已就绪。"
echo "=========================================="
echo ""
echo "💡 使用方式："
echo "在 Cursor、CodeX 或 Antigravity 中直接使用自然语言对话即可："
echo "  - 「帮我在开发环境生成一个高级身份认证测试账号」"
echo "  - 「生成一个已绑定手机的标准认证账号」"
echo ""
