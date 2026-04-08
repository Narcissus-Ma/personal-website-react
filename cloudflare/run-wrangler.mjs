#!/usr/bin/env node

import { ensureWranglerLogDir, runWrangler } from './wrangler-cli.mjs';

async function main() {
  try {
    await ensureWranglerLogDir();
    const args = process.argv.slice(2);

    runWrangler(args, {
      logFileName: 'wrangler-command.log',
      stdio: 'inherit',
    });
  } catch (error) {
    const detail = error.stderr?.toString().trim() || error.message;
    console.error(detail);
    process.exit(1);
  }
}

main();
