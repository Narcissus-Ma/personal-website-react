const configuredApiBase = import.meta.env.VITE_API_BASE?.trim();
const defaultApiBase = import.meta.env.DEV
  ? 'http://localhost:3000/api'
  : '/api';

// 避免根目录 .env 中的本地地址被误打进生产构建产物。
const isLocalApiBase =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:\/|$)/i.test(
    configuredApiBase ?? ''
  );

export const API_BASE =
  import.meta.env.PROD && isLocalApiBase
    ? defaultApiBase
    : configuredApiBase || defaultApiBase;
