<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { WeatherRankingItem } from './types';
  import { WeatherDataService } from './services/WeatherDataService';
  import { AIDescriptionService } from './services/AIDescriptionService';
  
  // コンポーネントのインポート
  import LoadingPanel from './components/LoadingPanel.svelte';
  import WeatherDetailPanel from './components/WeatherDetailPanel.svelte';
  import WeatherRankingList from './components/WeatherRankingList.svelte';
  import UpdateTimeDisplay from './components/UpdateTimeDisplay.svelte';
  import ApiConfigManager from './components/ApiConfigManager.svelte';
  import CityWeatherManager from './components/CityWeatherManager.svelte';
  import MainWeatherDataFetcher from './components/MainWeatherDataFetcher.svelte';
  import ItemClickHandler from './components/ItemClickHandler.svelte';
  
  // ストアのインポート
  import { 
    weatherData, 
    isLoading, 
    errorMessage, 
    updateTime,
    selectedItem,
    showDetailPanel,
    mapUrl,
    currentDescription,
    isLoadingDescription,
    isDataReady 
  } from './stores/weatherStore';
  
  const dispatch = createEventDispatcher();
  
  // API keys
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const googleAiApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
  const openWeatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  // サービスの初期化
  const weatherDataService = new WeatherDataService(openWeatherApiKey, googleMapsApiKey);
  const aiDescriptionService = new AIDescriptionService(googleAiApiKey, weatherDataService);
  
  // コンポーネントの参照
  let itemClickHandler: ItemClickHandler;

  // イベントハンドラー
  function handleItemClick(event: CustomEvent<WeatherRankingItem>) {
    if (itemClickHandler) {
      itemClickHandler.handleItemClick(event.detail);
    }
  }

  function handleCityWeatherUpdate(event: CustomEvent) {
    dispatch('cityWeatherUpdate', event.detail);
  }
</script>

<!-- 隠れたマネージャーコンポーネント群 -->
<ApiConfigManager 
  {googleMapsApiKey}
  {googleAiApiKey}
  {openWeatherApiKey}
/>

<MainWeatherDataFetcher {weatherDataService} />

<CityWeatherManager 
  {weatherDataService}
  on:cityWeatherUpdate={handleCityWeatherUpdate}
/>

<ItemClickHandler 
  bind:this={itemClickHandler}
  {weatherDataService}
  {aiDescriptionService}
  {googleMapsApiKey}
/>

<main class="w-full flex-grow flex flex-col gap-8">
  <LoadingPanel isLoading={$isLoading} errorMessage={$errorMessage} />
  
  {#if $isDataReady}
    <!-- 詳細表示パネル -->
    {#if $showDetailPanel}
      {#key $selectedItem?.rank}
        <WeatherDetailPanel 
          selectedItem={$selectedItem}
          mapUrl={$mapUrl}
          {googleMapsApiKey}
          currentDescription={$currentDescription}
          isLoadingDescription={$isLoadingDescription}
        />
      {/key}
    {/if}
    
    <!-- ランキング一覧パネル -->
    <WeatherRankingList 
      weatherData={$weatherData}
      on:itemClick={handleItemClick}
    />
    
    <!-- 更新時刻表示 -->
    <UpdateTimeDisplay updateTime={$updateTime} />
  {/if}
</main>






