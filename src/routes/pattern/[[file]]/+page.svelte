{#if generatedPattern && !loading} 
    <h1>Pattern ready!</h1>
    <h2>Click on images to download them individually, or...</h2>

    <div transition:fade={{ delay: 250, duration: 300 }} class="columnContainer">
        <div class="rowContainer">
            <Download type="button" downloadText="Download PDF" href={generatedPatternPDF} downloadFileName="generatedPattern" />
            <Download type="button" downloadText="Download all images (in zip)" href={generatedPatternZipImgs} downloadFileName="generatedPattern" />
            <Download type="button" downloadText="Download All (in zip)" href={generatedPatternZip} downloadFileName="generatedPattern" />
        </div>
        
        
        <div class="rowContainer" style="margin: 0;">
            <div class="columnContainer {hasSplitImages ? 'scrollable' : ''}" bind:clientWidth={imagesScrollableBoxWidth}>
                {#if hasSplitImages}
                    <span style="width: {imagesScrollableBoxWidth}px; text-align: center;">(scroll for not split images)</span>
                {/if}
                <!-- Split Images-->
                {#if hasSplitImages}
                <div class="gridGalleryWrapper">
                    <div class="gridGallery" style="--splitCountX: {numOfSplitsX}; --splitCountY: {numOfSplitsY};">
                        {#each generatedPatterns as image, index}
                            <div class="gridGalleryItem">
                                <Download type="image" imgSrc={image} href={image} downloadFileName="generatedPattern_{index}" imgAlt="generated pattern in color split in {numOfSplitsX*numOfSplitsY} - part {index}" isSplitImg={true} />
                            </div>
                        {/each}
                    </div>
                    <div class="gridGallery" style="--splitCountX: {numOfSplitsX}; --splitCountY: {numOfSplitsY};">
                        {#each generatedPatternsBW as image, index}
                            <div class="gridGalleryItem">
                                <Download type="image" imgSrc={image} href={image} downloadFileName="generatedPattern_{index}" imgAlt="generated pattern in black and white split in {numOfSplitsX*numOfSplitsY} - part {index}" isSplitImg={true} />
                        
                            </div>
                        {/each}
                    </div>
                </div>
                {/if}
                <!-- Base images -->
                <div class="rowContainer">
                    <Download type="image" imgSrc={generatedPattern} href={generatedPattern} downloadFileName="generatedPattern" imgAlt="generated pattern in color" />
                    <Download type="image" imgSrc={generatedPatternBW} href={generatedPatternBW} downloadFileName="generatedPatternBW" imgAlt="generated pattern in black and white" />
                </div>
               
            </div>  
            <div class="paletteImage">
                <Download type="image" imgSrc={generatedPatternPalette} href={generatedPatternPalette} downloadFileName="generatedPatternPalette" imgAlt="generated pattern's palette" />
            </div>
           
        </div>
         
        
    
        <div class="rowContainer">
            {#if !skipPreview} 
                <button on:click={() => goto(`/preview/${fileName}`)}>
                    Go back to settings
                </button>
            {/if}
           
            <button on:click={() => goto('/')}>
                Pick new image
            </button>
            
        </div>
        
        
    </div>
{:else}
    <Loading text="generating pattern, please wait"/>
{/if}


<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import Loading from '$components/Loading.svelte';
    import Download from '$components/Download.svelte';
    import { fade } from 'svelte/transition';


    let generatedPattern: string;
    let generatedPatterns: Array<string> = [];
    let generatedPatternBW: string;
    let generatedPatternsBW: Array<string> = [];
    let generatedPatternPalette: string;
    let generatedPatternPDF: string;
    let generatedPatternZipImgs: string;
    let generatedPatternZip: string;


    let fileName: string;
    let loading = true;
    let imagesScrollableBoxWidth: number;

    let skipPreview: boolean;

    let numOfSplitsX = 0;
    let numOfSplitsY = 0;


    export let data;

    $: hasSplitImages = generatedPatterns.length && generatedPatternBW.length;

    function checkForSplit(imgDimensions: string): boolean {
        if (!imgDimensions) {
            return false;
        }
        const width = Number(imgDimensions.split(' x ')[0]);
        const height = Number(imgDimensions.split(' x ')[1]);
        const THRESHOLD_SPLIT = 60
        if (width >= 60 || height >= 60) {
            numOfSplitsX = Math.floor(width/THRESHOLD_SPLIT) + (width%THRESHOLD_SPLIT === 0 ? 0 : 1);
            numOfSplitsY = Math.floor(height/THRESHOLD_SPLIT) + (height%THRESHOLD_SPLIT === 0 ? 0 : 1);
            return true
        }
      
        return false;
    }



    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        skipPreview = sessionStorage.getItem('skipPreview') === "true";
        
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
        fileName = data.fileName;

        const imgDimensions = sessionStorage.getItem('imageDimension') || '';
        if (checkForSplit(imgDimensions)) {
            for(let i=1;i<=numOfSplitsX*numOfSplitsY;i++) {
                generatedPatterns.push(`/images/pattern/${data.fileName}/pattern_${i}.png`);
                generatedPatternsBW.push(`/images/pattern/${data.fileName}/pattern_bw_${i}.png`);
            }
        }

        
        generatedPattern = `/images/pattern/${data.fileName}/pattern_0.png`;
        generatedPatternBW = `/images/pattern/${data.fileName}/pattern_bw_0.png`;
        generatedPatternPalette = `/images/pattern/${data.fileName}/pattern_palette.png`;
        generatedPatternPDF = `/images/pattern/${data.fileName}/pattern.pdf`;
        generatedPatternZip = `/images/pattern/${data.fileName}/pattern_all.zip`;
        generatedPatternZipImgs = `/images/pattern/${data.fileName}/pattern_images.zip`;

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

    .gridGalleryWrapper {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(1, 1fr);
    }

    .gridGallery {
        margin: 0;
        margin-right: 20px;
        display: grid;
        overflow: auto;
        grid-template-columns: repeat(var(--splitCountX), calc(100% / var(--splitCountX)));
        grid-template-rows: repeat(var(--splitCountY), calc(100% / var(--splitCountY)));
    }

    .gridGalleryItem {
        text-align: center;
    }

    .scrollable {
        overflow: scroll;
        max-height: 60vh;
        max-width: 70vw;
        box-shadow: inset gray 0px 0px 20px -12px;
    }

    h2 {
        margin: 0;
    }

    .paletteImage {
        max-width: 30vw;
        overflow: scroll;
        padding: 10px;
    }

</style>