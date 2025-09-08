<script lang="ts">
  import { onMount } from 'svelte';
  import MenuBar from '../lib/components/MenuBar.svelte';
  import CityComparisonPanel from '../lib/components/CityComparisonPanel.svelte';
  let isDarkMode = false;
  let isMenuOpen = false;
  let WeatherApp: any = null;
  let isAppLoading = true;
  let cityWeatherData: Record<string, {temp: number, humidity?: number}> = {};
  
  // 比較対象の都市リスト
  let comparisonCities = ['東京', '大阪', '福岡'];

  // WeatherAppコンポーネントの動的インポート
  async function loadWeatherApp() {
    if (!WeatherApp) {
      const module = await import('../lib/WeatherApp.svelte');
      WeatherApp = module.default;
    }
    return WeatherApp;
  }

  // アメダスデータから都市データを取得の関数を削除（CityComparisonPanelに移動）

  // ダークモード管理
  onMount(async () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      applyTheme(savedTheme);
    }

    // WeatherAppを遅延読み込み（コンテンツが表示された後）
    setTimeout(async () => {
      await loadWeatherApp();
      isAppLoading = false;
    }, 100);
  });

  function applyTheme(theme: string) {
    isDarkMode = theme === 'dark';
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      if (isDarkMode) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
  }

  function toggleTheme() {
    const newTheme = isDarkMode ? 'light' : 'dark';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    applyTheme(newTheme);
  }

  // メニューバーの開閉
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function closeMenu() {
    isMenuOpen = false;
  }

  // CityComparisonPanelコンポーネントから都市データを受信
  function handleCityWeatherUpdate(event: CustomEvent) {
    cityWeatherData = event.detail;
  }

  // WeatherAppコンポーネントから都市データを受信
  function handleWeatherAppCityUpdate(event: CustomEvent) {
    cityWeatherData = event.detail;
  }
</script>

<svelte:head>
  <title>ひんやりさがし</title>
  <meta name="description" content="涼しい避暑地ランキング" />
</svelte:head>

<div class="container mx-auto p-4 md:p-8 max-w-3xl min-h-screen flex flex-col relative">
  <MenuBar {isMenuOpen} {isDarkMode} {closeMenu} {toggleTheme} />

  <header class="text-center mb-6 relative">
    <!-- メニューボタン（左側に独立配置） -->
    <div class="absolute left-0 top-0 flex items-center h-full">
      <button 
        on:click={toggleMenu}
        class="p-2 text-slate-700 dark:text-slate-300"
      >
        <span class="material-symbols-outlined text-2xl">menu</span>
      </button>
    </div>
    
    <!-- タイトル（中央配置） -->
    <h1 class="text-3xl md:text-4xl font-bold text-blue-900 dark:text-blue-300 flex items-center justify-center gap-3 mb-2">
      <span class="material-symbols-outlined text-3xl md:text-4xl -mr-2">mode_cool</span>
      ひんやりさがし
    </h1>
    <p class="text-lg md:text-xl mt-2">涼しい避暑地ランキング</p>
  </header>

  <!-- 都市比較パネル -->
  <CityComparisonPanel 
    cities={comparisonCities} 
    bind:cityWeatherData 
    on:weatherUpdate={handleCityWeatherUpdate} 
  />

  <!-- WeatherApp コンポーネント（動的インポート） -->
  {#if isAppLoading}
    <div class="flex items-center justify-center gap-3 py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span class="text-slate-600 dark:text-slate-400">天気データを読み込み中...</span>
    </div>
  {:else if WeatherApp}
    <svelte:component this={WeatherApp} on:cityWeatherUpdate={handleWeatherAppCityUpdate} />
  {/if}
</div>
