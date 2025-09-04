import { json } from '@sveltejs/kit';
import { put, list, del } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const cacheFilePath = path.resolve('src/lib/cache.json');

// 開発環境でのローカルキャッシュファイル管理
function loadLocalCache(): Record<string, any> {
  try {
    if (!fs.existsSync(cacheFilePath)) {
      fs.writeFileSync(cacheFilePath, '{}');
      return {};
    }
    const data = fs.readFileSync(cacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('ローカルキャッシュ読み込みエラー:', error);
    return {};
  }
}

function saveLocalCache(cache: Record<string, any>): void {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('ローカルキャッシュ保存エラー:', error);
  }
}

// Vercel Blobでのキャッシュ管理
async function loadBlobCache(): Promise<Record<string, any>> {
  try {
    // キャッシュデータを格納するBlob（cache.json）を取得
    const blobs = await list({
      prefix: 'cache/'
      // limitを指定しない（デフォルト1000、必要に応じて全て取得）
    });
    
    const cache: Record<string, any> = {};
    
    // 各キャッシュエントリを読み込み
    for (const blob of blobs.blobs) {
      const pathname = blob.pathname;
      const locationKey = pathname.replace('cache/', '').replace('.json', '');
      
      try {
        const response = await fetch(blob.url);
        const data = await response.json();
        cache[locationKey] = data;
      } catch (error) {
        console.error(`キャッシュエントリ読み込みエラー (${locationKey}):`, error);
      }
    }
    
    return cache;
  } catch (error) {
    console.error('Blobキャッシュ読み込みエラー:', error);
    return {};
  }
}

async function saveToBlobCache(locationKey: string, data: any): Promise<void> {
  try {
    const pathname = `cache/${locationKey}.json`;
    
    await put(pathname, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true
    });
  } catch (error) {
    console.error('Blobキャッシュ保存エラー:', error);
  }
}

async function deleteFromBlobCache(locationKey: string): Promise<void> {
  try {
    const pathname = `cache/${locationKey}.json`;
    const blobs = await list({
      prefix: `cache/${locationKey}`,
      limit: 1
    });
    
    if (blobs.blobs.length > 0) {
      await del(blobs.blobs[0].url);
    }
  } catch (error) {
    console.error('Blobキャッシュ削除エラー:', error);
  }
}

// 環境に応じたキャッシュ操作
function isVercelEnvironment(): boolean {
  return !!(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);
}

async function loadCache(): Promise<Record<string, any>> {
  if (isVercelEnvironment()) {
    return await loadBlobCache();
  } else {
    return loadLocalCache();
  }
}

async function saveToCache(locationKey: string, data: any): Promise<void> {
  if (isVercelEnvironment()) {
    await saveToBlobCache(locationKey, data);
  } else {
    const cache = loadLocalCache();
    cache[locationKey] = data;
    saveLocalCache(cache);
  }
}

export async function GET({ params }) {
  const { locationKey } = params;
  
  try {
    if (isVercelEnvironment()) {
      // Vercel環境：直接Blobから特定のキャッシュエントリを取得
      const blobs = await list({
        prefix: `cache/${locationKey}`,
        limit: 1
      });
      
      if (blobs.blobs.length === 0) {
        return json(null, { status: 404 });
      }
      
      const response = await fetch(blobs.blobs[0].url);
      const data = await response.json();
      return json(data);
    } else {
      // ローカル環境：ファイルシステムから取得
      const cache = loadLocalCache();
      const data = cache[locationKey];
      if (!data) {
        return json(null, { status: 404 });
      }
      return json(data);
    }
  } catch (error) {
    console.error('キャッシュ取得エラー:', error);
    return json(null, { status: 404 });
  }
}

export async function POST({ params, request }) {
  const { locationKey } = params;
  
  try {
    const body = await request.json();
    await saveToCache(locationKey, body);
    return json({ success: true });
  } catch (error) {
    console.error('キャッシュ保存エラー:', error);
    return json({ error: 'Failed to save cache' }, { status: 500 });
  }
}
