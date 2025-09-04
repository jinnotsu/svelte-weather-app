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

簡潔な紹介文（200文字以内）

回答は日本語で、自然で魅力的な文章にしてください。観光地として紹介するようなトーンで書いてください。避暑地としての魅力があれば含めてください。

例:
「美しい自然に囲まれた○○は、○○地方の代表的な観光地です。○○の特徴として○○が挙げられ、○○の○○として知られています。」`;

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
        const newInfo: LocationInfo = {
          title: `${city} (${region})`,
          extract: generatedText,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${city} ${region} 日本`)}`,
          foundVia: 'Google Gemini AIで生成',
          isGenerated: true
        };
        
        // キャッシュに保存
        await this.weatherDataService.setCachedLocationInfo(city, region, newInfo);
        console.log(`✅ ${city}の説明文を生成・キャッシュ: ${generatedText}`);
        return generatedText;
      }
    } catch (error) {
      console.error(`説明文生成エラー (${city}):`, error);
    }
    return null;
  }
}
