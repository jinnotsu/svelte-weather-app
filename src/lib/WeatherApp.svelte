<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { WeatherRankingItem } from './types';
  import { WeatherDataService } from './services/WeatherDataService';
  
  // 静的インポート（常に使用されるコンポーネント）
  import LoadingPanel from './components/LoadingPanel.svelte';
  import WeatherRankingList from './components/WeatherRankingList.svelte';
  import UpdateTimeDisplay from './components/UpdateTimeDisplay.svelte';
  import ApiConfigManager from './components/ApiConfigManager.svelte';
  import CityWeatherManager from './components/CityWeatherManager.svelte';
  import MainWeatherDataFetcher from './components/MainWeatherDataFetcher.svelte';
  import ItemClickHandler from './components/ItemClickHandler.svelte';
  
  // 動的インポート用の変数
  let WeatherDetailPanel: any = null;
  
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
  
  // コンポーネントの参照
  let itemClickHandler: ItemClickHandler;

  // 動的インポート関数
  async function loadWeatherDetailPanel() {
    if (!WeatherDetailPanel) {
      const module = await import('./components/WeatherDetailPanel.svelte');
      WeatherDetailPanel = module.default;
    }
    return WeatherDetailPanel;
  }

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
  {googleMapsApiKey}
/>

<main class="w-full flex-grow flex flex-col gap-8">
  <LoadingPanel isLoading={$isLoading} errorMessage={$errorMessage} />
  
  {#if $isDataReady}
    <!-- 詳細表示パネル（動的インポート） -->
    {#if $showDetailPanel}
      {#key $selectedItem?.rank}
        {#await loadWeatherDetailPanel() then DetailPanel}
          <DetailPanel 
            selectedItem={$selectedItem}
            mapUrl={$mapUrl}
            {googleMapsApiKey}
            currentDescription={$currentDescription}
            isLoadingDescription={$isLoadingDescription}
          />
        {/await}
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






