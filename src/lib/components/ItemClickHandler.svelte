<script lang="ts">
  import { tick } from 'svelte';
  import type { WeatherRankingItem } from '../types';
  import type { WeatherDataService } from '../services/WeatherDataService';
  import { 
    selectedItem, 
    showDetailPanel, 
    mapUrl,
    currentDescription,
    isLoadingDescription,
    weatherData,
    updateSelectedItemHumidity 
  } from '../stores/weatherStore';
  
  export let weatherDataService: WeatherDataService;
  export let googleMapsApiKey: string;

  // 動的にインポートするサービス
  let aiDescriptionService: any = null;

  // AIDescriptionServiceの動的インポート
  async function loadAIDescriptionService() {
    if (!aiDescriptionService) {
      const module = await import('../services/AIDescriptionService');
      const googleAiApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      aiDescriptionService = new module.AIDescriptionService(googleAiApiKey, weatherDataService);
    }
    return aiDescriptionService;
  }

  // アイテムクリック時の処理
  export async function handleItemClick(item: WeatherRankingItem) {
    
    selectedItem.set(item);
    
    // 地図表示のURLを設定
    const baseQuery = encodeURIComponent(`${item.city}, ${item.region}, Japan`);
    const url = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${baseQuery}&maptype=satellite&zoom=15`;
    mapUrl.set(url);
    
    // 詳細パネルを表示
    showDetailPanel.set(true);
    
    // Svelteの反応性の更新を待ってからスクロール
    // （新しい地点が選択された場合も含めて、常にスクロールする）
    await tick();
    setTimeout(() => {
      const detailPanel = document.getElementById('detail-panel');
      if (detailPanel) {
        detailPanel.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 50);
    
    // 天気データ（湿度）を取得
    if (!item.humidity) {
      const weatherDataResult = await weatherDataService.fetchLocationWeatherData(item.city);
      if (weatherDataResult) {
        // リアクティブ更新のため、weatherData配列を更新
        weatherData.update(data => 
          data.map(dataItem => 
            dataItem.rank === item.rank 
              ? { ...dataItem, humidity: weatherDataResult.humidity }
              : dataItem
          )
        );
        // selectedItemも更新
        weatherData.subscribe(data => {
          const updatedItem = data.find(dataItem => dataItem.rank === item.rank);
          if (updatedItem) {
            selectedItem.set(updatedItem);
          }
        })();
      }
    }
    
    // 説明文を非同期で取得（動的インポート使用）
    isLoadingDescription.set(true);
    currentDescription.set('');
    try {
      const aiService = await loadAIDescriptionService();
      const description = await aiService.getLocationDescription(item.city, item.region);
      currentDescription.set(description);
    } catch (error) {
      console.error('説明文取得エラー:', error);
      currentDescription.set(`${item.city}（${item.region}）は、美しい自然環境に恵まれた涼しい地域として知られています。`);
    } finally {
      isLoadingDescription.set(false);
    }
  }
</script>

<!-- このコンポーネントはUIを持たないアイテムクリック処理管理コンポーネント -->
