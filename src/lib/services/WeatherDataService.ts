import type { WeatherRankingItem, LocationInfo } from '../types';

export class WeatherDataService {
  private openWeatherApiKey: string;
  private googleMapsApiKey: string;

  constructor(openWeatherApiKey: string, googleMapsApiKey: string) {
    this.openWeatherApiKey = openWeatherApiKey;
    this.googleMapsApiKey = googleMapsApiKey;
  }

  parseWeatherData(html: string): WeatherRankingItem[] {
    const patterns = [
      /(\d+)\.\[([^\]]+)\]\[([^\]]+)\]\s*(\d+\.\d+)℃/g,
      /(\d+)\..*?\[([^\]]+)\].*?\[([^\]]+)\].*?(\d+\.\d+)℃/g,
      />(\d+)\.<.*?class="pref">([^<]+)<.*?class="point">([^<]+)<.*?(\d+\.\d+)℃/g,
      /(\d+)\.\s*([^0-9]+?)(\d+\.\d+)℃/g
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const regex = patterns[i];
      regex.lastIndex = 0;
      let tempRankings = [];
      let match;
      
      while ((match = regex.exec(html)) !== null && tempRankings.length < 20) {
        try {
          const [fullMatch, rank, regionOrText, cityOrEmpty, temp] = match;
          
          let region, city;
          if (i === 2) {
            region = (regionOrText || "").trim();
            city = (cityOrEmpty || "").trim();
          } else if (i === 3) {
            const text = regionOrText.trim();
            const parts = text.split(/[\[\]]+/).filter(s => s.trim());
            region = parts[0] || "不明";
            city = parts[1] || "不明";
          } else {
            region = (regionOrText || "").trim();
            city = (cityOrEmpty || "").trim();
          }
          
          const tempValue = parseFloat(temp);
          const rankValue = parseInt(rank);
          
          if (!isNaN(tempValue) && !isNaN(rankValue)) {
            tempRankings.push({ 
              rank: rankValue, 
              region: region || "不明", 
              city: city || "不明", 
              temp: tempValue 
            });
          }
        } catch (parseError) {
          // Ignore parse errors
        }
      }
      
      if (tempRankings.length > 0) {
        return tempRankings;
      }
    }
    
    return [];
  }

  parseUpdateTime(html: string): string {
    const timeRegex = /<time[^>]*class="date-time"[^>]*>([^<]+)<\/time>/i;
    const match = html.match(timeRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    const datetimeRegex = /<time[^>]*datetime="([^"]+)"[^>]*class="date-time"[^>]*>([^<]+)<\/time>/i;
    const datetimeMatch = html.match(datetimeRegex);
    
    if (datetimeMatch && datetimeMatch[2]) {
      return datetimeMatch[2].trim();
    }
    
    return '';
  }

  async getCachedLocationInfo(city: string, region: string): Promise<LocationInfo | null> {
    try {
      const key = `${city}_${region}`.replace(/\s+/g, '_');
      const response = await fetch(`/api/cache/${key}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.info;
    } catch (error) {
      console.error('キャッシュ取得エラー:', error);
      return null;
    }
  }

  async setCachedLocationInfo(city: string, region: string, info: LocationInfo): Promise<void> {
    try {
      const key = `${city}_${region}`.replace(/\s+/g, '_');
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

  async getCoordinates(city: string, region: string): Promise<{lat: number, lng: number} | null> {
    if (!this.googleMapsApiKey) {
      console.error('Google Maps API key not configured');
      return null;
    }
    
    try {
      const query = encodeURIComponent(`${city}, ${region}, Japan`);
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${this.googleMapsApiKey}`;
      
      console.log('Geocoding URL:', geocodingUrl);
      
      const response = await fetch(geocodingUrl);
      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Geocoding Response:', data);
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log(`✅ 座標取得成功 ${city}: lat=${location.lat}, lng=${location.lng}`);
        return {
          lat: location.lat,
          lng: location.lng
        };
      } else {
        console.error('Geocoding failed:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('座標取得エラー:', error);
      return null;
    }
  }

  async fetchLocationWeatherData(city: string, region: string): Promise<{temp: number, humidity: number} | null> {
    if (!this.openWeatherApiKey) {
      console.error('OpenWeatherMap API key not configured');
      return null;
    }
    
    try {
      console.log(`=== ${city} (${region})の天気情報を取得中 ===`);
      
      // 1. 座標を取得
      const coordinates = await this.getCoordinates(city, region);
      if (!coordinates) {
        console.error('座標の取得に失敗しました');
        return null;
      }

      // 2. OpenWeatherMap APIから天気情報を取得（座標ベース）
      console.log('OpenWeatherMap APIで天気情報を取得中...');
      
      const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${this.openWeatherApiKey}&units=metric&lang=ja`;
      console.log('OpenWeather URL:', openWeatherUrl);
      
      const response = await fetch(openWeatherUrl);
      console.log('OpenWeather Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenWeather API Error Response:', errorText);
        throw new Error(`OpenWeather API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('OpenWeather Data:', data);
      
      const result = {
        temp: Math.round(data.main.temp * 10) / 10, // 小数点1位まで
        humidity: data.main.humidity
      };
      
      console.log(`✅ ${city}の天気データ取得成功:`, result);
      return result;
      
    } catch (error) {
      console.error(`${city}の天気データ取得エラー:`, error);
      return null;
    }
  }

  async fetchCityWeatherData(): Promise<Record<string, {temp: number, humidity: number}>> {
    if (!this.openWeatherApiKey) {
      console.log('OpenWeatherMap API key not configured');
      return {};
    }

    const cities = [
      { name: '東京', query: 'Tokyo,JP' },
      { name: '大阪', query: 'Osaka,JP' },
      { name: '福岡', query: 'Fukuoka,JP' }
    ];

    const cityWeatherData: Record<string, {temp: number, humidity: number}> = {};

    try {
      for (const city of cities) {
        try {
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.query}&appid=${this.openWeatherApiKey}&units=metric&lang=ja`);
          if (response.ok) {
            const data = await response.json();
            cityWeatherData[city.name] = {
              temp: Math.round(data.main.temp),
              humidity: data.main.humidity
            };
            console.log(`✅ ${city.name}の天気データ取得成功:`, cityWeatherData[city.name]);
          }
        } catch (error) {
          console.error(`${city.name}の天気データ取得エラー:`, error);
        }
      }
      
      return cityWeatherData;
    } catch (error) {
      console.error('都市天気データ取得エラー:', error);
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
