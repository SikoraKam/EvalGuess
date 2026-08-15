import { Position, PositionRef } from '@/positions/types';
import {
  createPositionIndex,
  PositionIndex,
} from '@/utils/positionSelection';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface PositionDataSource {
  getManifest(): Promise<{
    files: string[];
    counts: number[];
    totalPositions: number;
  }>;
  getBinaryFile(relativePath: string): Promise<ArrayBuffer>;
  getPositionLine(ref: PositionRef): Promise<string>;
}

let cachedIndex: PositionIndex | null = null;
let cachedDataSource: PositionDataSource | null = null;

function createNodeDataSource(baseDir: string): PositionDataSource {
  const fsModule = 'node:fs/promises';
  const pathModule = 'node:path';
  const req = typeof module !== 'undefined' ? module.require : undefined;

  if (!req) {
    throw new Error('Node.js environment is required for createNodeDataSource');
  }

  const fs: any = req(fsModule);
  const path: any = req(pathModule);

  return {
    async getManifest() {
      const manifestPath = path.join(baseDir, 'generated/manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as {
        files: string[];
        counts: number[];
        totalPositions: number;
      };

      return manifest;
    },
    async getBinaryFile(relativePath: string) {
      const filePath = path.join(baseDir, relativePath);
      const buffer = await fs.readFile(filePath);

      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    },
    async getPositionLine(ref: PositionRef) {
      const manifest = JSON.parse(
        await fs.readFile(path.join(baseDir, 'generated/manifest.json'), 'utf8'),
      ) as { files: string[] };
      const offsetsPath = path.join(
        baseDir,
        `generated/offsets/${ref.fileIndex}.bin`,
      );
      const offsetsBuffer = await fs.readFile(offsetsPath);
      const offsets = new Uint32Array(
        offsetsBuffer.buffer.slice(
          offsetsBuffer.byteOffset,
          offsetsBuffer.byteOffset + offsetsBuffer.byteLength,
        ),
      );
      const filePath = path.join(baseDir, manifest.files[ref.fileIndex]);
      const handle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(65536);

      try {
        const { bytesRead } = await handle.read(
          buffer,
          0,
          buffer.length,
          offsets[ref.lineIndex],
        );

        return buffer.toString('utf8', 0, bytesRead).trim();
      } finally {
        await handle.close();
      }
    },
  };
}

function createFetchDataSource(baseUrl: string): PositionDataSource {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    async getManifest() {
      const response = await fetch(`${normalizedBaseUrl}/manifest.json`);

      if (!response.ok) {
        throw new Error('Failed to load position manifest.');
      }

      return response.json();
    },
    async getBinaryFile(relativePath: string) {
      const response = await fetch(
        `${normalizedBaseUrl}/${relativePath.replace(/^generated\//, '')}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to load ${relativePath}.`);
      }

      return response.arrayBuffer();
    },
    async getPositionLine(ref: PositionRef) {
      const response = await fetch(
        `${normalizedBaseUrl}/position?fileIndex=${ref.fileIndex}&lineIndex=${ref.lineIndex}`,
      );

      if (!response.ok) {
        throw new Error('Failed to load position line.');
      }

      return response.text();
    },
  };
}

function resolveDataSource(customBaseUrl?: string): PositionDataSource {
  if (cachedDataSource) {
    return cachedDataSource;
  }

  if (customBaseUrl) {
    cachedDataSource = createFetchDataSource(customBaseUrl);
    return cachedDataSource;
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    const pathModule = 'node:path';
    const req = typeof module !== 'undefined' ? module.require : undefined;
    if (req) {
      const path: any = req(pathModule);
      cachedDataSource = createNodeDataSource(
        path.join(process.cwd(), 'positions'),
      );
      return cachedDataSource;
    }
  }

  cachedDataSource = createFetchDataSource(getPositionDataBaseUrl());
  return cachedDataSource;
}

export async function loadPositionIndex(
  customBaseUrl?: string,
): Promise<PositionIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  const dataSource = resolveDataSource(customBaseUrl);
  const manifest = await dataSource.getManifest();
  const [ratingsBuffer, sortedIdsBuffer, sortedRatingsBuffer] =
    await Promise.all([
      dataSource.getBinaryFile('generated/ratings.bin'),
      dataSource.getBinaryFile('generated/sorted-ids.bin'),
      dataSource.getBinaryFile('generated/sorted-ratings.bin'),
    ]);

  cachedIndex = createPositionIndex(
    manifest,
    ratingsBuffer,
    sortedIdsBuffer,
    sortedRatingsBuffer,
  );

  return cachedIndex;
}

export async function loadPositionByRef(
  ref: PositionRef,
  customBaseUrl?: string,
): Promise<Position> {
  const dataSource = resolveDataSource(customBaseUrl);
  const line = await dataSource.getPositionLine(ref);

  return JSON.parse(line) as Position;
}

export function resetPositionServiceCache() {
  cachedIndex = null;
  cachedDataSource = null;
}

export function getPositionDataBaseUrl(): string {
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node-fs';
  }

  if (Platform.OS === 'web') {
    return '/positions-data';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split('?')[0];
    return `http://${host}/positions-data`;
  }

  return 'http://localhost:8081/positions-data';
}
