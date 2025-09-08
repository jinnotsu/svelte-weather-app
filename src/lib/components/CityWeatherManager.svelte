<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { WeatherDataService } from '../services/WeatherDataService';
  import { cityWeatherData, isLoadingCityWeather } from '../stores/weatherStore';
  
  export let weatherDataService: WeatherDataService;
  
  const dispatch = createEventDispatcher();

  // 都市の天気データを取得する関数
  async function fetchCityWeatherData() {
    isLoadingCityWeather.set(true);
    
    try {
      const { cityData } = await weatherDataService.fetchWeatherRanking(20);
      
      // humidityがundefinedの場合は0に設定してストアを更新
      cityWeatherData.update(current => ({
        ...current,
        ...Object.fromEntries(
          Object.entries(cityData).map(([city, data]) => [
            city,
            { temp: data.temp, humidity: data.humidity ?? 0 }
          ])
        )
      }));
      
      // 親コンポーネントにデータを送信
      cityWeatherData.subscribe(data => dispatch('cityWeatherUpdate', data))();
    } catch (error) {
      console.error('都市天気データ取得エラー:', error);
    } finally {
      isLoadingCityWeather.set(false);
    }
  }

  // エクスポートして親から呼び出せるようにする
  export { fetchCityWeatherData };

  onMount(() => {
    // 初期化時に都市天気データを取得
    fetchCityWeatherData();
  });
</script>

<!-- このコンポーネントはUIを持たない都市天気データ管理コンポーネント -->
