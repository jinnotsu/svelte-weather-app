import { GoogleGenAI } from '@google/genai';
import type { LocationInfo } from '../types';
import { WeatherDataService } from './WeatherDataService';

export class AIDescriptionService {
  private ai: GoogleGenAI | null = null;
  private weatherDataService: WeatherDataService;

  constructor(googleAiApiKey: string, weatherDataService: WeatherDataService) {
    this.weatherDataService = weatherDataService;
    
    if (googleAiApiKey) {
      this.ai = new GoogleGenAI({ apiKey: googleAiApiKey });
    } else {
      console.warn('Google AI API key is not configured');
    }
  }

  async getLocationDescription(city: string, region: string): Promise<string> {
    // まずキャッシュをチェック
    const cachedInfo = await this.weatherDataService.getCachedLocationInfo(city, region);
    if (cachedInfo && cachedInfo.extract) {
      return cachedInfo.extract;
    }
    
    // キャッシュがない場合はGemini APIで生成を待つ
    if (this.ai) {
      await this.generateLocationDescription(city, region);
      // 生成後、再度キャッシュをチェック
      const newCachedInfo = await this.weatherDataService.getCachedLocationInfo(city, region);
      if (newCachedInfo && newCachedInfo.extract) {
        return newCachedInfo.extract;
      }
    }
    
    // APIが利用できない場合のフォールバック
    return `${city}（${region}）の詳細情報を取得中です...`;
  }

  private async generateLocationDescription(city: string, region: string): Promise<string | null> {
    try {
      const prompt = `以下の日本の地点について、魅力的な紹介文を書いてください。**紹介文のみ出力すること。**：

地点: ${city}
地域: ${region}

簡潔な紹介文（50文字以内）
`;

      if (!this.ai) {
        console.log('AIクライアントが初期化されていません');
        return null;
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const generatedText = response.text;
      
      if (generatedText) {
        const title = region && region !== 'undefined' && region.trim() !== '' ? `${city} (${region})` : city;
        const searchQuery = region && region !== 'undefined' && region.trim() !== '' ? `${city} ${region} 日本` : `${city} 日本`;
        const newInfo: LocationInfo = {
          title: title,
          extract: generatedText,
          url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
          isGenerated: true
        };
        
        // キャッシュに保存
        await this.weatherDataService.setCachedLocationInfo(city, newInfo);
        console.log(`✅ ${city}の説明文を生成・キャッシュ: ${generatedText}`);
        return generatedText;
      }
    } catch (error) {
      console.error(`説明文生成エラー (${city}):`, error);
    }
    return null;
  }
}
