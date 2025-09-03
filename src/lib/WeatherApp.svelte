<script lang="ts">
  import { onMount } from 'svelte';
  import { GoogleGenAI } from '@google/genai';
  import WeatherItem from './WeatherItem.svelte';
  import GoogleMapsModal from './GoogleMapsModal.svelte';
  import type { WikipediaInfo, WeatherData, WeatherRankingItem, LocationClickEvent } from './types';
  
  let weatherData: WeatherRankingItem[] = [];
  let isLoading = true;
  let errorMessage = '';
  let statusMessage = '';
  let showMap = false;
  let selectedLocation = '';
  let mapUrl = '';
  let wikipediaInfo: WikipediaInfo | null = null;
  let isLoadingWikipedia = false;
  let wikipediaError = '';
  let currentWeatherData: WeatherData | null = null;
  let isLoadingWeather = false;
  let weatherError = '';
  
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const googleAiApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  // Gemini APIの初期化
  let ai: GoogleGenAI | null = null;
  if (googleAiApiKey) {
    ai = new GoogleGenAI({ apiKey: googleAiApiKey });
  } else {
    errorMessage = 'Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your environment variables.';
  }

  function parseWeatherData(html: string): WeatherRankingItem[] {
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
    
    // Final optimized pattern
    const finalPattern = /<span class="rank">(\d+)\.<\/span>\s*<a[^>]*class="pref">([^<]+)<\/a>\s*<a[^>]*class="point">([^<]+)<\/a><span class="value">(\d+\.\d+)℃<\/span>/g;
    let finalRankings: WeatherRankingItem[] = [];
    let match;
    
    while ((match = finalPattern.exec(html)) !== null && finalRankings.length < 20) {
      try {
        const [fullMatch, rank, region, city, temp] = match;
        
        const tempValue = parseFloat(temp);
        const rankValue = parseInt(rank);
        
        if (!isNaN(tempValue) && !isNaN(rankValue)) {
          finalRankings.push({ 
            rank: rankValue, 
            region: region.trim(), 
            city: city.trim(), 
            temp: tempValue 
          });
        }
      } catch (parseError) {
        // Ignore parse errors
      }
    }
    
    return finalRankings;
  }

  onMount(async () => {
    try {
      statusMessage = '気温データを取得中...';
      
      const response = await fetch('/api/tenki/amedas/ranking/low-temp.html');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      statusMessage = 'データを解析中...';
      
      const rankings = parseWeatherData(html);
      
      if (rankings.length > 0) {
        rankings.sort((a, b) => a.rank - b.rank);
        weatherData = rankings.slice(0, 10);
        statusMessage = `${rankings.length}件のデータを取得しました`;
      } else {
        // モックデータ（テスト用に厚床を含む）
        weatherData = [
          { rank: 1, region: "道東", city: "厚床", temp: 17.4 },
          { rank: 2, region: "青森県", city: "酸ケ湯", temp: 18.0 },
          { rank: 3, region: "道東", city: "納沙布", temp: 18.1 },
          { rank: 4, region: "道東", city: "知方学", temp: 18.5 }
        ];
        statusMessage = 'モックデータを表示中（データ解析に失敗）';
      }
    } catch (error) {
      errorMessage = `エラー: ${error instanceof Error ? error.message : String(error)}`;
      statusMessage = 'データ取得に失敗しました';
    } finally {
      isLoading = false;
    }
  });

  // Gemini APIを使って地点の情報を生成する関数
  async function fetchLocationInfo(city: string, region: string) {
    isLoadingWikipedia = true;
    wikipediaError = '';
    wikipediaInfo = null;
    
    try {
      console.log(`=== Gemini APIで${city} (${region})の情報を生成中 ===`);
      
      const prompt = `以下の日本の地点について、魅力的な紹介文を書いてください。**紹介文のみ出力すること。**：

地点: ${city}
地域: ${region}

簡潔な紹介文（200文字以内）

回答は日本語で、自然で魅力的な文章にしてください。観光地として紹介するようなトーンで書いてください。

例:
「美しい自然に囲まれた○○は、○○地方の代表的な観光地です。○○の特徴として○○が挙げられ、○○の○○として知られています。」`;

      if (!ai) {
        wikipediaError = 'AIクライアントが初期化されていません';
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const generatedText = response.text;
      
      if (!generatedText) {
        wikipediaError = 'AIからの応答が空でした';
        return;
      }
      
      console.log('✅ Gemini API成功:', generatedText);
      
      wikipediaInfo = {
        title: `${city} (${region})`,
        extract: generatedText,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${city} ${region} 日本`)}`,
        foundVia: 'Google Gemini AIで生成',
        isGenerated: true
      };
      
    } catch (error) {
      wikipediaError = `情報生成エラー: ${error instanceof Error ? error.message : String(error)}`;
      console.error('💥 Gemini APIエラー:', error);
    } finally {
      isLoadingWikipedia = false;
      console.log('=== Gemini情報生成終了 ===');
    }
  }

  // 地点から緯度経度を取得する関数
  async function getCoordinates(city: string, region: string): Promise<{lat: number, lng: number} | null> {
    try {
      console.log(`座標取得開始: ${city}, ${region}`);
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${city}, ${region}, Japan`)}&key=${googleMapsApiKey}`;
      console.log('Geocoding URL:', geocodingUrl);
      
      const response = await fetch(geocodingUrl);
      const data = await response.json();
      console.log('Geocoding Response:', data);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log(`座標取得成功: lat=${location.lat}, lng=${location.lng}`);
        return { lat: location.lat, lng: location.lng };
      } else {
        console.log('座標取得失敗:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('座標取得エラー:', error);
      return null;
    }
  }

  // OpenWeatherMap APIから現在の天気を取得する関数
  async function fetchCurrentWeather(city: string, region: string) {
    isLoadingWeather = true;
    weatherError = '';
    currentWeatherData = null;
    
    try {
      console.log(`=== ${city} (${region})の天気情報を取得中 ===`);
      
      // 1. 座標を取得
      const coordinates = await getCoordinates(city, region);
      if (!coordinates) {
        weatherError = '座標の取得に失敗しました';
        console.error('座標取得失敗');
        return;
      }

      // 2. OpenWeatherMap APIから天気情報を取得
      console.log('OpenWeatherMap APIで天気情報を取得中...');
      
      if (!openWeatherApiKey) {
        weatherError = 'OpenWeatherMap API keyが設定されていません';
        console.error('OpenWeatherMap API key not found');
        return;
      }
      
      const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${openWeatherApiKey}&units=metric&lang=ja`;
      console.log('OpenWeather URL:', openWeatherUrl);
      
      const openWeatherResponse = await fetch(openWeatherUrl);
      console.log('OpenWeather Response Status:', openWeatherResponse.status);
      
      if (!openWeatherResponse.ok) {
        const errorText = await openWeatherResponse.text();
        console.error('OpenWeather API Error Response:', errorText);
        throw new Error(`OpenWeather API error: ${openWeatherResponse.status} - ${errorText}`);
      }
      
      const openWeatherData = await openWeatherResponse.json();
      console.log('OpenWeather Data:', openWeatherData);
      
      // OpenWeatherMap APIのレスポンス形式に合わせてWeatherDataオブジェクトを構築
      const iconUrl = openWeatherData.weather?.[0]?.icon 
        ? `https://openweathermap.org/img/wn/${openWeatherData.weather[0].icon}@2x.png` 
        : '';

      currentWeatherData = {
        currentTemperature: openWeatherData.main?.temp || 0,
        humidity: openWeatherData.main?.humidity || 0,
        weatherCondition: {
          description: openWeatherData.weather?.[0]?.description || '不明',
          iconUrl: iconUrl,
          type: openWeatherData.weather?.[0]?.main || 'UNKNOWN'
        },
        isDaytime: true, // OpenWeatherMapではこの情報は別途取得が必要
        location: {
          city: city,
          region: region,
          latitude: coordinates.lat,
          longitude: coordinates.lng
        }
      };
      
      console.log('✅ OpenWeatherMap API成功:', currentWeatherData);
      
    } catch (error) {
      weatherError = `天気情報取得エラー: ${error instanceof Error ? error.message : String(error)}`;
      console.error('💥 OpenWeatherMap API エラー:', error);
    } finally {
      isLoadingWeather = false;
      console.log('=== OpenWeatherMap API天気情報取得終了 ===');
    }
  }

  // 天気タイプから日本語の説明とエモジアイコンを取得
  function getJapaneseWeatherInfo(type: string, description: string) {
    // OpenWeatherMap API用のマッピング
    const openWeatherMap: Record<string, {jp: string, emoji: string}> = {
      'Clear': { jp: '快晴', emoji: '☀️' },
      'Clouds': { jp: '曇り', emoji: '☁️' },
      'Rain': { jp: '雨', emoji: '🌧️' },
      'Drizzle': { jp: '霧雨', emoji: '🌦️' },
      'Thunderstorm': { jp: '雷雨', emoji: '⛈️' },
      'Snow': { jp: '雪', emoji: '❄️' },
      'Mist': { jp: '霧', emoji: '🌫️' },
      'Fog': { jp: '霧', emoji: '🌫️' },
      'Haze': { jp: 'かすみ', emoji: '🌫️' },
      'Dust': { jp: '塵', emoji: '🌫️' },
      'Sand': { jp: '砂嵐', emoji: '🌫️' },
      'Ash': { jp: '火山灰', emoji: '🌫️' },
      'Squall': { jp: 'スコール', emoji: '🌧️' },
      'Tornado': { jp: '竜巻', emoji: '🌪️' }
    };
    
    // OpenWeatherMap APIのマッピングを試行
    if (openWeatherMap[type]) {
      return openWeatherMap[type];
    }
    
    // マッチしない場合はdescriptionを使用
    return { jp: description || '不明', emoji: '🌈' };
  }

  function handleLocationClick(event: CustomEvent<LocationClickEvent>) {
    const { region, city } = event.detail;
    selectedLocation = `${city}, ${region}`;
    
    // 宇宙からの降下感を演出するため、複数のズームレベルでアニメーション
    const baseQuery = encodeURIComponent(`${city}, ${region}, Japan`);
    
    // 最初は宇宙からの視点（ズーム1）
    mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${baseQuery}&maptype=satellite&zoom=1`;
    showMap = true;
    
    // Wikipedia情報と天気情報を並行して取得
    fetchLocationInfo(city, region);
    fetchCurrentWeather(city, region);
    
    // 段階的にズームイン（Google Earth風演出）
    setTimeout(() => {
      mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${baseQuery}&maptype=satellite&zoom=5`;
    }, 500);
    
    setTimeout(() => {
      mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${baseQuery}&maptype=satellite&zoom=10`;
    }, 1000);
    
    setTimeout(() => {
      mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${baseQuery}&maptype=satellite&zoom=15`;
    }, 1500);
  }
  
  function closeMap() {
    showMap = false;
    selectedLocation = '';
    mapUrl = '';
    wikipediaInfo = null;
    wikipediaError = '';
    isLoadingWikipedia = false;
    currentWeatherData = null;
    weatherError = '';
    isLoadingWeather = false;
  }
