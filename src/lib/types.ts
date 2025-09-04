// 天気アプリケーション用の型定義

export interface LocationInfo {
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  url: string;
  foundVia?: string;
  isGenerated?: boolean; // Geminiで生成されたかどうか
}

export interface WeatherRankingItem {
  rank: number;
  region: string;
  city: string;
  temp: number;
  humidity?: number; // APIから取得した湿度データ
}
