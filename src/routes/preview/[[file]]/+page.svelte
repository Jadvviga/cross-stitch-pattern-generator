{#if uploadedImage && !loadingImage} 
    <h1>Preview {fileName}</h1>

    <div transition:fade={{ delay: 250, duration: 300 }} class="container">
        <div class='columnContainer'
            style="height: {height}px">
            <div class="rowContainer buttons">
                <span class="btn">
                    <button class="back"
                    on:click={() => goto('/') }>GO BACK</button>
                </span>
                <span class="btn">
                    <button
                    bind:this={generatePatternButton}
                    disabled={loadingPalette}
                    title={loadingPalette ? "Wait for palette to load" : ""}
                    on:click={() => loadingPattern = true}> GENERATE PATTERN</button>
                </span>
                <span class="btn">
                    <button style="visibility: hidden;"></button>
                </span>
            </div>
           
            {#if imageWillBeSplit }
                <span class="note"> NOTE: Due to image's size, in PDF pattern will be split into parts for better printing</span>
            {/if}
            <img id="uploadedImg" src={uploadedImage} alt="preview"/>
            <p>{imgDimensions}</p>
        
        </div>
        <div bind:offsetHeight={paletteNodeHeight}>
            <PaletteSettings
                {fileName}
                bind:imagePalette
                on:paletteLoaded={() => loadingPalette = false}/>
        </div>
    </div>
    {#if loadingPattern}
        <div transition:fade={{ delay: 200, duration: 100 }} >
            <Palette
                {fileName}
                exportedImagePalette={imagePalette}
                on:paletteSaved={requestPatternGeneration}/>
        </div>
    {/if}
{:else}
    <Loading text="loading preview and palette..."/>
{/if}

{#if loadingPattern || skipPreview} 
    <div class="blocker" transition:fade={{ delay: 0, duration: 200 }}>
        <Loading text="generating pattern, please wait"/>
        
    </div>
{/if}

<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import PaletteSettings from '$src/components/PaletteSettings/PaletteSettings.svelte';
    import Loading from '$src/components/Loading.svelte'
    import { fade } from 'svelte/transition';
    import type { Palette as PaletteType} from '$lib/data/mulineData';
    import Palette from '$src/components/Palette/Palette.svelte';
    import { apiCall } from '$lib/request';


    let uploadedImage: any;
    let fileName: string;
    let loadingImage = true;
    let loadingPalette = true;
    let loadingPattern = false;
    let imgDimensions: string;
    let paletteNodeHeight: number;
    let height: number;
    let imagePalette: Array<PaletteType>;

    let skipPreview: boolean;
    let generatePatternButton: HTMLElement;

    $: imageWillBeSplit = checkForSplit(imgDimensions);


    $: if (generatePatternButton && imagePalette && skipPreview) {
        generatePatternButton.click();
    }

    function checkForSplit(imgDimensions: string): boolean {
        if (!imgDimensions) {
            return false;
        }
        const width = Number(imgDimensions.split(' x ')[0]);
        const height = Number(imgDimensions.split(' x ')[1]);
        return width >= 100 || height >= 100;
    }
    

    export let data;

    async function requestPatternGeneration() {
        const data: any = {};
        data["fileName"] = fileName;
        data["palette"] = imagePalette;
        await apiCall('/api/generatePattern', data).then(() => {
            goto(`/pattern/${fileName}`);
        })
    }



    onMount(() => {
        loadingImage = true;
        const storageFileName = sessionStorage.getItem('fileName');
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
        imgDimensions = sessionStorage.getItem('imageDimension') || '';
        skipPreview = sessionStorage.getItem('skipPreview') === "true";
        height = paletteNodeHeight;
        fileName = data.fileName;
        uploadedImage = `/images/upload/${data.fileName}/preview.png`;
        const loadImage = new Image();
        loadImage.onload = () => {
            loadingImage = false;
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

    .buttons {
        margin: 0;
        align-items: center;
        justify-content: space-between;
    }

    .btn {
        width: 128px;
    }

    .back {
        width: 70px;
    }

    .blocker {
        position: absolute;
        top: 0;
        right: 0;
        background-color: white;
        z-index: 99999;
        width: 100%;
        height: 100%;
        padding: 20px;
        text-align: center;
    }

    .note {
        margin-top: 10px;
        margin-bottom: 5px;
        border: 3px solid red;
        padding: 5px;
    }

</style>