<script lang="ts">
  import type { WeatherData } from './types';

  export let isLoading = false;
  export let weatherData: WeatherData | null = null;
  export let weatherError = '';

  // 天気タイプから日本語の説明とエモジアイコンを取得
  function getJapaneseWeatherInfo(type: string, description: string) {
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
    
    if (openWeatherMap[type]) {
      return openWeatherMap[type];
    }
    
    return { jp: description || '不明', emoji: '🌈' };
  }
</script>

<div class="mt-6 pt-5">
  
  {#if isLoading}
    <div class="loading-card">
      <p class="text-lg mb-2">📡 天気情報を取得中...</p>
      <small class="text-xs">OpenWeatherMap APIから天気情報を取得中...</small>
    </div>
  {/if}
  
  {#if weatherError}
    <div class="error-card">
      <p class="text-lg mb-2">❌ {weatherError}</p>
      <small class="text-xs">💡 OpenWeatherMap APIを使用して天気情報を取得しています。</small>
    </div>
  {/if}
  
  {#if weatherData}
    <div class="weather-card animate-fade-in">
      <!-- 🌤️ 現在の天気 -->
      <h5 class="text-lg font-semibold text-gray-800 mb-3 text-center">🌤️ 現在の天気</h5>
      
      <div class="flex items-center gap-3 md:gap-4">
        <div class="weather-icon-container md:w-12 md:h-12">
          {#if weatherData.weatherCondition.iconUrl}
            <img 
              src={weatherData.weatherCondition.iconUrl} 
              alt={weatherData.weatherCondition.description}
              class="weather-icon-img"
            />
          {:else}
            <span class="weather-emoji md:text-4xl">
              {getJapaneseWeatherInfo(weatherData.weatherCondition.type, weatherData.weatherCondition.description).emoji}
            </span>
          {/if}
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="text-base md:text-lg font-semibold text-gray-700 mb-1">
            {getJapaneseWeatherInfo(weatherData.weatherCondition.type, weatherData.weatherCondition.description).jp}
          </div>
          <div class="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3">
            <span class="temperature-main md:text-3xl">{Math.round(weatherData.currentTemperature)}°C</span>
            <span class="temperature-secondary md:text-base">湿度 {weatherData.humidity}%</span>
          </div>
        </div>
      </div>
      
      <!-- API情報の表示 -->
      <div class="api-badge md:p-3">
        <small class="text-sm font-medium text-gray-700">📊 データ提供: OpenWeatherMap API</small>
      </div>
    </div>
  {/if}
</div>


