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
                    <div class="rowContainer">
                        <div class="splitGallery">
                            <div>
                                <Download type="image" imgSrc={generatedPatterns[0]} href={generatedPatterns[0]} downloadFileName="generatedPattern_1" imgAlt="generated pattern in color split in 4 - part 1" isSplitImg={true} />
                                <Download type="image" imgSrc={generatedPatterns[1]} href={generatedPatterns[1]} downloadFileName="generatedPattern_2" imgAlt="generated pattern in color split in 4 - part 2" isSplitImg={true} />
                            </div>
                            <div>
                                <Download type="image" imgSrc={generatedPatterns[2]} href={generatedPatterns[2]} downloadFileName="generatedPattern_3" imgAlt="generated pattern in color split in 4 - part 3" isSplitImg={true} />
                                <Download type="image" imgSrc={generatedPatterns[3]} href={generatedPatterns[3]} downloadFileName="generatedPattern_4" imgAlt="generated pattern in color split in 4 - part 4"  isSplitImg={true} />
                            
                            </div>
                        </div>

                        <div class="splitGallery">
                            <div>
                                <Download type="image" imgSrc={generatedPatternsBW[0]} href={generatedPatternsBW[0]} downloadFileName="generatedPatternBW_1" imgAlt="generated pattern in black and white split in 4 - part 1"  isSplitImg={true} />
                                <Download type="image" imgSrc={generatedPatternsBW[1]} href={generatedPatternsBW[1]} downloadFileName="generatedPatternBW_2" imgAlt="generated pattern in black and white split in 4 - part 2"  isSplitImg={true} />
                            </div>
                            <div>
                                <Download type="image" imgSrc={generatedPatternsBW[2]} href={generatedPatternsBW[2]} downloadFileName="generatedPatternBW_3" imgAlt="generated pattern in black and white split in 4 - part 3"  isSplitImg={true} />
                                <Download type="image" imgSrc={generatedPatternsBW[3]} href={generatedPatternsBW[3]} downloadFileName="generatedPatternBW_4" imgAlt="generated pattern in black and white split in 4 - part 4"  isSplitImg={true} />
                            </div>
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
    import Download from '../../../components/Download.svelte';
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

    let paletteWidth: number;


    export let data;

    $: hasSplitImages = generatedPatterns.length && generatedPatternBW.length;

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
        generatedPatternPDF = `/images/pattern/${data.fileName}_pattern.pdf`;
        generatedPatternZip = `/images/pattern/${data.fileName}_pattern_all.zip`;
        generatedPatternZipImgs = `/images/pattern/${data.fileName}_pattern_images.zip`;

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
    .splitGallery {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .scrollable {
        overflow: scroll;
        max-height: 60vh;
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