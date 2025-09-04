import { writable, derived } from 'svelte/store';
import type { WeatherRankingItem } from '../types';

// 基本的な状態の管理
export const weatherData = writable<WeatherRankingItem[]>([]);
export const isLoading = writable<boolean>(true);
export const errorMessage = writable<string>('');
export const statusMessage = writable<string>('');
export const updateTime = writable<string>('');

// 選択されたアイテムの管理
export const selectedItem = writable<WeatherRankingItem | null>(null);
export const showDetailPanel = writable<boolean>(false);

// AI説明文の管理
export const currentDescription = writable<string>('');
export const isLoadingDescription = writable<boolean>(false);

// 地図URL
export const mapUrl = writable<string>('');

// 都市天気データ
export const cityWeatherData = writable<Record<string, {temp: number, humidity: number}>>({
  '東京': { temp: 35, humidity: 80 },
  '大阪': { temp: 36, humidity: 82 },
  '福岡': { temp: 34, humidity: 78 }
});
export const isLoadingCityWeather = writable<boolean>(false);

// 派生ストア：データが準備完了かどうか
export const isDataReady = derived(
  [isLoading, errorMessage],
  ([$isLoading, $errorMessage]) => !$isLoading && !$errorMessage
);

// アクション関数：weatherDataの更新
export function updateWeatherData(data: WeatherRankingItem[]) {
  weatherData.set(data);
}

// アクション関数：選択されたアイテムの湿度を更新
export function updateSelectedItemHumidity(humidity: number) {
  selectedItem.update(item => {
    if (item) {
      return { ...item, humidity };
    }
    return item;
  });
  
  // weatherData内の該当アイテムも更新
  weatherData.update(data => 
    data.map(dataItem => {
      selectedItem.subscribe(selected => {
        if (selected && dataItem.rank === selected.rank) {
          dataItem.humidity = humidity;
        }
      })();
      return dataItem;
    })
  );
}

// アクション関数：エラー状態のリセット
export function resetError() {
  errorMessage.set('');
}

// アクション関数：ローディング状態の設定
export function setLoading(loading: boolean) {
  isLoading.set(loading);
}
