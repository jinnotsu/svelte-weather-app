<script lang="ts">
  import { onMount } from 'svelte';
  import type { WeatherDataService } from '../services/WeatherDataService';
  import { 
    weatherData, 
    isLoading, 
    errorMessage, 
    statusMessage, 
    updateTime,
    setLoading,
    updateWeatherData 
  } from '../stores/weatherStore';
  
  export let weatherDataService: WeatherDataService;
  
  async function fetchMainWeatherData() {
    try {
      statusMessage.set(`アメダスランキングを取得中...`);
      
      // アメダスサービスを使用して気温ランキングを取得
      const result = await weatherDataService.fetchWeatherRanking(20, 'coolest');
      
      statusMessage.set('データを処理中...');
      
      if (result.data.length > 0) {
        updateWeatherData(result.data);
        updateTime.set(result.timestamp);
        statusMessage.set(`${result.data.length}件のアメダスデータを取得しました`);
        console.log('✅ メインコンポーネント: アメダスデータ取得成功', result.data);
      } else {
        // フォールバック：モックデータを使用
        const mockData = weatherDataService.getMockWeatherData();
        updateWeatherData(mockData);
        statusMessage.set('モックデータを表示中（アメダスデータの取得に失敗）');
        console.log('⚠️ メインコンポーネント: モックデータを使用');
      }
      
    } catch (error) {
      console.error('❌ メインコンポーネント: アメダスデータ取得エラー', error);
      errorMessage.set(`エラー: ${error instanceof Error ? error.message : String(error)}`);
      statusMessage.set('アメダスデータ取得に失敗しました');
      
      // エラー時もモックデータを表示
      const mockData = weatherDataService.getMockWeatherData();
      updateWeatherData(mockData);
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    fetchMainWeatherData();
    
    // 10分ごとに自動更新
    const updateInterval = setInterval(fetchMainWeatherData, 10 * 60 * 1000);
    
    return () => {
      clearInterval(updateInterval);
    };
  });
</script>

<!-- このコンポーネントはUIを持たないメイン天気データフェッチ管理コンポーネント -->
