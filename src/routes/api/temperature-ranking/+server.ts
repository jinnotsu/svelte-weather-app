import { json } from '@sveltejs/kit';
import { amedasService } from '$lib/services/AmedasService.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url }) => {
  try {
    // クエリパラメータから設定を取得
    const limit = Math.min(Number(url.searchParams.get('limit')) || 10, 50); // 最大50件
    const type = url.searchParams.get('type') === 'coolest' ? 'coolest' : 'hottest';

    // 気温ランキングを取得
    const ranking = await amedasService.getTemperatureRanking(limit, type);

    return json({
      success: true,
      data: ranking,
      timestamp: new Date().toISOString(),
      type,
      count: ranking.length
    });

  } catch (error) {
    console.error('気温ランキングAPI エラー:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
};
