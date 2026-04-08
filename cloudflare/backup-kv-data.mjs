#!/usr/bin/env node

import { writeFile } from 'fs/promises';
import path from 'path';
import {
  createKVKeyGetArgs,
  ensureWranglerLogDir,
  projectRoot,
  runWrangler,
} from './wrangler-cli.mjs';

async function backupKVData() {
  try {
    await ensureWranglerLogDir();

    console.log('📥 从 Cloudflare KV 下载数据...');
    const data = runWrangler(createKVKeyGetArgs('data'), {
      logFileName: 'backup-kv-data.log',
    });

    console.log('💾 保存到本地文件...');
    const backupPath = path.join(projectRoot, 'src/data/data-backup.json');
    await writeFile(backupPath, data, 'utf8');

    console.log('✅ 数据备份成功！');
    console.log(`📁 备份文件位置：${backupPath}`);
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    console.error('❌ 数据备份失败：', detail);
    process.exit(1);
  }
}

backupKVData();
