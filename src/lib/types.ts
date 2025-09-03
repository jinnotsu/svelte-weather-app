// 天気アプリケーション用の型定義

export interface WikipediaInfo {
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

export interface WeatherData {
  currentTemperature: number;
  humidity: number;
  weatherCondition: {
    description: string;
    iconUrl: string;
    type: string;
  };
  isDaytime: boolean;
  location: {
    city: string;
    region: string;
    latitude: number;
    longitude: number;
  };
}

export interface WeatherRankingItem {
  rank: number;
  region: string;
  city: string;
  temp: number;
}

export interface LocationClickEvent {
  region: string;
  city: string;
}
