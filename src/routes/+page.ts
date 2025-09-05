import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, depends }) => {
  depends('app:weather-data');
  
  // 重要: ここでは基本的なページデータのみをロード
  // 重いコンポーネントは動的インポートで遅延読み込み
  
  return {
    // ページの基本情報のみ
    meta: {
      title: 'ひんやりさがし - 涼しい避暑地ランキング',
      description: '日本全国の涼しい場所をリアルタイムでランキング表示'
    }
  };
};

export const prerender = false;
export const ssr = true;
export const csr = true;
