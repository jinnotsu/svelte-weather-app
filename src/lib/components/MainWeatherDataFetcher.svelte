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
      statusMessage.set('気温データを取得中...');
      
      const response = await fetch('/api/tenki/amedas/ranking/low-temp.html');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      statusMessage.set('データを解析中...');
      
      const rankings = weatherDataService.parseWeatherData(html);
      const parsedUpdateTime = weatherDataService.parseUpdateTime(html);
      
      if (parsedUpdateTime) {
        updateTime.set(parsedUpdateTime);
      }
      
      if (rankings.length > 0) {
        rankings.sort((a, b) => a.rank - b.rank);
        const limitedData = rankings.slice(0, 20);
        updateWeatherData(limitedData);
        statusMessage.set(`${rankings.length}件のデータを取得しました`);
      } else {
        // モックデータを使用
        const mockData = weatherDataService.getMockWeatherData();
        updateWeatherData(mockData);
        statusMessage.set('モックデータを表示中（データ解析に失敗）');
      }
      
    } catch (error) {
      errorMessage.set(`エラー: ${error instanceof Error ? error.message : String(error)}`);
      statusMessage.set('データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  onMount(() => {
    fetchMainWeatherData();
  });
</script>

<!-- このコンポーネントはUIを持たないメイン天気データフェッチ管理コンポーネント -->
