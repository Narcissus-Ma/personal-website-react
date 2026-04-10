import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_SITE_DATA = {
  categories: [],
  searchEngines: [],
  backgrounds: [
    {
      name: '默认背景',
      url: null,
    },
  ],
  headerTagLinks: [
    {
      id: 'about',
      name: '关于我',
      en_name: 'About',
      url: '/about',
      isExternal: false,
      position: 'header',
      target: '_self',
      iconType: 'antd',
      iconName: 'InfoCircleOutlined',
      iconUrl: '',
      order: 1,
      enabled: true,
    },
  ],
  footerTagLinks: [
    {
      id: 'friend-github',
      name: 'GitHub',
      en_name: 'GitHub',
      url: 'https://github.com/Narcissus-Ma',
      isExternal: true,
      position: 'footer',
      target: '_blank',
      iconType: 'antd',
      iconName: 'GithubOutlined',
      iconUrl: '',
      order: 1,
      enabled: true,
    },
  ],
};

const normalizeTagLinks = (tagLinks, position, fallback) => {
  if (tagLinks === undefined) {
    return fallback;
  }

  if (!Array.isArray(tagLinks)) {
    return [];
  }
  if (tagLinks.length === 0) {
    return [];
  }

  const nextLinks = tagLinks
    .filter(item => item && item.position === position && item.url)
    .map((item, index) => ({
      id: item.id || `${position}-${index + 1}`,
      name: item.name || '未命名',
      en_name: item.en_name || item.name || 'Untitled',
      url: item.url,
      isExternal: !!item.isExternal,
      position,
      target: item.target || (item.isExternal ? '_blank' : '_self'),
      iconType: item.iconType || 'none',
      iconName: item.iconName || '',
      iconUrl: item.iconUrl || '',
      order: typeof item.order === 'number' ? item.order : index + 1,
      enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
    }))
    .sort((a, b) => a.order - b.order);

  return nextLinks.length > 0 ? nextLinks : fallback;
};

const normalizeSiteData = rawData => {
  const data = rawData && typeof rawData === 'object' ? rawData : {};

  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
    searchEngines: Array.isArray(data.searchEngines) ? data.searchEngines : [],
    backgrounds:
      Array.isArray(data.backgrounds) && data.backgrounds.length > 0
        ? data.backgrounds
        : DEFAULT_SITE_DATA.backgrounds,
    headerTagLinks: normalizeTagLinks(
      data.headerTagLinks,
      'header',
      DEFAULT_SITE_DATA.headerTagLinks
    ),
    footerTagLinks: normalizeTagLinks(
      data.footerTagLinks,
      'footer',
      DEFAULT_SITE_DATA.footerTagLinks
    ),
  };
};

const server = createServer(async (req, res) => {
  // 使用 WHATWG URL API 替代 url.parse()
  const parsedUrl = new URL(`http://localhost:3000${req.url}`);
  const pathname = parsedUrl.pathname;

  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = normalizeSiteData(JSON.parse(body));
        const filePath = path.join(__dirname, 'src/data/data.json');

        await writeFile(filePath, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: '保存成功' }));
      } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '保存失败' }));
      }
    });
  } else if (pathname === '/api/data' && req.method === 'GET') {
    try {
      const filePath = path.join(__dirname, 'src/data/data.json');
      const fileContent = await readFile(filePath, 'utf8');
      const data = normalizeSiteData(JSON.parse(fileContent));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '读取失败' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
