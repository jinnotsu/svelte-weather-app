import type { WeatherRankingItem, LocationInfo } from '../types';
import { amedasService } from './AmedasService';

export class WeatherDataService {

  /**
   * 気温と湿度データを標準化するヘルパー関数
   */
  private formatWeatherData(item: any): {temp: number, humidity?: number} {
    return {
      temp: Math.round(item.temperature * 10) / 10,
      humidity: item.humidity ? Math.round(item.humidity) : undefined
    };
  }

  /**
   * アメダスサービスを使用して気温ランキングと特定都市データを同時に取得
   */
  async fetchWeatherRanking(limit: number = 10): Promise<{
    data: WeatherRankingItem[];
    timestamp: string;
    cityData: Record<string, {temp: number, humidity?: number}>;
  }> {
    try {
      const type = 'coolest'; // 常に最低気温ランキングを取得
      console.log(`=== アメダス気温ランキングを取得中 (${type}, limit: ${limit}) ===`);
      
      // アメダスサービスから気温ランキングを取得（多めに取得して特定都市も含める）
      const ranking = await amedasService.getTemperatureRanking(Math.max(limit, 50), type);
      
      // WeatherRankingItem形式に変換（指定された件数のみ）
      const weatherData: WeatherRankingItem[] = ranking.slice(0, limit).map((item, index) => {
        const formattedData = this.formatWeatherData(item);
        return {
          rank: index + 1,
          city: item.stationName,
          temp: formattedData.temp,
          humidity: formattedData.humidity
        };
      });

      // 特定都市のデータを抽出
      const targetCities = ['東京', '大阪', '福岡'];
      const cityData: Record<string, {temp: number, humidity?: number}> = {};

      for (const city of targetCities) {
        const stationData = ranking.find(item => item.stationName === city);
        if (stationData) {
          cityData[city] = this.formatWeatherData(stationData);
          console.log(`✅ ${city}の気温データ取得成功: ${cityData[city].temp}℃, 湿度: ${cityData[city].humidity || 'N/A'}%`);
        } else {
          // データが見つからない場合はデフォルト値を設定
          cityData[city] = { temp: 0 };
          console.log(`❌ ${city}のデータが見つかりませんでした`);
        }
      }

      const timestamp = new Date().toISOString();
      
      console.log(`✅ アメダス気温ランキング取得成功: ${weatherData.length}件, 特定都市データ: ${Object.keys(cityData).length}件`);
      
      return {
        data: weatherData,
        timestamp,
        cityData
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
}
