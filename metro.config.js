const path = require('node:path');
const fs = require('node:fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const positionsDir = path.join(projectRoot, 'positions');
const generatedDir = path.join(positionsDir, 'generated');

const BINARY_FILES = new Set([
  'ratings.bin',
  'sorted-ids.bin',
  'sorted-ratings.bin',
]);

/**
 * Dev-only bridge to the position dataset: it is far too large to bundle, so
 * Metro serves single lines out of it by byte offset.
 */
let manifestCache = null;
const offsetsCache = new Map();

function readManifest() {
  if (!manifestCache) {
    manifestCache = JSON.parse(
      fs.readFileSync(path.join(generatedDir, 'manifest.json'), 'utf8'),
    );
  }

  return manifestCache;
}

/** Uint32 (byteOffset, byteLength) pairs, one per line. */
function readOffsets(fileIndex) {
  const cached = offsetsCache.get(fileIndex);

  if (cached) {
    return cached;
  }

  const buffer = fs.readFileSync(
    path.join(generatedDir, 'offsets', `${fileIndex}.bin`),
  );
  // Buffers can be views into a shared pool, so the byte range matters.
  const offsets = new Uint32Array(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
  );

  offsetsCache.set(fileIndex, offsets);

  return offsets;
}

function readPositionLine(fileIndex, lineIndex) {
  const manifest = readManifest();

  if (
    !Number.isInteger(fileIndex) ||
    fileIndex < 0 ||
    fileIndex >= manifest.files.length ||
    !Number.isInteger(lineIndex) ||
    lineIndex < 0 ||
    lineIndex >= manifest.counts[fileIndex]
  ) {
    return null;
  }

  const offsets = readOffsets(fileIndex);
  const byteOffset = offsets[lineIndex * 2];
  const byteLength = offsets[lineIndex * 2 + 1];
  const buffer = Buffer.alloc(byteLength);
  const fileDescriptor = fs.openSync(
    path.join(positionsDir, manifest.files[fileIndex]),
    'r',
  );

  try {
    const bytesRead = fs.readSync(
      fileDescriptor,
      buffer,
      0,
      byteLength,
      byteOffset,
    );

    return buffer.toString('utf8', 0, bytesRead);
  } finally {
    fs.closeSync(fileDescriptor);
  }
}

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
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(readManifest()));
        return undefined;
      }

      if (BINARY_FILES.has(relativePath)) {
        response.setHeader('Content-Type', 'application/octet-stream');
        response.end(fs.readFileSync(path.join(generatedDir, relativePath)));
        return undefined;
      }

      if (relativePath === 'position') {
        const line = readPositionLine(
          Number(url.searchParams.get('fileIndex')),
          Number(url.searchParams.get('lineIndex')),
        );

        if (line === null) {
          response.statusCode = 400;
          response.end('Invalid position reference');
          return undefined;
        }

        response.setHeader('Content-Type', 'application/json');
        response.end(line);
        return undefined;
      }

      response.statusCode = 404;
      response.end('Not found');
      return undefined;
    } catch (error) {
      console.error('[positions-data]', error);
      response.statusCode = 500;
      response.end(String(error));
      return undefined;
    }
  };
};

module.exports = config;
