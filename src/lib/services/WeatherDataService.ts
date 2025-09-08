import type { WeatherRankingItem, LocationInfo } from '../types';
import { amedasService } from './AmedasService';

export class WeatherDataService {
  constructor() {
    // アメダスデータのみを使用するため、APIキーは不要
  }

  /**
   * アメダスサービスを使用して気温ランキングを取得
   */
  async fetchWeatherRanking(limit: number = 10, type: 'hottest' | 'coolest' = 'coolest'): Promise<{
    data: WeatherRankingItem[];
    timestamp: string;
  }> {
    try {
      console.log(`=== アメダス気温ランキングを取得中 (${type}, limit: ${limit}) ===`);
      
      // アメダスサービスから気温ランキングを取得
      const ranking = await amedasService.getTemperatureRanking(limit, type);
      
      // WeatherRankingItem形式に変換
      const weatherData: WeatherRankingItem[] = ranking.map((item, index) => ({
        rank: index + 1,
        city: item.stationName,
        temp: Math.round(item.temperature * 10) / 10, // 小数点第1位まで
        humidity: item.humidity ? Math.round(item.humidity) : undefined // 湿度も含める
      }));

      const timestamp = new Date().toISOString();
      
      console.log(`✅ アメダス気温ランキング取得成功: ${weatherData.length}件`);
      
      return {
        data: weatherData,
        timestamp
      };
      
    } catch (error) {
      console.error('アメダス気温ランキング取得エラー:', error);
      throw new Error(error instanceof Error ? error.message : 'アメダスデータの取得に失敗しました');
    }
  }

  async getCachedLocationInfo(city: string, region: string): Promise<LocationInfo | null> {
    try {
      const key = region && region !== 'undefined' && region.trim() !== '' ? `${city}_${region}`.replace(/\s+/g, '_') : city.replace(/\s+/g, '_');
      const response = await fetch(`/api/cache/${key}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.info;
    } catch (error) {
      console.error('キャッシュ取得エラー:', error);
      return null;
    }
  }

  async setCachedLocationInfo(city: string, info: LocationInfo): Promise<void> {
    try {
      const key = city.replace(/\s+/g, '_');
      const cacheData = { info, timestamp: Date.now() };
      await fetch(`/api/cache/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cacheData)
      });
    } catch (error) {
      console.error('キャッシュ保存エラー:', error);
    }
  }

  /**
   * アメダスAPIから都市別の気温データを取得
   */
  async fetchCityWeatherData(): Promise<Record<string, {temp: number, humidity?: number}>> {
    try {
      const response = await fetch('/api/temperature-ranking?limit=50&type=hottest');
      if (!response.ok) {
        console.error('気温データの取得に失敗しました');
        return {};
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        console.error('無効な気温データです');
        return {};
      }

      // 特定の都市データを抽出
      const targetCities = ['東京', '大阪', '福岡'];
      const cityWeatherData: Record<string, {temp: number, humidity?: number}> = {};

      for (const city of targetCities) {
        const stationData = result.data.find((item: any) => item.stationName === city);
        if (stationData) {
          cityWeatherData[city] = { 
            temp: Math.round(stationData.temperature * 10) / 10,
            humidity: stationData.humidity ? Math.round(stationData.humidity) : undefined
          };
          console.log(`✅ ${city}の気温データ取得成功: ${cityWeatherData[city].temp}℃, 湿度: ${cityWeatherData[city].humidity || 'N/A'}%`);
        } else {
          // データが見つからない場合はデフォルト値を設定
          cityWeatherData[city] = { temp: 0 };
          console.log(`❌ ${city}のデータが見つかりませんでした`);
        }
      }

      return cityWeatherData;
    } catch (error) {
      console.error('都市気温データの取得エラー:', error);
      return {};
    }
  }

  getMockWeatherData(): WeatherRankingItem[] {
    return [
      { rank: 1, region: "福島県", city: "鷲倉", temp: 18.2 },
      { rank: 2, region: "栃木県", city: "奥日光", temp: 18.6 },
      { rank: 3, region: "道東", city: "知方学", temp: 19.0 },
      { rank: 4, region: "道東", city: "羅臼", temp: 19.1 },
      { rank: 5, region: "道東", city: "紋別", temp: 19.7 },
      { rank: 6, region: "群馬県", city: "草津", temp: 19.8 },
      { rank: 7, region: "青森県", city: "酸ケ湯", temp: 20.3 },
      { rank: 8, region: "道南", city: "えりも岬", temp: 20.6 }
    ];
  }
}
