import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const normalized = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
    let target = path.join(root, normalized === '/' ? 'index.html' : normalized);
    if (!target.startsWith(root)) throw new Error('Invalid path');
    try {
      const info = await stat(target);
      if (info.isDirectory()) target = path.join(target, 'index.html');
    } catch {
      target = path.join(root, 'index.html');
    }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Bouquet website running at http://localhost:${port}`);
  console.log('Keep this terminal open while viewing the website. Press Ctrl+C to stop.');
});
