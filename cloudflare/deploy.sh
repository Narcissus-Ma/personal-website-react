#!/bin/bash

# Cloudflare Workers 快速部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 Cloudflare Workers..."

# 检查是否已安装 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI 未安装"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
echo "🔍 检查登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  未登录 Cloudflare"
    echo "请运行: wrangler login"
    exit 1
fi

# 检查 KV 命名空间是否已配置
echo "🔍 检查 KV 命名空间配置..."
if grep -q "your-kv-namespace-id" cloudflare/wrangler.toml; then
    echo "⚠️  KV 命名空间未配置"
    echo ""
    echo "请先运行以下命令创建 KV 命名空间："
    echo "  wrangler kv namespace create \"SITE_DATA\""
    echo "  wrangler kv namespace create \"SITE_DATA\" --preview"
    echo ""
    echo "然后将输出的 id 和 preview_id 填入 cloudflare/wrangler.toml"
    exit 1
fi

# 初始化 KV 数据
echo "📤 初始化 KV 数据..."
node cloudflare/init-kv-data.mjs

# 部署 Worker
echo "🌐 部署 Worker..."
wrangler deploy --config cloudflare/wrangler.toml

echo ""
echo "✅ 部署成功！"
echo ""
echo "请更新前端 API 地址："
echo "  在 src/stores/site-store.ts 中将 API_BASE 修改为你的 Worker URL"
echo ""
echo "测试 API："
echo "  curl https://personal-website-api.YOUR_SUBDOMAIN.workers.dev/api/data"
