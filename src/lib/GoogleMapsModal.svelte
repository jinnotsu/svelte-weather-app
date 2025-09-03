<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import LocationInfo from './LocationInfo.svelte';
  import WeatherInfo from './WeatherInfo.svelte';
  import type { WikipediaInfo, WeatherData } from './types';

  export let show = false;
  export let selectedLocation = '';
  export let mapUrl = '';
  
  // Location Info props
  export let isLoadingWikipedia = false;
  export let wikipediaInfo: WikipediaInfo | null = null;
  export let wikipediaError = '';
  
  // Weather Info props  
  export let isLoadingWeather = false;
  export let currentWeatherData: WeatherData | null = null;
  export let weatherError = '';

  const dispatch = createEventDispatcher();

  function closeMap() {
    dispatch('close');
  }
</script>

{#if show && mapUrl}
  <div class="map-modal">
    <div class="map-container">
      <div class="map-header">
        <h3>🌍 {selectedLocation} の衛星ビュー</h3>
        <button class="close-button" on:click={closeMap}>✕</button>
      </div>
      <div class="map-content">
        <div class="map-wrapper">
          <iframe
            class="google-map"
            src={mapUrl}
            allowfullscreen
            title={`${selectedLocation}の地図`}
          ></iframe>
        </div>
        
        <!-- 情報サイドパネル -->
        <div class="info-panel">
          <LocationInfo 
            isLoading={isLoadingWikipedia}
            {wikipediaInfo}
            {wikipediaError}
          />
          
          <WeatherInfo 
            isLoading={isLoadingWeather}
            weatherData={currentWeatherData}
            {weatherError}
          />
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .map-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(0, 0, 30, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
    animation: spaceEntry 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  @keyframes spaceEntry {
    0% {
      opacity: 0;
      transform: scale(0.3);
      background: radial-gradient(circle at center, rgba(0, 0, 60, 1) 0%, rgba(0, 0, 0, 1) 100%);
    }
    50% {
      transform: scale(1.05);
      background: radial-gradient(circle at center, rgba(0, 0, 45, 0.98) 0%, rgba(0, 0, 0, 0.99) 100%);
    }
    100% {
      opacity: 1;
      transform: scale(1);
      background: radial-gradient(circle at center, rgba(0, 0, 30, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%);
    }
  }

  .map-container {
    background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    border-radius: 20px;
    max-width: 95vw;
    max-height: 95vh;
    width: 1000px;
    height: 700px;
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.5),
      0 0 100px rgba(100, 150, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(100, 150, 255, 0.3);
    animation: earthZoom 1.2s cubic-bezier(0.23, 1, 0.32, 1);
    transform-style: preserve-3d;
  }

  @keyframes earthZoom {
    0% {
      transform: scale(0.1) rotateX(90deg);
      opacity: 0;
      box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    }
    25% {
      transform: scale(0.5) rotateX(45deg);
      opacity: 0.7;
    }
    75% {
      transform: scale(1.02) rotateX(5deg);
      opacity: 0.95;
    }
    100% {
      transform: scale(1) rotateX(0deg);
      opacity: 1;
      box-shadow: 
        0 25px 50px rgba(0, 0, 0, 0.5),
        0 0 100px rgba(100, 150, 255, 0.2);
    }
  }

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }

  .map-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: headerShine 2s infinite;
  }

  @keyframes headerShine {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .map-header h3 {
    margin: 0;
    font-size: 1.3em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    z-index: 1;
    position: relative;
  }

  .close-button {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    z-index: 1;
    position: relative;
  }

  .close-button:hover {
    background: rgba(255, 100, 100, 0.3);
    border-color: rgba(255, 100, 100, 0.5);
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 5px 15px rgba(255, 100, 100, 0.3);
  }

  .map-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .map-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .info-panel {
    width: 350px;
    background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%);
    border-left: 1px solid rgba(100, 150, 255, 0.2);
    padding: 20px;
    overflow-y: auto;
    animation: slideIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  @keyframes slideIn {
    0% {
      transform: translateX(100%);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .google-map {
    width: 100%;
    height: 100%;
    border: none;
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    animation: mapReveal 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  @keyframes mapReveal {
    0% {
      transform: scale(0.8);
      opacity: 0;
      filter: blur(10px) brightness(0.3);
    }
    30% {
      transform: scale(0.9);
      opacity: 0.5;
      filter: blur(5px) brightness(0.6);
    }
    60% {
      transform: scale(1.01);
      opacity: 0.8;
      filter: blur(2px) brightness(0.9);
    }
    100% {
      transform: scale(1);
      opacity: 1;
      filter: blur(0) brightness(1);
    }
  }

  /* 宇宙背景効果 */
  .map-modal::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(2px 2px at 20px 30px, #eee, transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.6), transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.4), transparent),
      radial-gradient(2px 2px at 160px 30px, rgba(255,255,255,0.8), transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: starField 20s linear infinite;
    pointer-events: none;
    z-index: -1;
  }

  @keyframes starField {
    0% { transform: translateY(0); }
    100% { transform: translateY(-100px); }
  }
</style>
