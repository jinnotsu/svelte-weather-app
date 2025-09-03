<script lang="ts">
  import type { WikipediaInfo } from './types';

  export let isLoading = false;
  export let wikipediaInfo: WikipediaInfo | null = null;
  export let wikipediaError = '';
</script>

<div class="mb-5">
  {#if isLoading}
    <div class="text-center p-5 text-gray-500 italic">
      <p>🤖 Google Gemini AIで情報を生成中...</p>
      <small class="text-xs">AIがこの地点の魅力を分析して紹介文を作成しています...</small>
    </div>
  {/if}
  
  {#if wikipediaInfo}
    <div class="animate-fade-in">
      {#if wikipediaInfo.foundVia}
        <div class="bg-blue-50 p-2 rounded border-l-4 border-blue-400 mb-3">
          <small class="text-gray-600 italic text-sm">🤖 {wikipediaInfo.foundVia}</small>
        </div>
      {/if}
      <p class="text-gray-700 leading-relaxed mb-4 text-sm">{wikipediaInfo.extract}</p>
      <a 
        href={wikipediaInfo.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        class="inline-block bg-blue-600 text-white no-underline py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 shadow-md hover:-translate-y-1 hover:shadow-lg hover:bg-blue-700"
      >
        詳しく検索する →
      </a>
    </div>
  {/if}
  
  {#if wikipediaError}
    <div class="text-center p-4 text-red-600 bg-red-50 rounded-md border-l-4 border-red-500">
      <p>❌ {wikipediaError}</p>
    </div>
  {/if}
</div>


