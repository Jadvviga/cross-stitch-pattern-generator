<div>
    <p>page not found</p>
    {#if rand !== undefined} 
        <img
         transition:fade={{ delay: 250, duration: 300 }}
         src="/images/404/{ rand }.png" alt="404">
    {/if}
    
</div>

<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    let rand: number;

    onMount(() => {
        rand = Math.floor(Math.random() * 4);
    });
</script>
  
<style>
    div {
        text-align: center;
    }
    img {
        width: auto;
        height: 90vh;
    }
</style>

