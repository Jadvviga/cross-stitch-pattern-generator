{#if generatedPattern && !loading} 
    <h1>Pattern ready!</h1>
    <h2>Click on images to download them individually, or...</h2>

    <div transition:fade={{ delay: 250, duration: 300 }} class="columnContainer">
        <div class="rowContainer">
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
        
        
        <div class="rowContainer" style="margin: 0;">
            <div class="columnContainer scrollable" bind:clientWidth={imagesScrollableBoxWidth}>
                {#if generatedPatterns.length && generatedPatternBW.length}
                    <span style="width: {imagesScrollableBoxWidth}px; text-align: center;">(scroll for split images)</span>
                {/if}
                <!-- Base images -->
                <div class="rowContainer">
                    <img class="generatedPattern" src={generatedPattern} alt="generated pattern" title="Click to download"/>
                    <img class="generatedPattern" src={generatedPatternBW} alt="generated pattern in black and white" title="Click to download"/>
                </div>
                <!-- Split -->
                {#if generatedPatterns.length && generatedPatternBW.length}
                    <div class="rowContainer">
                        <div class="splitGallery">
                            <div>
                                <img class="generatedPattern splitPattern" src={generatedPatterns[0]} alt="generated pattern" title="Click to download"/>
                                <img class="generatedPattern splitPattern" src={generatedPatterns[1]} alt="generated pattern" title="Click to download"/>
                            </div>
                            <div>
                                <img class="generatedPattern splitPattern" src={generatedPatterns[2]} alt="generated pattern" title="Click to download"/>
                                <img class="generatedPattern splitPattern" src={generatedPatterns[3]} alt="generated pattern" title="Click to download"/>
                            </div>
                        </div>

                        <div class="splitGallery">
                            <div>
                                <img class="generatedPattern splitPattern" src={generatedPatternsBW[0]} alt="generated pattern" title="Click to download"/>
                                <img class="generatedPattern splitPattern" src={generatedPatternsBW[1]} alt="generated pattern" title="Click to download"/>
                            </div>
                            <div>
                                <img class="generatedPattern splitPattern" src={generatedPatternsBW[2]} alt="generated pattern" title="Click to download"/>
                                <img class="generatedPattern splitPattern" src={generatedPatternsBW[3]} alt="generated pattern" title="Click to download"/>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
        
            
            
            <img class="generatedPattern" src={generatedPatternPalette} alt="generated pattern's palette" title="Click to download"/>
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


    let generatedPattern: string;
    let generatedPatterns: Array<string> = [];
    let generatedPatternBW: string;
    let generatedPatternsBW: Array<string> = [];
    let generatedPatternPalette: string;
    let fileName: string;
    let loading = true;
    let imagesScrollableBoxWidth: number;

    let downloadSrc = '/download.png';

    export let data;

    $: console.log(imagesScrollableBoxWidth)

    $: scrollCaptionWidth = imagesScrollableBoxWidth;

    function checkForSplit(imgDimensions: string): boolean {
        if (!imgDimensions) {
            return false;
        }
        const width = Number(imgDimensions.split(' x ')[0]);
        const height = Number(imgDimensions.split(' x ')[1]);
        return width >= 100 || height >= 100;
    }



    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
        fileName = data.fileName;

        const imgDimensions = sessionStorage.getItem('imageDimension') || '';
        if (checkForSplit(imgDimensions)) {
            for(let i=1;i<=4;i++) {
                generatedPatterns.push(`/images/pattern/${data.fileName}_pattern_${i}.png`);
                generatedPatternsBW.push(`/images/pattern/${data.fileName}_pattern_bw_${i}.png`);
            }
        }

        
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
        padding: 10px;
        box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.3);
    }

    .splitPattern {
        max-height: 25vh;
        margin: 0;
        padding: 0;
    }


    .splitGallery {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .splitGallery img {
        margin: 0 3px 3px 0;
    }

    .scrollable {
        overflow: scroll;
        max-height: 60vh;
        box-shadow: inset gray 0px 0px 20px -12px
    }

    h2 {
        margin: 0;
    }

    img {
        cursor: pointer;
    }

    img:hover {
        transform: scale(1.075);
        
    }

    .icon {
        width: 32px;
        height: 32px;
        filter: invert(100%);
    }
    .downloadBtn {
        width: auto;
        height: 50px;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 15px;
        
    }

    .downloadBtn .icon {
        padding: 10px;
    }
    .downloadBtn span {
        padding: 10px;
    }


    .downloadBtn:hover .icon {
        filter: invert(0);
    }

    a {
        text-decoration: none;
    }




</style>