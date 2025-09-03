<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  interface Props {
    item: {
      rank: number;
      region: string;
      city: string;
      temp: number;
    };
  }

  let { item }: Props = $props();
  
  const dispatch = createEventDispatcher();
  
  function handleLocationClick() {
    dispatch('locationClick', {
      region: item.region,
      city: item.city
    });
  }
</script>

<div class="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200 transition-all duration-300 hover:bg-blue-50 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300">
  <span class="font-bold text-blue-600 min-w-12 text-lg">#{item.rank}</span>
  <button 
    class="flex-1 font-medium text-blue-600 mx-4 cursor-pointer underline text-left p-2 rounded-md transition-all duration-300 hover:text-white hover:bg-blue-600 hover:no-underline hover:shadow-md active:scale-95" 
    onclick={handleLocationClick}
  >
    {item.city} ({item.region})
  </button>
  <span class="font-bold text-teal-600 text-xl min-w-20 text-right">{item.temp}°C</span>
</div>


