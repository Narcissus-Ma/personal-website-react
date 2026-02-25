import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import { parse } from 'url';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');

  if (pathname === '/api/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
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
      const data = JSON.parse(fileContent);

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
