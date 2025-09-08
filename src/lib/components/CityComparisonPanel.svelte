<script lang="ts">
  export let cities: string[] = ['東京', '大阪', '福岡'];
  export let cityWeatherData: Record<string, {temp: number, humidity?: number}> = {};

  // アメダスデータから都市データを取得
  async function fetchCityWeatherData() {
    try {
      const response = await fetch('/api/temperature-ranking?limit=50&type=hottest');
      if (!response.ok) {
        console.error('気温データの取得に失敗しました');
        return;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        console.error('無効な気温データです');
        return;
      }

      // 指定された都市データを抽出
      const newCityData: Record<string, {temp: number, humidity?: number}> = {};

      for (const city of cities) {
        const stationData = result.data.find((item: any) => item.stationName === city);
        if (stationData) {
          newCityData[city] = { 
            temp: Math.round(stationData.temperature * 10) / 10,
            humidity: stationData.humidity ? Math.round(stationData.humidity) : undefined
          };
        } else {
          // データが見つからない場合はデフォルト値を設定
          newCityData[city] = { temp: 0 };
        }
      }

      cityWeatherData = newCityData;
      
      // 親コンポーネントに更新を通知
      dispatchUpdate(newCityData);
    } catch (error) {
      console.error('都市気温データの取得エラー:', error);
    }
  }

  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  function dispatchUpdate(data: Record<string, {temp: number, humidity?: number}>) {
    dispatch('weatherUpdate', data);
  }

  onMount(async () => {
    await fetchCityWeatherData();
  });
</script>

<!-- 都市比較パネル -->
<div class="mb-8 p-4 main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
  <h2 class="text-center text-slate-800 dark:text-slate-300 font-bold mb-4">いまの都会の暑さは...</h2>
  <div class="flex justify-around items-start text-center">
    {#each cities as city, index}
      <div class="flex flex-col items-center gap-1 w-24">
        <span class="font-bold text-lg text-slate-900 dark:text-slate-200">{city}</span>
        <div class="flex items-center gap-1 text-red-500">
          <span class="material-symbols-outlined text-lg">thermostat</span>
          {#if cityWeatherData[city] && cityWeatherData[city].temp > 0}
            <span class="font-bold text-xl">{cityWeatherData[city].temp}℃</span>
          {:else}
            <span class="font-bold text-xl text-slate-400">-</span>
          {/if}
        </div>
      </div>
      {#if index < cities.length - 1}
        <div class="border-l h-16 border-slate-300 dark:border-slate-600"></div>
      {/if}
    {/each}
  </div>
</div>
