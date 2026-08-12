# Cloudflare Worker 目录

此目录包含 Worker 代码、KV 初始化/备份脚本和 Wrangler 配置样板。

- `worker.mjs`：Worker API 实现。
- `wrangler.example.toml`：可提交的配置样板；复制为本地私有的 `wrangler.toml` 后填写 KV namespace ID。
- `wrangler-cli.mjs`、`run-wrangler.mjs`：所有 `cf:*` 命令共用的 Wrangler 包装器。
- `init-kv-data.mjs`、`backup-kv-data.mjs`：KV 数据初始化与备份脚本。
- `set-password.mjs`：写入管理页面密码的脚本；它不提供 API 写接口保护。

完整的配置、部署、安全限制和数据恢复说明见 [Cloudflare Workers 部署指南](../docs/cloudflare_server_deploy.md)。
