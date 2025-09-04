import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const cacheFilePath = path.resolve('src/lib/cache.json');

// キャッシュファイルを読み込む関数
function loadCache(): Record<string, any> {
  try {
    if (!fs.existsSync(cacheFilePath)) {
      fs.writeFileSync(cacheFilePath, '{}');
      return {};
    }
    const data = fs.readFileSync(cacheFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('キャッシュ読み込みエラー:', error);
    return {};
  }
}

// キャッシュファイルを保存する関数
function saveCache(cache: Record<string, any>): void {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('キャッシュ保存エラー:', error);
  }
}

export async function GET({ params }) {
  const { locationKey } = params;
  const cache = loadCache();
  const data = cache[locationKey];
  if (!data) return json(null, { status: 404 });
  return json(data);
}

export async function POST({ params, request }) {
  const { locationKey } = params;
  try {
    const body = await request.json();
    const cache = loadCache();
    cache[locationKey] = body;
    saveCache(cache);
    return json({ success: true });
  } catch (error) {
    console.error('キャッシュ保存エラー:', error);
    return json({ error: 'Failed to save cache' }, { status: 500 });
  }
}
