<script lang="ts">
  import WeatherApp from '../lib/WeatherApp.svelte';
  import { onMount } from 'svelte';

  let isDarkMode = false;
  let cityWeatherData: Record<string, {temp: number}> = {
    '東京': { temp: 35 },
    '大阪': { temp: 36 },
    '福岡': { temp: 34 }
  };

  // ダークモード管理
  onMount(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      applyTheme(savedTheme);
    }
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

  // WeatherAppコンポーネントから都市データを受信
  function handleCityWeatherUpdate(event: CustomEvent) {
    cityWeatherData = event.detail;
  }
</script>

<svelte:head>
  <title>ひんやりさがし</title>
  <meta name="description" content="涼しい避暑地ランキング" />
</svelte:head>

<div class="container mx-auto p-4 md:p-8 max-w-3xl min-h-screen flex flex-col relative">
  <header class="text-center mb-6">
    <h1 class="text-3xl md:text-4xl font-bold text-blue-900 dark:text-blue-300 flex items-center justify-center gap-3">
      <span class="material-symbols-outlined text-3xl md:text-4xl">mode_cool</span>
      ひんやりさがし
    </h1>
    <p class="text-slate-700 dark:text-slate-400 mt-2">涼しい避暑地ランキング</p>
  </header>

  <!-- ダークモード切替ボタン -->
  <div class="absolute top-4 right-4">
    <button 
      on:click={toggleTheme} 
      class="dark-mode-toggle p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-lg text-blue-800 dark:text-yellow-300 transition-all duration-300 hover:bg-blue-50 cursor-pointer dark:hover:bg-blue-900 hover:shadow-xl hover:-translate-y-0.5"
    >
      {#if isDarkMode}
        <span class="material-symbols-outlined text-2xl">dark_mode</span>
      {:else}
        <span class="material-symbols-outlined text-2xl">light_mode</span>
      {/if}
    </button>
  </div>

  <!-- 都市比較パネル -->
  <div class="mb-8 p-4 main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
    <h2 class="text-center text-slate-800 dark:text-slate-300 font-bold mb-4">現在の都会の暑さは...</h2>
    <div class="flex justify-around items-start text-center">
      <div class="flex flex-col items-center gap-1 w-24">
        <span class="font-bold text-lg text-slate-900 dark:text-slate-200">東京</span>
        <div class="flex items-center gap-1 text-red-500">
          <span class="material-symbols-outlined text-lg">thermostat</span>
          <span class="font-bold text-xl">{cityWeatherData['東京'].temp}℃</span>
        </div>
      </div>
      <div class="border-l h-16 border-slate-300 dark:border-slate-600"></div>
      <div class="flex flex-col items-center gap-1 w-24">
        <span class="font-bold text-lg text-slate-900 dark:text-slate-200">大阪</span>
        <div class="flex items-center gap-1 text-red-500">
          <span class="material-symbols-outlined text-lg">thermostat</span>
          <span class="font-bold text-xl">{cityWeatherData['大阪'].temp}℃</span>
        </div>
      </div>
      <div class="border-l h-16 border-slate-300 dark:border-slate-600"></div>
      <div class="flex flex-col items-center gap-1 w-24">
        <span class="font-bold text-lg text-slate-900 dark:text-slate-200">福岡</span>
        <div class="flex items-center gap-1 text-red-500">
          <span class="material-symbols-outlined text-lg">thermostat</span>
          <span class="font-bold text-xl">{cityWeatherData['福岡'].temp}℃</span>
        </div>
      </div>
    </div>
  </div>

  <!-- WeatherApp コンポーネント -->
  <WeatherApp on:cityWeatherUpdate={handleCityWeatherUpdate} />

  <footer class="text-center">
    <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-2">
      <svg class="h-4 w-4 align-text-bottom" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
        <a href="https://github.com/jinnotsu/svelte-weather-app" target="_blank" rel="noopener noreferrer">OpenSource &lt;3</a>
    </p>
  </footer>
</div>
