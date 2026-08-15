import { Position, PositionRef, positionRefKey } from '@/positions/types';
import {
  createPositionIndex,
  PositionIndex,
  PositionManifest,
} from '@/utils/positionSelection';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface PositionDataSource {
  getManifest(): Promise<PositionManifest>;
  getBinaryFile(relativePath: string): Promise<ArrayBuffer>;
  getPositionLine(ref: PositionRef): Promise<string>;
}

const POSITION_CACHE_LIMIT = 32;

const dataSources = new Map<string, PositionDataSource>();
const indexes = new Map<string, Promise<PositionIndex>>();
const positions = new Map<string, Promise<Position>>();

function createFetchDataSource(baseUrl: string): PositionDataSource {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  async function request(path: string) {
    const response = await fetch(`${normalizedBaseUrl}/${path}`);

    if (!response.ok) {
      throw new Error(
        `Position data request failed (${response.status}): ${path}`,
      );
    }

    return response;
  }

  return {
    async getManifest() {
      return (await request('manifest.json')).json();
    },
    async getBinaryFile(relativePath: string) {
      const response = await request(relativePath.replace(/^generated\//, ''));

      return response.arrayBuffer();
    },
    async getPositionLine(ref: PositionRef) {
      const response = await request(
        `position?fileIndex=${ref.fileIndex}&lineIndex=${ref.lineIndex}`,
      );

      return response.text();
    },
  };
}

function resolveDataSource(baseUrl: string): PositionDataSource {
  const cached = dataSources.get(baseUrl);

  if (cached) {
    return cached;
  }

  const dataSource = createFetchDataSource(baseUrl);
  dataSources.set(baseUrl, dataSource);

  return dataSource;
}

export function loadPositionIndex(
  customBaseUrl?: string,
): Promise<PositionIndex> {
  const baseUrl = customBaseUrl ?? getPositionDataBaseUrl();
  const cached = indexes.get(baseUrl);

  if (cached) {
    return cached;
  }

  const dataSource = resolveDataSource(baseUrl);
  const pending = (async () => {
    const manifest = await dataSource.getManifest();
    const [ratingsBuffer, sortedIdsBuffer, sortedRatingsBuffer] =
      await Promise.all([
        dataSource.getBinaryFile('generated/ratings.bin'),
        dataSource.getBinaryFile('generated/sorted-ids.bin'),
        dataSource.getBinaryFile('generated/sorted-ratings.bin'),
      ]);

    return createPositionIndex(
      manifest,
      ratingsBuffer,
      sortedIdsBuffer,
      sortedRatingsBuffer,
    );
  })();

  // A failed load must not be cached, otherwise retrying can never recover.
  pending.catch(() => indexes.delete(baseUrl));
  indexes.set(baseUrl, pending);

  return pending;
}

export function loadPositionByRef(
  ref: PositionRef,
  customBaseUrl?: string,
): Promise<Position> {
  const baseUrl = customBaseUrl ?? getPositionDataBaseUrl();
  const cacheKey = `${baseUrl}#${positionRefKey(ref)}`;
  const cached = positions.get(cacheKey);

  if (cached) {
    return cached;
  }

  const pending = resolveDataSource(baseUrl)
    .getPositionLine(ref)
    .then((line) => JSON.parse(line) as Position);

  pending.catch(() => positions.delete(cacheKey));
  positions.set(cacheKey, pending);

  if (positions.size > POSITION_CACHE_LIMIT) {
    const oldestKey = positions.keys().next().value;

    if (oldestKey !== undefined) {
      positions.delete(oldestKey);
    }
  }

  return pending;
}

/** Warms the cache so the next position is already there when it is needed. */
export function prefetchPosition(ref: PositionRef, customBaseUrl?: string) {
  void loadPositionByRef(ref, customBaseUrl).catch(() => undefined);
}

export function resetPositionServiceCache() {
  dataSources.clear();
  indexes.clear();
  positions.clear();
}

export function getPositionDataBaseUrl(): string {
  if (Platform.OS === 'web') {
    return '/positions-data';
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    return `http://${hostUri.split('?')[0]}/positions-data`;
  }

  return 'http://localhost:8081/positions-data';
}