</script>

<main class="font-sans max-w-4xl mx-auto px-5 py-8 min-h-screen bg-gray-50">
  <h1 class="text-slate-800 text-center mb-8 text-4xl font-bold">🌡️ 日本の最低気温ランキング</h1>
  
  {#if isLoading}
    <div class="text-center py-16 text-xl text-gray-600">
      <p>📡 データを読み込み中...</p>
    </div>
  {:else if errorMessage}
    <div class="bg-red-50 p-4 rounded-lg my-5 border-l-4 border-red-500 text-red-800">
      <p>❌ {errorMessage}</p>
    </div>
  {:else if weatherData.length > 0}
    <div class="bg-white p-6 rounded-xl shadow-md">
      <h2 class="text-slate-700 mb-5 text-2xl font-semibold">📊 最低気温ランキング（トップ10）</h2>
      <div class="flex flex-col gap-3">
        {#each weatherData as item}
          <WeatherItem {item} on:locationClick={handleLocationClick} />
        {/each}
      </div>
    </div>
  {:else}
    <div class="text-center py-16 text-gray-500 text-lg">
      <p>💭 データがありません</p>
    </div>
  {/if}
</main>

<!-- Google Maps モーダル -->
<GoogleMapsModal 
  show={showMap}
  {selectedLocation}
  {mapUrl}
  isLoadingWikipedia={isLoadingWikipedia}
  {wikipediaInfo}
  {wikipediaError}
  isLoadingWeather={isLoadingWeather}
  currentWeatherData={currentWeatherData}
  {weatherError}
  on:close={closeMap}
/>




