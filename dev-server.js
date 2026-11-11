/**
 * dev-server.js
 * 
 * 로컬 개발 및 테스트를 위한 가벼운 Node.js 내장 HTTP 서버입니다.
 * - 정적 파일(index.html, CSS, JS) 서빙
 * - POST /api/analyze 요청 시 Vercel 서버리스 함수 핸들러(api/analyze.js)와 연결
 * - 외부 복잡한 도구 설치 없이 node dev-server.js 한 줄로 즉시 실행됩니다.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeHandler from './api/analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// 지원하는 MIME 타입 목록
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  // 1. API 요청 처리 (/api/analyze)
  if (urlPath === '/api/analyze') {
    return analyzeHandler(req, res);
  }

  // 2. 정적 파일 서빙
  let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

  // 디렉터리 탐색 방지 (보안)
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Moodline 로컬 개발 서버가 시작되었습니다!`);
  console.log(`👉 브라우저 주소: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

