<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { WeatherRankingItem } from '../types';
  
  export let selectedItem: WeatherRankingItem | null = null;
  export let mapUrl: string = '';
  export let googleMapsApiKey: string = '';
  export let currentDescription: string = '';
  export let isLoadingDescription: boolean = false;
  
  const dispatch = createEventDispatcher();
  
  let copyMessage = '';
  let ShareService: any = null;

  // ShareServiceの動的インポート
  async function loadShareService() {
    if (!ShareService) {
      const module = await import('../services/ShareService');
      ShareService = module.ShareService;
    }
    return ShareService;
  }
  
  async function copyToClipboard() {
    if (!selectedItem) return;
    
    try {
      const service = await loadShareService();
      const message = await service.copyToClipboard(selectedItem);
      copyMessage = message;
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

  // リアクティブな変数を関数に変更
  async function getGoogleSearchUrl() {
    if (!selectedItem) return 'https://www.google.com/';
    const service = await loadShareService();
    return service.getGoogleSearchUrl(selectedItem);
  }

  async function getTwitterShareUrl() {
    if (!selectedItem) return '';
    const service = await loadShareService();
    return service.getTwitterShareUrl(selectedItem);
  }

  async function getFacebookShareUrl() {
    if (!selectedItem) return '';
    const service = await loadShareService();
    return service.getFacebookShareUrl(selectedItem);
  }

  // リアクティブに URL を追跡する状態
  let googleSearchUrl = '';
  let twitterShareUrl = '';
  let facebookShareUrl = '';

  // selectedItem が変更されたときに URL を更新
  $: if (selectedItem) {
    getGoogleSearchUrl().then(url => googleSearchUrl = url);
    getTwitterShareUrl().then(url => twitterShareUrl = url);
    getFacebookShareUrl().then(url => facebookShareUrl = url);
  }
</script>

{#if selectedItem}
  <div id="detail-panel" class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg flex flex-col panel-fade-in">
    <!-- 地図表示 -->
    <div class="relative w-full aspect-[8/9] overflow-hidden rounded-t-xl flex items-center justify-center">
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
    
    <!-- 地域情報 -->
    <div class="p-6">
      <div class="flex items-baseline gap-3">
        <span class="font-bold text-4xl text-blue-600 dark:text-blue-400">#{selectedItem.rank}</span>
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50">{selectedItem.city}</h2>
      </div>
      <p class="text-lg text-slate-800 dark:text-slate-400 mb-4">{selectedItem.region}</p>
      
      <!-- 気温・湿度表示 -->
      <div class="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div class="flex items-baseline text-sky-700 dark:text-sky-400 font-bold">
          <span class="material-symbols-outlined text-3xl sm:text-4xl mr-1">thermostat</span>
          <span class="text-xl sm:text-2xl">気温</span>
          <span class="text-3xl sm:text-4xl ml-2">{selectedItem.temp}</span>
          <span class="text-xl sm:text-2xl ml-1">°C</span>
        </div>
        <div class="flex items-baseline text-blue-500 dark:text-blue-400 font-bold">
          <span class="material-symbols-outlined text-3xl sm:text-4xl mr-1">humidity_low</span>
          <span class="text-xl sm:text-2xl">湿度</span>
          <span class="text-3xl sm:text-4xl ml-2">{selectedItem.humidity || '-'}</span>
          <span class="text-xl sm:text-2xl ml-1">%</span>
        </div>
      </div>
      
      <!-- 説明文 -->
      {#if isLoadingDescription}
        <p class="text-slate-600 dark:text-slate-400 leading-relaxed animate-pulse">説明文をGeminiで生成中...</p>
      {:else}
        <p class="text-slate-800 dark:text-slate-300 leading-relaxed">{currentDescription}</p>
      {/if}
      
      <!-- シェア・検索ボタン -->
      <div class="mt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
        <div class="mt-6 flex items-center justify-center flex-wrap gap-4">
          <a 
            href={googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <span class="material-symbols-outlined text-lg">search</span>
            この地域をググる
          </a>
          <div class="flex items-center gap-2">
            <a href={twitterShareUrl} target="_blank" aria-label="Twitterでシェア" class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href={facebookShareUrl} target="_blank" aria-label="Facebookでシェア" class="w-12 h-12 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
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
