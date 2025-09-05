<script lang="ts">
  import { onMount } from 'svelte';

  let isDarkMode = false;
  let isMenuOpen = false;
  let WeatherApp: any = null;
  let isAppLoading = true;
  let cityWeatherData: Record<string, {temp: number}> = {
    '東京': { temp: 35 },
    '大阪': { temp: 36 },
    '福岡': { temp: 34 }
  };

  // WeatherAppコンポーネントの動的インポート
  async function loadWeatherApp() {
    if (!WeatherApp) {
      const module = await import('../lib/WeatherApp.svelte');
      WeatherApp = module.default;
    }
    return WeatherApp;
  }

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
  <!-- メニューオーバーレイ -->
  {#if isMenuOpen}
    <div 
      class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
      on:click={closeMenu}
      on:keydown={(e) => e.key === 'Escape' && closeMenu()}
      role="button"
      tabindex="0"
    ></div>
  {/if}

  <!-- サイドメニューバー -->
  <div 
    class="fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out {isMenuOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="p-6">
      <!-- メニューヘッダー -->
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200">メニュー</h2>
        <button 
          on:click={closeMenu}
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span class="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <!-- メニュー項目エリア -->
      <div class="space-y-2">
        <!-- ダークモード切替 -->
        <button 
          on:click={toggleTheme}
          class="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 text-left"
        >
          <div class="flex items-center justify-center w-8 h-8">
            {#if isDarkMode}
              <span class="material-symbols-outlined text-2xl text-yellow-500">light_mode</span>
            {:else}
              <span class="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-400">dark_mode</span>
            {/if}
          </div>
          <span class="text-xl font-medium text-slate-800 dark:text-slate-200">
            {isDarkMode ? 'ライトモード' : 'ダークモード'}
          </span>
        </button>
      </div>
      
      <!-- GitHubリンク（小さなテキスト） -->
      <div class="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
        <!-- 技術スタック情報 -->
        <div class="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          <p>Made with 
            <a href="https://svelte.dev/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Svelte</a> + 
            <a href="https://kit.svelte.dev/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">SvelteKit</a> + 
            <a href="https://vitejs.dev/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Vite</a> + 
            <a href="https://tailwindcss.com/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Tailwind CSS</a> + 
            <a href="https://maps.google.com/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Google Maps</a> + 
            <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Gemini</a> + 
            <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">OpenWeather</a>
          </p>
          <p>Hosted by <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Vercel</a></p>
        </div>
        
        <!-- GitHubリンク -->
        <p class="mt-3 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <a href="https://github.com/jinnotsu/svelte-weather-app" target="_blank" rel="noopener noreferrer" class="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">OpenSource &lt;3</a>
        </p>
      </div>
    </div>
  </div>

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
  <div class="mb-8 p-4 main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
    <h2 class="text-center text-slate-800 dark:text-slate-300 font-bold mb-4">いまの都会の暑さは...</h2>
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

  <!-- WeatherApp コンポーネント（動的インポート） -->
  {#if isAppLoading}
    <div class="flex items-center justify-center gap-3 py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span class="text-slate-600 dark:text-slate-400">天気データを読み込み中...</span>
    </div>
  {:else if WeatherApp}
    <svelte:component this={WeatherApp} on:cityWeatherUpdate={handleCityWeatherUpdate} />
  {/if}

  <footer class="text-center">
    <p class="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-center gap-2">
      <svg class="h-4 w-4 align-text-bottom" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
        <a href="https://github.com/jinnotsu/svelte-weather-app" target="_blank" rel="noopener noreferrer">OpenSource &lt;3</a>
    </p>
  </footer>
</div>
