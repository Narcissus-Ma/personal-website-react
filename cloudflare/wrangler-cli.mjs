import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const wranglerConfigPath = path.join(__dirname, 'wrangler.toml');
const wranglerLogDir = path.join(projectRoot, '.wrangler-logs');
const localWranglerPath = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  'wrangler'
);

export const wranglerCommand = existsSync(localWranglerPath)
  ? process.platform === 'win32'
    ? `${localWranglerPath}.cmd`
    : localWranglerPath
  : 'wrangler';

export { projectRoot, wranglerConfigPath, wranglerLogDir };

function createWranglerEnv(logFileName) {
  return {
    ...process.env,
    WRANGLER_LOG_PATH: path.join(wranglerLogDir, logFileName),
  };
}

function getCommandOutput(args, logFileName = 'wrangler.log') {
  return execFileSync(wranglerCommand, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: createWranglerEnv(logFileName),
  });
}

export async function ensureWranglerLogDir() {
  await mkdir(wranglerLogDir, { recursive: true });
}

export function supportsRemoteFlag() {
  const helpText = getCommandOutput(
    ['kv', 'key', 'get', '--help'],
    'wrangler-help.log'
  );
  return helpText.includes('--remote');
}

export function runWrangler(args, options = {}) {
  const { logFileName = 'wrangler.log', stdio = 'pipe' } = options;

  return execFileSync(wranglerCommand, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: createWranglerEnv(logFileName),
    stdio,
  });
}

export function createKVKeyGetArgs(key, extraArgs = []) {
  const args = [
    'kv',
    'key',
    'get',
    key,
    '--binding=SITE_DATA',
    '--config',
    wranglerConfigPath,
    '--preview',
    'false',
    '--text',
    ...extraArgs,
  ];

  if (supportsRemoteFlag()) {
    args.push('--remote');
  }

  return args;
}

export function createKVKeyPutArgs(key, extraArgs = []) {
  const args = [
    'kv',
    'key',
    'put',
    key,
    '--binding=SITE_DATA',
    '--config',
    wranglerConfigPath,
    '--preview',
    'false',
    ...extraArgs,
  ];

  if (supportsRemoteFlag()) {
    args.push('--remote');
  }

  return args;
}
