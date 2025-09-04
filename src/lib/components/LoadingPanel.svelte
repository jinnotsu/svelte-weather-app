<script lang="ts">
  export let isLoading: boolean = false;
  export let errorMessage: string = '';
</script>

{#if isLoading}
  <div class="main-panel-bg bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 text-center">
    <p class="text-slate-600 dark:text-slate-400">📡 データを読み込み中...</p>
  </div>
{:else if errorMessage}
  <div class="main-panel-bg bg-red-50/70 dark:bg-red-900/70 border border-red-200 dark:border-red-700 rounded-2xl shadow-lg p-6">
    <p class="text-red-700 dark:text-red-300">❌ {errorMessage}</p>
  </div>
{/if}
