export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const USER_AGENT =
      'Mozilla/5.0 (compatible; PersonalWebsiteFaviconFetcher/1.0; +https://example.com)';
    const DEFAULT_FAVICON_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect x="6" y="6" width="52" height="52" rx="10" fill="#f0f2f5"/>
  <path d="M20 22h24v6H20zm0 12h18v6H20zm0 12h24v6H20z" fill="#8c8c8c"/>
</svg>`;

    const normalizeHttpUrl = raw => {
      const input = (raw || '').trim();
      if (!input) return null;
      try {
        return new URL(input);
      } catch {
        try {
          return new URL(`https://${input}`);
        } catch {
          return null;
        }
      }
    };

    const isPrivateOrUnsafeHost = hostname => {
      const lowerHost = (hostname || '').toLowerCase();
      if (!lowerHost) return true;
      if (lowerHost === 'localhost' || lowerHost.endsWith('.local'))
        return true;

      const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(lowerHost);
      if (isIpv4) {
        const parts = lowerHost.split('.').map(v => Number(v));
        if (parts.some(v => Number.isNaN(v) || v < 0 || v > 255)) return true;
        const [a, b] = parts;
        if (a === 0) return true;
        if (a === 10) return true;
        if (a === 127) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
        return false;
      }

      const isIpv6 = lowerHost.includes(':');
      if (isIpv6) {
        const h = lowerHost;
        if (h === '::1' || h === '::') return true;
        if (h.startsWith('fc') || h.startsWith('fd')) return true; // ULA
        if (h.startsWith('fe80')) return true; // link-local
        return false;
      }

      return false;
    };

    const fetchWithTimeout = async (resource, init, timeoutMs) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(resource, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const parseIconCandidatesFromHtml = (html, baseUrlString) => {
      const candidates = [];
      const baseUrl = new URL(baseUrlString);
      const linkTags = html.match(/<link\b[^>]*>/gi) || [];

      const getAttr = (tag, name) => {
        const re = new RegExp(
          // eslint-disable-next-line no-useless-escape
          `${name}\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s>]+))`,
          'i'
        );
        const match = tag.match(re);
        return (match?.[2] || match?.[3] || match?.[4] || '').trim();
      };

      const normalizeRel = relValue =>
        relValue.toLowerCase().split(/\s+/).filter(Boolean);

      for (const tag of linkTags) {
        const rel = getAttr(tag, 'rel');
        const href = getAttr(tag, 'href');
        if (!rel || !href) continue;

        const relTokens = normalizeRel(rel);
        const isIcon =
          relTokens.includes('icon') ||
          relTokens.includes('shortcut') ||
          relTokens.includes('apple-touch-icon') ||
          relTokens.includes('apple-touch-icon-precomposed') ||
          relTokens.includes('mask-icon');
        if (!isIcon) continue;

        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          candidates.push(absoluteUrl);
        } catch {
          // ignore
        }
      }

      // 去重并保持顺序
      return [...new Set(candidates)];
    };

    const tryFetchIcon = async iconUrl => {
      try {
        const response = await fetchWithTimeout(
          iconUrl,
          {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'User-Agent': USER_AGENT,
              Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
            },
            cf: { cacheTtl: 86400, cacheEverything: true },
          },
          6000
        );

        if (!response.ok) return null;
        const contentType = response.headers.get('content-type') || '';
        const looksLikeImage =
          contentType.startsWith('image/') ||
          contentType.includes('icon') ||
          iconUrl.toLowerCase().endsWith('.ico') ||
          iconUrl.toLowerCase().endsWith('.png') ||
          iconUrl.toLowerCase().endsWith('.svg');
        if (!looksLikeImage) return null;

        const body = await response.arrayBuffer();
        if (!body || body.byteLength === 0) return null;

        return {
          body,
          contentType: contentType || 'image/x-icon',
        };
      } catch {
        return null;
      }
    };

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (pathname === '/api/favicon' && request.method === 'GET') {
      const rawTarget = url.searchParams.get('url') || '';
      const targetUrl = normalizeHttpUrl(rawTarget);

      if (!targetUrl || !['http:', 'https:'].includes(targetUrl.protocol)) {
        return new Response(DEFAULT_FAVICON_SVG, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Favicon-Source': 'invalid-url',
          },
        });
      }

      if (isPrivateOrUnsafeHost(targetUrl.hostname)) {
        return new Response(DEFAULT_FAVICON_SVG, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Favicon-Source': 'blocked-host',
          },
        });
      }

      const cache = caches.default;
      const cacheKey = new Request(url.toString(), { method: 'GET' });
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const originFavicon = new URL(
        '/favicon.ico',
        targetUrl.origin
      ).toString();
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        targetUrl.hostname
      )}&sz=64`;

      let iconResult = await tryFetchIcon(originFavicon);
      let source = 'origin-favicon-ico';

      if (!iconResult) {
        try {
          const pageResponse = await fetchWithTimeout(
            targetUrl.toString(),
            {
              method: 'GET',
              redirect: 'follow',
              headers: {
                'User-Agent': USER_AGENT,
                Accept:
                  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
              cf: { cacheTtl: 3600, cacheEverything: true },
            },
            8000
          );

          const finalPageUrl = pageResponse.url || targetUrl.toString();
          const contentType = pageResponse.headers.get('content-type') || '';

          if (pageResponse.ok && contentType.includes('text/html')) {
            const html = await pageResponse.text();
            const candidates = parseIconCandidatesFromHtml(html, finalPageUrl);
            for (const candidate of candidates) {
              const result = await tryFetchIcon(candidate);
              if (result) {
                iconResult = result;
                source = 'html-link';
                break;
              }
            }

            if (!iconResult) {
              const finalOriginFavicon = new URL(
                '/favicon.ico',
                finalPageUrl
              ).toString();
              iconResult = await tryFetchIcon(finalOriginFavicon);
              if (iconResult) source = 'final-origin-favicon-ico';
            }
          }
        } catch {
          // ignore
        }
      }

      if (!iconResult) {
        iconResult = await tryFetchIcon(googleFavicon);
        if (iconResult) source = 'google-s2';
      }

      if (!iconResult) {
        const response = new Response(DEFAULT_FAVICON_SVG, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'X-Favicon-Source': 'fallback-svg',
          },
        });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      }

      const response = new Response(iconResult.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': iconResult.contentType,
          'Cache-Control': 'public, max-age=86400',
          'X-Favicon-Source': source,
        },
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    if (pathname === '/api/auth/verify' && request.method === 'POST') {
      try {
        const { password } = await request.json();
        const storedPassword = await env.SITE_DATA.get('admin_password');

        if (!storedPassword) {
          return new Response(
            JSON.stringify({ success: false, message: '系统未配置密码' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        if (password === storedPassword) {
          return new Response(
            JSON.stringify({ success: true, message: '验证成功' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, message: '密码错误' }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (err) {
        console.error(err);
        return new Response(
          JSON.stringify({ success: false, message: '验证失败' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    if (pathname === '/api/save' && request.method === 'POST') {
      try {
        const data = await request.json();
        await env.SITE_DATA.put('data', JSON.stringify(data, null, 2));
        return new Response(JSON.stringify({ message: '保存成功' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: '保存失败' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (pathname === '/api/data' && request.method === 'GET') {
      try {
        const data = await env.SITE_DATA.get('data');
        if (!data) {
          return new Response(
            JSON.stringify({
              categories: [],
              searchEngines: [],
              backgrounds: [
                {
                  name: '默认背景',
                  url: null,
                },
              ],
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        return new Response(data, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: '读取失败' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
