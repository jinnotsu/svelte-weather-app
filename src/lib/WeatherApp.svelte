<script lang="ts">
  import { onMount, createEventDispatcher, tick } from 'svelte';
  import { GoogleGenAI } from '@google/genai';
  import type { WikipediaInfo, WeatherRankingItem, LocationClickEvent } from './types';
  
  const dispatch = createEventDispatcher();
  
  let weatherData: WeatherRankingItem[] = [];
  let isLoading = true;
  let errorMessage = '';
  let statusMessage = '';
  let updateTime = '';
  let selectedItem: WeatherRankingItem | null = null;
  let showDetailPanel = false;
  let copyMessage = '';
  let currentDescription = '';
  let isLoadingDescription = false;
  let mapUrl = '';
  let cityWeatherData: Record<string, {temp: number, humidity: number}> = {
    '東京': { temp: 35, humidity: 80 },
    '大阪': { temp: 36, humidity: 82 },
    '福岡': { temp: 34, humidity: 78 }
  };
  let isLoadingCityWeather = false;
  
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
    
    return [];
  }

  function parseUpdateTime(html: string): string {
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

  async function getCachedLocationInfo(city: string, region: string): Promise<WikipediaInfo | null> {
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

  // 都市の天気データを取得する関数
  async function fetchCityWeatherData() {
    if (!openWeatherApiKey) {
      console.log('OpenWeatherMap API key not configured');
      return;
    }

    isLoadingCityWeather = true;
    const cities = [
      { name: '東京', query: 'Tokyo,JP' },
      { name: '大阪', query: 'Osaka,JP' },
      { name: '福岡', query: 'Fukuoka,JP' }
    ];

    try {
      for (const city of cities) {
        try {
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city.query}&appid=${openWeatherApiKey}&units=metric&lang=ja`);
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
      // リアクティブ更新をトリガー
      cityWeatherData = { ...cityWeatherData };
      
      // 親コンポーネントにデータを送信
      dispatch('cityWeatherUpdate', cityWeatherData);
    } catch (error) {
      console.error('都市天気データ取得エラー:', error);
    } finally {
      isLoadingCityWeather = false;
    }
  }

  async function setCachedLocationInfo(city: string, region: string, info: WikipediaInfo): Promise<void> {
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
      const parsedUpdateTime = parseUpdateTime(html);
      
      if (parsedUpdateTime) {
        updateTime = parsedUpdateTime;
      }
      
      if (rankings.length > 0) {
        rankings.sort((a, b) => a.rank - b.rank);
        weatherData = rankings.slice(0, 20);
        statusMessage = `${rankings.length}件のデータを取得しました`;
      } else {
        // テンプレートからのモックデータ
        weatherData = [
          { rank: 1, region: "福島県", city: "鷲倉", temp: 18.2 },
          { rank: 2, region: "栃木県", city: "奥日光", temp: 18.6 },
          { rank: 3, region: "道東", city: "知方学", temp: 19.0 },
          { rank: 4, region: "道東", city: "羅臼", temp: 19.1 },
          { rank: 5, region: "道東", city: "紋別", temp: 19.7 },
          { rank: 6, region: "群馬県", city: "草津", temp: 19.8 },
          { rank: 7, region: "青森県", city: "酸ケ湯", temp: 20.3 },
          { rank: 8, region: "道南", city: "えりも岬", temp: 20.6 }
        ];
        statusMessage = 'モックデータを表示中（データ解析に失敗）';
      }
      
      // 都市の天気データを並行して取得
      fetchCityWeatherData();
      
    } catch (error) {
      errorMessage = `エラー: ${error instanceof Error ? error.message : String(error)}`;
      statusMessage = 'データ取得に失敗しました';
    } finally {
      isLoading = false;
    }
  });

  // 説明文を生成する関数（Gemini APIを使用）
  async function getLocationDescription(city: string, region: string): Promise<string> {
    // まずキャッシュをチェック
    const cachedInfo = await getCachedLocationInfo(city, region);
    if (cachedInfo && cachedInfo.extract) {
      return cachedInfo.extract;
    }
    
    // キャッシュがない場合はGemini APIで生成を待つ
    if (ai) {
      await generateLocationDescription(city, region);
      // 生成後、再度キャッシュをチェック
      const newCachedInfo = await getCachedLocationInfo(city, region);
      if (newCachedInfo && newCachedInfo.extract) {
        return newCachedInfo.extract;
      }
    }
    
    // APIが利用できない場合のフォールバック
    return `${city}（${region}）の詳細情報を取得中です...`;
  }

  // Gemini APIで地域の説明文を生成する関数
  async function generateLocationDescription(city: string, region: string): Promise<string | null> {
    try {
      const prompt = `以下の日本の地点について、魅力的な紹介文を書いてください。**紹介文のみ出力すること。**：

地点: ${city}
地域: ${region}

簡潔な紹介文（200文字以内）

回答は日本語で、自然で魅力的な文章にしてください。観光地として紹介するようなトーンで書いてください。避暑地としての魅力があれば含めてください。

例:
「美しい自然に囲まれた○○は、○○地方の代表的な観光地です。○○の特徴として○○が挙げられ、○○の○○として知られています。」`;

      if (!ai) {
        console.log('AIクライアントが初期化されていません');
        return null;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const generatedText = response.text;
      
      if (generatedText) {
        const newInfo: WikipediaInfo = {
          title: `${city} (${region})`,
          extract: generatedText,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${city} ${region} 日本`)}`,
          foundVia: 'Google Gemini AIで生成',
          isGenerated: true
        };
        
        // キャッシュに保存
        await setCachedLocationInfo(city, region, newInfo);
        console.log(`✅ ${city}の説明文を生成・キャッシュ: ${generatedText}`);
        return generatedText;
      }
    } catch (error) {
      console.error(`説明文生成エラー (${city}):`, error);
    }
    return null;
  }

  // 地域の座標を取得する関数
  async function getCoordinates(city: string, region: string): Promise<{lat: number, lng: number} | null> {
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not configured');
      return null;
    }
    
    try {
      const query = encodeURIComponent(`${city}, ${region}, Japan`);
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${googleMapsApiKey}`;
      
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

  // 地域の天気データを取得する関数（気温と湿度）
  async function fetchLocationWeatherData(city: string, region: string): Promise<{temp: number, humidity: number} | null> {
    if (!openWeatherApiKey) {
      console.error('OpenWeatherMap API key not configured');
      return null;
    }
    
    try {
      console.log(`=== ${city} (${region})の天気情報を取得中 ===`);
      
      // 1. 座標を取得
      const coordinates = await getCoordinates(city, region);
      if (!coordinates) {
        console.error('座標の取得に失敗しました');
        return null;
      }

      // 2. OpenWeatherMap APIから天気情報を取得（座標ベース）
      console.log('OpenWeatherMap APIで天気情報を取得中...');
      
      const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${openWeatherApiKey}&units=metric&lang=ja`;
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

  // アイテムクリック時の処理
  async function handleItemClick(item: WeatherRankingItem) {
    // アクティブ状態を即座に管理（ユーザーのクリックに即応するため最初に実行）
    const allItems = document.querySelectorAll('.list-item');
    allItems.forEach(el => el.classList.remove('active'));
    
    const targetElement = document.querySelector(`[data-rank="${item.rank}"]`);
    if (targetElement) {
      targetElement.classList.add('active');
    }
    
    selectedItem = item;
    
    // 地図表示のURLを設定
    const baseQuery = encodeURIComponent(`${item.city}, ${item.region}, Japan`);
    mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${baseQuery}&maptype=satellite&zoom=15`;
    
    // 詳細パネルを表示
    if (!showDetailPanel) {
      showDetailPanel = true;
    }
    
    // Svelteの反応性の更新を待ってからスクロール
    // （新しい地点が選択された場合も含めて、常にスクロールする）
    await tick();
    setTimeout(() => {
      const detailPanel = document.getElementById('detail-panel');
      if (detailPanel) {
        detailPanel.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 50);
    
    // 天気データ（湿度）を取得
    if (!item.humidity) {
      const weatherDataResult = await fetchLocationWeatherData(item.city, item.region);
      if (weatherDataResult) {
        // リアクティブ更新のため、weatherData配列を更新
        weatherData = weatherData.map(dataItem => 
          dataItem.rank === item.rank 
            ? { ...dataItem, humidity: weatherDataResult.humidity }
            : dataItem
        );
        // selectedItemも更新
        selectedItem = weatherData.find(dataItem => dataItem.rank === item.rank) || item;
      }
    }
    
    // 説明文を非同期で取得
    isLoadingDescription = true;
    currentDescription = '';
    try {
      currentDescription = await getLocationDescription(item.city, item.region);
    } catch (error) {
      console.error('説明文取得エラー:', error);
      currentDescription = `${item.city}（${item.region}）は、美しい自然環境に恵まれた涼しい地域として知られています。`;
    } finally {
      isLoadingDescription = false;
    }
  }

  // シェア機能
  function getShareText(): string {
    if (!selectedItem) return '';
    return `${selectedItem.city}の気温は現在${selectedItem.temp}℃で現在日本${selectedItem.rank}位です🥶 #日本で気温が低い場所`;
  }

  async function copyToClipboard() {
    try {
      const shareText = getShareText();
      const fullText = `${shareText} ${window.location.href}`;
      await navigator.clipboard.writeText(fullText);
      copyMessage = 'コピーしました！';
      setTimeout(() => {
        copyMessage = '';
      }, 2000);
    } catch (error) {
      copyMessage = 'コピーに失敗';
      setTimeout(() => {
        copyMessage = '';
      }, 2000);
    }
  }

  function getGoogleSearchUrl(): string {
    if (!selectedItem) return 'https://www.google.com/';
    const searchQuery = `${selectedItem.city} ${selectedItem.region} 観光 避暑地`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  }

  function getTwitterShareUrl(): string {
    const shareText = getShareText();
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.href);
    return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  }

  function getFacebookShareUrl(): string {
    const shareText = getShareText();
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(window.location.href);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  }


</script>

<main class="w-full flex-grow flex flex-col gap-8">
  {#if isLoading}
    <div class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 text-center">
      <p class="text-slate-600 dark:text-slate-400">📡 データを読み込み中...</p>
    </div>
  {:else if errorMessage}
    <div class="main-panel-bg bg-red-50/70 dark:bg-red-900/70 border border-red-200 dark:border-red-700 rounded-2xl shadow-lg p-6">
      <p class="text-red-700 dark:text-red-300">❌ {errorMessage}</p>
    </div>
  {:else}
    <!-- 詳細表示パネル -->
    {#if showDetailPanel && selectedItem}
      <div id="detail-panel" class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 md:p-8 flex flex-col panel-fade-in">
        <div class="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-6 shadow-md bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 flex items-center justify-center">
          {#if mapUrl && googleMapsApiKey}
            <iframe 
              src={mapUrl} 
              width="100%" 
              height="100%" 
              style="border:0;" 
              allowfullscreen={true} 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade"
              title="地図"
            ></iframe>
          {:else}
            <div class="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400">
              <span class="material-symbols-outlined text-5xl">location_on</span>
              <span>{googleMapsApiKey ? '地図を読み込み中...' : 'Google Maps APIキーが設定されていません'}</span>
            </div>
          {/if}
        </div>
        <div>
          <div class="flex items-baseline gap-3">
            <span class="font-bold text-2xl text-blue-600 dark:text-blue-400">#{selectedItem.rank}</span>
            <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">{selectedItem.city}</h2>
          </div>
          <p class="text-lg text-slate-800 dark:text-slate-400 mb-4">{selectedItem.region}</p>
          <div class="flex items-end gap-6 mb-6">
            <div class="flex items-center text-sky-700 dark:text-sky-400 font-bold">
              <span class="material-symbols-outlined text-3xl mr-1">thermostat</span>
              <span class="text-4xl">{selectedItem.temp}</span>
              <span class="text-2xl ml-1">°C</span>
            </div>
            <div class="flex items-center text-blue-500 dark:text-blue-400 font-bold">
              <span class="material-symbols-outlined text-3xl mr-1">humidity_low</span>
              <span class="text-4xl">{selectedItem.humidity || '-'}</span>
              <span class="text-2xl ml-1">%</span>
            </div>
          </div>
          {#if isLoadingDescription}
            <p class="text-slate-600 dark:text-slate-400 leading-relaxed animate-pulse">説明文をGeminiで生成中...</p>
          {:else}
            <p class="text-slate-800 dark:text-slate-300 leading-relaxed">{currentDescription}</p>
          {/if}
          
          <div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
            <div class="flex items-center justify-center flex-wrap gap-4">
              <a 
                href={getGoogleSearchUrl()}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span class="material-symbols-outlined text-lg">search</span>
                この地域を検索する
              </a>
              <div class="flex items-center gap-2">
                <a href={getTwitterShareUrl()} target="_blank" aria-label="Twitterでシェア" class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  <span class="material-symbols-outlined text-xl">share</span>
                </a>
                <a href={getFacebookShareUrl()} target="_blank" aria-label="Facebookでシェア" class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  <span class="material-symbols-outlined text-xl">share</span>
                </a>
                <button on:click={copyToClipboard} aria-label="クリップボードにコピー" class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  <span class="material-symbols-outlined text-xl">content_copy</span>
                </button>
              </div>
            </div>
            {#if copyMessage}
              <p class="text-center text-sm text-green-600 dark:text-green-400 transition-all duration-300">{copyMessage}</p>
            {/if}
          </div>
        </div>
      </div>
    {/if}
    
    <!-- ランキング一覧パネル -->
    <div class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-4">
      <h3 class="text-xl font-bold text-slate-900 dark:text-slate-200 p-4">ランキング一覧</h3>
      <div class="space-y-2 pr-2">
        {#each weatherData as item}
            <button 
            class="list-item list-none w-full text-left p-4 flex items-center gap-4 rounded-lg border-2 border-transparent transition-all duration-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900"
            data-rank={item.rank}
            on:click={() => handleItemClick(item)}
            >
            <span class="rank-badge font-bold text-xl w-10 text-center flex-shrink-0 text-slate-600 dark:text-slate-500">#{item.rank}</span>
            <div class="flex-grow flex flex-col justify-center">
              <span class="font-bold text-lg text-slate-900 dark:text-slate-100">{item.city}</span>
              <span class="text-sm text-slate-700 dark:text-slate-400">{item.region}</span>
            </div>
            <span class="font-bold text-blue-600 dark:text-blue-400 text-xl w-20 flex-shrink-0 text-right">{item.temp}°C</span>
          </button>
        {/each}
      </div>
    </div>
    
    <!-- tenki.jp更新時刻表示 -->
    {#if updateTime}
      <div class="text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-sm align-middle leading-none">database</span>
        <span>Source tenki.jp 更新時刻: {updateTime}</span>
      </div>
    {/if}
  {/if}
</main>






