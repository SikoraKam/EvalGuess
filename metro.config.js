const path = require('node:path');
const fs = require('node:fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const positionsDir = path.join(projectRoot, 'positions');
const generatedDir = path.join(positionsDir, 'generated');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.server.enhanceMiddleware = (middleware) => {
  return (request, response, next) => {
    if (!request.url?.startsWith('/positions-data')) {
      return middleware(request, response, next);
    }

    try {
      const url = new URL(request.url, 'http://localhost');
      const relativePath = url.pathname.replace(/^\/positions-data\/?/, '');

      if (relativePath === 'manifest.json') {
        const manifest = fs.readFileSync(
          path.join(generatedDir, 'manifest.json'),
          'utf8',
        );
        response.setHeader('Content-Type', 'application/json');
        response.end(manifest);
        return undefined;
      }

      if (
        relativePath === 'ratings.bin' ||
        relativePath === 'sorted-ids.bin' ||
        relativePath === 'sorted-ratings.bin'
      ) {
        const buffer = fs.readFileSync(path.join(generatedDir, relativePath));
        response.setHeader('Content-Type', 'application/octet-stream');
        response.end(buffer);
        return undefined;
      }

      if (relativePath.startsWith('position?')) {
        const fileIndex = Number(url.searchParams.get('fileIndex'));
        const lineIndex = Number(url.searchParams.get('lineIndex'));
        const manifest = JSON.parse(
          fs.readFileSync(path.join(generatedDir, 'manifest.json'), 'utf8'),
        );
        const offsets = new Uint32Array(
          fs.readFileSync(
            path.join(generatedDir, 'offsets', `${fileIndex}.bin`),
          ).buffer,
        );
        const filePath = path.join(positionsDir, manifest.files[fileIndex]);
        const fileDescriptor = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(65536);

        try {
          const bytesRead = fs.readSync(
            fileDescriptor,
            buffer,
            0,
            buffer.length,
            offsets[lineIndex],
          );
          response.setHeader('Content-Type', 'application/json');
          response.end(buffer.toString('utf8', 0, bytesRead).trim());
        } finally {
          fs.closeSync(fileDescriptor);
        }

        return undefined;
      }

      response.statusCode = 404;
      response.end('Not found');
      return undefined;
    } catch (error) {
      response.statusCode = 500;
      response.end(String(error));
      return undefined;
    }
  };
};

module.exports = config;
