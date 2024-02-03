{#if uploadedImage && !loading} 
<h1>Preview</h1>

<div transition:fade={{ delay: 250, duration: 300 }} class="container">
    <div class='columnContainer'
         style="height: {height}px">
         <button
            on:click={requestPatternGeneration}> GENERATE PATTERN</button>
        {#if loadingPattern}
            <Loading/>
        {/if}
        <img id="uploadedImg" src={uploadedImage} alt="avatar"/>
        <p>{imgDimensions}</p>
       
    </div>
    
   

    <div bind:offsetHeight={paletteNodeHeight}>
        <PaletteSettings
            {fileName}
            bind:imagePalette/>
    </div>
    
</div>
{:else}
    <Loading/>
{/if}




<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import PaletteSettings from '../../../components/PaletteSettings.svelte';
    import Loading from '../../../components/Loading.svelte';
    import { fade } from 'svelte/transition';
    import type { Palette } from '../../../data/mulineData';


 
    let uploadedImage: any;
    let fileName: string;
    let loading = true;
    let loadingPattern = false;
    let imgDimensions: string;
    let paletteNodeHeight: number;
    let height: number;
    let imagePalette: Array<Palette>;
    

    export let data;

    async function requestPatternGeneration() {
        loadingPattern = true;
        const data: any = {};
        data["fileName"] = fileName;
        data["palette"] = imagePalette;
        const response = await fetch('/api/generatePattern', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        const dimensions =  await response.json();
        
        goto(`/pattern/${fileName}`);
    }



    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
        imgDimensions = sessionStorage.getItem('imageDimension') || '';
        height = paletteNodeHeight;
        fileName = data.fileName;
        uploadedImage = `/images/upload/${data.fileName}_preview.png`;
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
                loadImage.src = uploadedImage;
            }

        }
        loadImage.src = uploadedImage;
        
    })
</script>


<style>
    .container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin: auto;
        gap: 20px;
    }


    .container p {
        margin: 0
    }

    #uploadedImg {
        margin-bottom: 10px;
        max-width: 600px;
        max-height: 70vh;
    }

    button {
        position: relative;
        bottom: 60px;
    }

</style>