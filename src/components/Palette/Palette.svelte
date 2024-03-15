

<div class='paletteNode'>
    <button on:click={createPaletteImg} style="display: hidden" bind:this={getPaletteImgBtn}> preview</button>
    <img bind:this={ogImageNode} src="/images/upload/{fileName}.png" alt=''>

    <div  bind:this={paletteNode}>
        {#key imagePalette} 
        {#if imagePalette}
            <div class='palette'>
                <div class="rowContainer colorsContainer legend">
                <div class="colorTile legend"  style="visibility: hidden"/>
                <div class="colorTile legend"  style="visibility: hidden"/>
                <div class="colorTile legend"  style="visibility: hidden"/>
                <p class="paletteTxt smalltxt legend">Color  </p>
                <p class="paletteTxt smalltxt legend">Number of crosses</p>
            </div>
                {#each imagePalette as color, index}
                <!-- TODO add second column if there are too much colors -->
                    <div class="rowContainer colorsContainer">

                        <!-- TODO add merging of same colors so this if will not be needed -->
                        {#if !previousMulineColIsSame(color, index)}
                            <div
                            class="colorTile"
                            style=" --tileColor: {color.muline.hex}">
                            <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon {color.invertIcon ? 'inverted' : ''}">
                            </div>
                            <div
                            class="colorTile"
                            style=" --tileColor: rgba(0, 0, 0, 0)">
                            <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon">
                            </div>
                            <div
                            class="colorTile"
                            style=" --tileColor: {color.muline.hex}"/>
                            <p class="paletteTxt">{color.muline.id}</p>
                            <p class="paletteTxt smalltxt">x {color.count}</p>
                            <!-- <p>({color.muline.hex})</p> -->
                        {/if}
                        
                    </div>
                    
                {/each}
            </div>
            
        {/if}
        {/key}
    </div>
</div>


<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { MULINE_TYPES } from "../../data/mulineData";
    import type { Palette } from "../../data/mulineData";
    import { getPaletteBlob, getPaletteCounts } from "./paletteUtils";
    

    export let fileName: string;
    export let exportedImagePalette: Array<Palette>;
    let imagePalette: Array<Palette>;

    let paletteNode: HTMLElement;
    let getPaletteImgBtn: HTMLElement;
    let ogImageNode: HTMLElement


    $: selectedMulineType = sessionStorage.getItem("mulineType") || MULINE_TYPES.Ariadna;
    $: numberOfColors = imagePalette?.length;
    $: numberOfMulineColors = getMulineCount(imagePalette);
        
    const dispatcher = createEventDispatcher();

    async function createPaletteImg() {
        let blob = await getPaletteBlob(paletteNode);
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = e => {
            savePaletteImage(e?.target?.result)
        };
    }

    async function savePaletteImage(imgBase64: any) {
        const data: any = {};
        const imgData = imgBase64.split(',');
        data["image"] = imgData[1];
        data["fileName"] = fileName;
        const response = await fetch(`/api/savePaletteImage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        await response.json();
        dispatcher('paletteSaved');
    };


    function compareByMuline(col1: Palette, col2: Palette ) {
        if ( col1.muline.id < col2.muline.id ){
            return -1;
        }
        if ( col1.muline.id > col2.muline.id ){
            return 1;
        }
        return 0;
    }

    function previousMulineColIsSame(color: Palette, index: number) {
        if (index === 0) {
            return false;
        }
        return color.muline.id === imagePalette[index - 1].muline.id;
    }

    function getMulineCount(palette: Array<Palette>): number {
        if (!palette) {
            return 0;
        }
        const colorsSet = new Set<string>;
        for(const color of palette) {
            colorsSet.add(color.muline.hex);
        }
        return colorsSet.size;
    }

    onMount(async () => {
        imagePalette = [ ...exportedImagePalette]
        setTimeout(async () => {
            imagePalette = await getPaletteCounts(ogImageNode, imagePalette);
            //imagePalette = mergeSameColors(imagePalette)
            // imagePalette?.sort(compareByMuline);  // todo with meging mybe wont be necessaey?
            
        }, 1000)
        
        // setTimeout(() => {
        //     getPaletteImgBtn.click();
        // }, 1000);
        
    })
    
</script>

<style>
    .colorTile {
        width: 64px;
        height: 64px;
        margin: 10px;
        border: 3px black solid;
        background-color: var(--tileColor);
    }
    .legend {
        font-size: 20px;
        height: 25px;
        margin-top: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
    }

    .paletteNode {
        position: fixed;
        top: 0;
        right: 0;
    }

    .icon {
        width: 64px;
        height: 64px;
    }

    .inverted {
        filter: invert(1);
    }
    
    .paletteTxt {
        font-size: 50px;
        margin: 0;
        padding: 0;
        text-align: center;
    }

    .smalltxt {
        font-size: 25px;
        margin-left: 10px;
    }

    .colorsContainer {
        gap: 0;
        margin: 5px;
        padding: 0;
    }
    .colorsContainer p {
        padding: 2px;
    }

    .palette {
        margin-top: 0px;
        padding: 10px;
        border: 1px solid black;
    }

</style>