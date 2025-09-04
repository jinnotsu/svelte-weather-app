<script lang="ts">
  export let updateTime: string = '';
</script>

{#if updateTime}
  <div class="text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
    <span class="material-symbols-outlined text-sm align-middle leading-none">database</span>
    <span>Source by tenki.jp 更新時刻: {updateTime}</span>
  </div>
{/if}
