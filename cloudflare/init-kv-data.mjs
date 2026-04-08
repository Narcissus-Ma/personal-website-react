#!/usr/bin/env node

import { readFile } from 'fs/promises';
import path from 'path';
import {
  createKVKeyPutArgs,
  ensureWranglerLogDir,
  projectRoot,
  runWrangler,
} from './wrangler-cli.mjs';

async function initKVData() {
  try {
    console.log('📖 读取 data.json 文件...');
    const dataPath = path.join(projectRoot, 'src/data/data.json');
    await readFile(dataPath, 'utf8');
    await ensureWranglerLogDir();

    console.log('📤 上传数据到 Cloudflare KV...');
    runWrangler(createKVKeyPutArgs('data', ['--path', dataPath]), {
      logFileName: 'init-kv-data.log',
      stdio: 'inherit',
    });

    console.log('✅ 数据上传成功！');
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    console.error('❌ 数据上传失败：', detail);
    process.exit(1);
  }
}

initKVData();
