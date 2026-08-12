#!/bin/bash

# Cloudflare Workers 快速部署脚本
# 使用方法: 从项目根目录运行 ./cloudflare/deploy.sh

set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
CONFIG_PATH="$PROJECT_ROOT/cloudflare/wrangler.toml"
EXAMPLE_CONFIG_PATH="$PROJECT_ROOT/cloudflare/wrangler.example.toml"

cd "$PROJECT_ROOT"

echo "🚀 开始部署 Cloudflare Workers..."

# 检查私有配置
if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ 未找到 cloudflare/wrangler.toml"
    echo "请复制 wrangler.example.toml 并填写 namespace ID："
    echo "  cp cloudflare/wrangler.example.toml cloudflare/wrangler.toml"
    exit 1
fi

if grep -q 'YOUR_.*_KV_NAMESPACE_ID' "$CONFIG_PATH"; then
    echo "❌ KV namespace ID 尚未配置"
    echo "请填写 cloudflare/wrangler.toml 中的生产和预览 namespace ID。"
    exit 1
fi

# 样板是私有配置的来源，避免配置文件误删后无法恢复
if [ ! -f "$EXAMPLE_CONFIG_PATH" ]; then
    echo "❌ 未找到 cloudflare/wrangler.example.toml"
    exit 1
fi

# 检查是否已登录
echo "🔍 检查登录状态..."
if ! pnpm exec wrangler whoami > /dev/null 2>&1; then
    echo "⚠️  未登录 Cloudflare"
    echo "请运行: pnpm exec wrangler login"
    exit 1
fi

# 部署 Worker
echo "🌐 部署 Worker..."
pnpm run cf:deploy

echo ""
echo "✅ 部署成功！"
echo ""
echo "如需首次初始化 KV 数据，请在确认目标 namespace 后单独运行："
echo "  pnpm run cf:init"
echo ""
echo "请更新前端 API 地址："
echo "  在 .env.local 中设置 VITE_API_BASE=https://你的-worker.workers.dev/api"
echo ""
echo "测试 API："
echo "  curl https://personal-website-api.YOUR_SUBDOMAIN.workers.dev/api/data"
