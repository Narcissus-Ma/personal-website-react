#!/usr/bin/env node

import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function backupKVData() {
  try {
    console.log('📥 从 Cloudflare KV 下载数据...');
    const data = execSync(
      'wrangler kv key get --binding=SITE_DATA "data" --remote',
      {
        cwd: __dirname,
      }
    ).toString();

    console.log('💾 保存到本地文件...');
    const backupPath = path.join(__dirname, '../src/data/data-backup.json');
    await writeFile(backupPath, data, 'utf8');

    console.log('✅ 数据备份成功！');
    console.log(`📁 备份文件位置：${backupPath}`);
  } catch (error) {
    console.error('❌ 数据备份失败：', error.message);
    process.exit(1);
  }
}

backupKVData();
