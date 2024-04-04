{#if generatedPattern && !loading} 
    <h1>Pattern ready!</h1>
    <h2>Click on images to download them individually, or...</h2>

    <div transition:fade={{ delay: 250, duration: 300 }} class="columnContainer">
        <div class="rowContainer" style="margin: 0;">
            <div class="rowContainer">
                <img class="generatedPattern" src={generatedPattern} alt="generated pattern" title="Click to download"/>
                <img class="generatedPattern" src={generatedPatternBW} alt="generated pattern in black and white" title="Click to download"/>
                <img class="generatedPattern" src={generatedPatternPalette} alt="generated pattern's palette" title="Click to download"/>
            </div>
            <div class="columnContainer">
                <a href={generatedPattern} download="generatedPattern">
                    <button class="downloadBtn">
                        <img class="icon" src={downloadSrc} alt="download icon">
                        <span>Download PDF</span>
                    </button>
                </a>
                
                <a href={generatedPattern} download="generatedPattern">
                    <button class="downloadBtn">
                        <img class="icon" src={downloadSrc} alt="download icon">
                        <span>Download all images (in zip)</span>
                    </button>
                </a>
                
                
                <a href={generatedPattern} download="generatedPattern">
                    <button class="downloadBtn">
                        <img class="icon" src={downloadSrc} alt="download icon">
                        <span>Download All (in zip)</span>
                    </button>
                </a>
                

            </div>
        </div>
        
    
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
    <Loading text="generating pattern, please wait"/>
{/if}


<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Loading from '../../../components/Loading.svelte';
    import { fade } from 'svelte/transition';


    let generatedPattern: any;
    let generatedPatternBW: any;
    let generatedPatternPalette: any;
    let fileName: string;
    let loading = true;

    let downloadSrc = '/download.png';

    export let data;



    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }


        //TODO addd download
        fileName = data.fileName;
        generatedPattern = `/images/pattern/${data.fileName}_pattern_0.png`;
        generatedPatternBW = `/images/pattern/${data.fileName}_pattern_bw_0.png`;
        generatedPatternPalette = `/images/pattern/${data.fileName}_pattern_palette.png`;

        //making sure image is loaded
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

    .generatedPattern {
        margin-bottom: 10px;
        max-height: 50vh;
        box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.3);
    }

    h2 {
        margin: 0;
    }

    img {
        cursor: pointer;
    }

    img:hover {
        transform: scale(1.1);
        
    }

    .icon {
        width: 32px;
        height: 32px;
        filter: invert(100%);
    }
    .downloadBtn {
        width: 150px;
        height: auto;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 10px;
        
    }
    .downloadBtn:hover .icon {
        filter: invert(0);
    }

    a {
        text-decoration: none;
    }


</style>