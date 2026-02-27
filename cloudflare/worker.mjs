export default {
  // eslint-disable-next-line no-unused-vars
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

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
            JSON.stringify({ categories: [], searchEngines: [] }),
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
