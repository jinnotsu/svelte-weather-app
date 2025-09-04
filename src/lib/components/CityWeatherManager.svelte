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
      const result = await weatherDataService.fetchCityWeatherData();
      cityWeatherData.update(current => ({ ...current, ...result }));
      
      // 親コンポーネントにデータを送信
      cityWeatherData.subscribe(data => {
        dispatch('cityWeatherUpdate', data);
      })();
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
