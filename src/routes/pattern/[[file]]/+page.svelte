{#if generatedPattern && !loading} 
<h1>Pattern</h1>

<div transition:fade={{ delay: 250, duration: 300 }} class="columnContainer">
   
    <img id="generatedPattern" src={generatedPattern} alt="generated pattern"/>
    <div class="rowContainer">
        <button
            on:click={() => goto(`/preview/${fileName}`)}>
            Go back to settings</button>
        <button
            on:click={() => goto('/')}>
            Pick new image</button>
        
    </div>
    
    
</div>
{:else}
    <Loading/>
{/if}




<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Loading from '../../../components/Loading.svelte';
    import { fade } from 'svelte/transition';


 
    let generatedPattern: any;
    let fileName: string;
    let loading = true;

    export let data;



    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
        fileName = data.fileName;
        generatedPattern = `/images/upload/${data.fileName}_pattern.png`;
        const loadImage = new Image();
        loadImage.onload = () => {
            loading = false;
        }
        let errorCount = 0;
        loadImage.onerror = () => {
            errorCount++;
            if (errorCount > 3) {
                goto('/');
            } else {    
                loadImage.src = generatedPattern;
            }

        }
        loadImage.src = generatedPattern;
    })
</script>


<style>

    #generatedPattern {
        margin-bottom: 10px;
        max-height: 70vh;
        box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.3);
    }


</style>