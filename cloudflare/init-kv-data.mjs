#!/usr/bin/env node

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initKVData() {
  try {
    console.log('📖 读取 data.json 文件...');
    const dataPath = path.join(__dirname, '../src/data/data.json');
    await readFile(dataPath, 'utf8');

    console.log('📤 上传数据到 Cloudflare KV...');
    execSync(
      'wrangler kv key put --binding=SITE_DATA "data" --path=../src/data/data.json --remote --preview false',
      {
        stdio: 'inherit',
        cwd: __dirname,
      }
    );

    console.log('✅ 数据上传成功！');
  } catch (error) {
    console.error('❌ 数据上传失败：', error.message);
    process.exit(1);
  }
}

initKVData();
