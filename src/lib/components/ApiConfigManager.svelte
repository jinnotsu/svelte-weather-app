<script lang="ts">
  import { onMount } from 'svelte';
  import { errorMessage } from '../stores/weatherStore';
  
  export let googleMapsApiKey: string;
  export let googleAiApiKey: string;
  export let openWeatherApiKey: string;

  // API キーの検証
  onMount(() => {
    if (!googleAiApiKey) {
      errorMessage.set('Google AI API key is not configured. Please set VITE_GOOGLE_AI_API_KEY in your environment variables.');
      return;
    }
    
    if (!googleMapsApiKey) {
      console.warn('Google Maps API key is not configured. Map functionality may be limited.');
    }
    
    if (!openWeatherApiKey) {
      console.warn('OpenWeather API key is not configured. Weather data functionality may be limited.');
    }
  });
</script>

<!-- このコンポーネントはUIを持たない設定管理コンポーネント -->
