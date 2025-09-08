<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { WeatherRankingItem } from '../types';
  import WeatherRankingList from './WeatherRankingList.svelte';
  import LoadingPanel from './LoadingPanel.svelte';
  import UpdateTimeDisplay from './UpdateTimeDisplay.svelte';

  const dispatch = createEventDispatcher();

  let amedasData: WeatherRankingItem[] = [];
  let isLoading = true;
  let errorMessage = '';
  let updateTime = '';
  let rankingType: 'coolest' = 'coolest'; // 最低気温のみ
  let limit = 10;

  // アメダスランキングデータを取得
  async function fetchAmedasRanking() {
    try {
      isLoading = true;
      errorMessage = '';

      const response = await fetch(`/api/temperature-ranking?type=${rankingType}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'データの取得に失敗しました');
      }

      // アメダスデータをWeatherRankingItem形式に変換
      amedasData = result.data.map((item: any, index: number) => ({
        rank: index + 1,
        region: item.prefecture,
        city: item.stationName,
        temp: Math.round(item.temperature * 10) / 10 // 小数点第1位まで
      }));

      updateTime = result.timestamp;
      
    } catch (error) {
      console.error('アメダスランキング取得エラー:', error);
      errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました';
    } finally {
      isLoading = false;
    }
  }

  // ランキングタイプを切り替え（削除：最低気温のみなので不要）

  // アイテムクリック時の処理
  function handleItemClick(event: CustomEvent<WeatherRankingItem>) {
    dispatch('itemClick', event.detail);
  }

  // 定期的な更新（10分ごと）
  let updateInterval: NodeJS.Timeout;

  onMount(() => {
    fetchAmedasRanking();
    
    // 10分ごとに自動更新
    updateInterval = setInterval(fetchAmedasRanking, 10 * 60 * 1000);
    
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  });
</script>

<div class="w-full flex flex-col gap-6">


  <!-- エラーとローディング -->
  <LoadingPanel {isLoading} {errorMessage} />

  <!-- ランキングリスト -->
  {#if !isLoading && !errorMessage && amedasData.length > 0}
    <WeatherRankingList 
      weatherData={amedasData}
      on:itemClick={handleItemClick}
    />
    
    <UpdateTimeDisplay {updateTime} />
  {/if}

  {#if !isLoading && !errorMessage && amedasData.length === 0}
    <div class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-8 text-center">
      <span class="material-symbols-outlined text-4xl text-slate-400 mb-4">warning</span>
      <p class="text-slate-600 dark:text-slate-400">現在、表示できるアメダスデータがありません</p>
    </div>
  {/if}
</div>
