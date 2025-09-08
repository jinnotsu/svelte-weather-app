/**
 * 気象庁アメダスデータサービス
 * 気象庁のJSON APIからアメダス観測データを取得し、ランキングを作成する
 */

export interface AmedasStation {
  id: string;
  type: string;
  lat: number;
  lon: number;
  alt: number;
  kjName: string;
  knName: string;
  enName: string;
}

export interface AmedasObservation {
  stationId: string;
  stationName: string;
  temp?: number;
  humidity?: number;
  pressure?: number;
  wind?: number;
  precipitation?: number;
  lat: number;
  lon: number;
}

export interface TemperatureRanking {
  rank: number;
  stationName: string;
  temperature: number;
  lat: number;
  lon: number;
}

export class AmedasService {
  private stationsCache: Map<string, AmedasStation> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24時間

  /**
   * 観測所一覧を取得
   */
  async getStations(): Promise<Map<string, AmedasStation>> {
    const now = Date.now();
    
    // キャッシュが有効な場合は返す
    if (this.stationsCache && now < this.cacheExpiry) {
      return this.stationsCache;
    }

    try {
      const response = await fetch('https://www.jma.go.jp/bosai/amedas/const/amedastable.json');
      if (!response.ok) {
        throw new Error(`観測所データの取得に失敗: ${response.status}`);
      }

      const data = await response.json();
      const stations = new Map<string, AmedasStation>();

      for (const [id, station] of Object.entries(data)) {
        const stationData = station as any;
        
        // 緯度経度を度分から十進法に変換
        const lat = stationData.lat[0] + stationData.lat[1] / 60;
        const lon = stationData.lon[0] + stationData.lon[1] / 60;

        stations.set(id, {
          id,
          type: stationData.type,
          lat,
          lon,
          alt: stationData.alt,
          kjName: stationData.kjName,
          knName: stationData.knName,
          enName: stationData.enName
        });
      }

      // キャッシュを更新
      this.stationsCache = stations;
      this.cacheExpiry = now + this.CACHE_DURATION;

      return stations;
    } catch (error) {
      console.error('観測所一覧の取得エラー:', error);
      throw new Error('観測所データの取得に失敗しました');
    }
  }

  /**
   * 最新の観測時刻を取得
   */
  async getLatestTime(): Promise<string> {
    try {
      const response = await fetch('https://www.jma.go.jp/bosai/amedas/data/latest_time.txt');
      if (!response.ok) {
        throw new Error(`最新観測時刻の取得に失敗: ${response.status}`);
      }
      
      const timeText = await response.text();
      return timeText.trim();
    } catch (error) {
      console.error('最新観測時刻の取得エラー:', error);
      throw new Error('最新観測時刻の取得に失敗しました');
    }
  }

  /**
   * 最新のアメダス観測データを取得
   */
  async getLatestObservations(): Promise<AmedasObservation[]> {
    try {
      const [latestTime, stations] = await Promise.all([
        this.getLatestTime(),
        this.getStations()
      ]);

      // ISO形式の時刻をYYYYmmddHHMM形式に変換
      const date = new Date(latestTime);
      const formattedTime = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0') +
        date.getHours().toString().padStart(2, '0') +
        date.getMinutes().toString().padStart(2, '0');

      const url = `https://www.jma.go.jp/bosai/amedas/data/map/${formattedTime}00.json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`観測データの取得に失敗: ${response.status}`);
      }

      const data = await response.json();
      const observations: AmedasObservation[] = [];

      for (const [stationId, observation] of Object.entries(data)) {
        const station = stations.get(stationId);
        if (!station) continue;

        const obs = observation as any;
        const amedasObs: AmedasObservation = {
          stationId,
          stationName: station.kjName,
          lat: station.lat,
          lon: station.lon
        };

        // 各観測値を抽出（値と品質フラグのペアから値のみ取得）
        if (obs.temp && Array.isArray(obs.temp) && obs.temp[0] !== null) {
          amedasObs.temp = obs.temp[0];
        }
        if (obs.humidity && Array.isArray(obs.humidity) && obs.humidity[0] !== null) {
          amedasObs.humidity = obs.humidity[0];
        }
        if (obs.pressure && Array.isArray(obs.pressure) && obs.pressure[0] !== null) {
          amedasObs.pressure = obs.pressure[0];
        }
        if (obs.wind && Array.isArray(obs.wind) && obs.wind[0] !== null) {
          amedasObs.wind = obs.wind[0];
        }
        if (obs.precipitation1h && Array.isArray(obs.precipitation1h) && obs.precipitation1h[0] !== null) {
          amedasObs.precipitation = obs.precipitation1h[0];
        }

        observations.push(amedasObs);
      }

      return observations;
    } catch (error) {
      console.error('観測データの取得エラー:', error);
      throw new Error('観測データの取得に失敗しました');
    }
  }

  /**
   * 気温ランキング（ワースト）を作成
   * @param limit 取得する件数（デフォルト: 10）
   * @param type 'hottest' | 'coolest' ランキングの種類
   */
  async getTemperatureRanking(limit: number = 10, type: 'hottest' | 'coolest' = 'hottest'): Promise<TemperatureRanking[]> {
    try {
      const observations = await this.getLatestObservations();
      
    // 気温データがある観測所のみフィルタリング（富士山除外）
    const validObservations = observations.filter(obs => 
      obs.temp !== undefined && obs.temp !== null && obs.stationName !== '富士山'
    );      if (validObservations.length === 0) {
        throw new Error('有効な気温データが見つかりませんでした');
      }

      // 気温でソート
      const sorted = validObservations.sort((a, b) => {
        const tempA = a.temp!;
        const tempB = b.temp!;
        return type === 'hottest' ? tempB - tempA : tempA - tempB;
      });

      // 都道府県名を推定（簡易版）
      const ranking: TemperatureRanking[] = sorted.slice(0, limit).map((obs, index) => ({
        rank: index + 1,
        stationName: obs.stationName,
        temperature: obs.temp!,
        lat: obs.lat,
        lon: obs.lon
      }));

      return ranking;
    } catch (error) {
      console.error('気温ランキングの作成エラー:', error);
      throw new Error('気温ランキングの作成に失敗しました');
    }
  }


}

// シングルトンインスタンス
export const amedasService = new AmedasService();
