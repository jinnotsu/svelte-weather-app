<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { WeatherRankingItem } from '../types';
  
  export let weatherData: WeatherRankingItem[] = [];
  
  const dispatch = createEventDispatcher();
  
  function handleItemClick(item: WeatherRankingItem) {
    dispatch('itemClick', item);
  }
</script>

<div class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-4">
  <h3 class="text-xl font-bold text-slate-900 dark:text-slate-200 mt-4 mb-2 pl-4">ランキング一覧</h3>
  <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 pl-4">地名をタップして詳細をみる</p>
  <div class="space-y-2 pr-2">
    {#each weatherData as item}
      <button 
        class="w-full text-left p-4 flex items-center gap-4 rounded-lg border-2 border-transparent transition-all duration-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 active:scale-95 focus:ring-2 focus:ring-blue-500"
        data-rank={item.rank}
        on:click={() => handleItemClick(item)}
        aria-label={`ランキング ${item.rank}: ${item.city}, ${item.region}, 温度 ${item.temp}°C`}
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
