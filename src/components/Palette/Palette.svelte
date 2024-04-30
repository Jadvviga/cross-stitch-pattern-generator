<div class='paletteNode'>
    <button on:click={createPaletteImg} style="display: hidden" bind:this={getPaletteImgBtn}> preview</button>
    <img bind:this={ogImageNode} src="/images/upload/{fileName}/{fileName}.png" alt=''>

    <div  bind:this={paletteNode} style="background-color: white;">
        {#key imagePalette} 
            {#if imagePalette}
                <table class='palette'>
                    <tr class="colorsContainer legend">
                        <th class="colorTile legend" style="visibility: hidden"></th>
                        <th class="colorTile legend" style="visibility: hidden"></th>
                        <th class="colorTile legend" style="visibility: hidden"></th>
                        <th class="paletteTxt legend">Color</th>
                        <th class="paletteTxt legend">Number of crosses</th>
                        {#if paletteIsBig}
                        <!-- twice of header if the palette is more then 10 colors -->
                        <th class="colorTile legend" style="visibility: hidden"></th>
                        <th class="colorTile legend" style="visibility: hidden"></th>
                        <th class="colorTile legend" style="visibility: hidden"></th>
                        <th class="paletteTxt legend">Color</th>
                        <th class="paletteTxt legend">Number of crosses</th>
                        {/if}
                    </tr>
                    {#each paletteToProcess as color, index}
                    <tr>
                        <td>
                            <div class="colorTile" style=" --tileColor: {color.muline.hex}">
                                <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon {color.invertIcon ? 'inverted' : ''}">
                            </div>
                        </td>
                        <td>
                            <div class="colorTile" style=" --tileColor: rgba(0, 0, 0, 0)">
                                <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon">
                            </div>
                        </td>
                        <td> 
                            <div class="colorTile"  style=" --tileColor: {color.muline.hex}"/></td>
                        <td> 
                            <p>{color.muline.id}</p>
                        </td>
                        <td> 
                            <p >x {color.count}</p>
                        </td>
                        {#if secondHalfOfPalette && secondHalfOfPalette[index]}
                        <td>
                            <div class="colorTile" style=" --tileColor: {secondHalfOfPalette[index].muline.hex}">
                                <img src="/images/icons/{secondHalfOfPalette[index].icon}.png" alt="symbol for color {secondHalfOfPalette[index].muline.hex}" class="icon {secondHalfOfPalette[index].invertIcon ? 'inverted' : ''}">
                            </div>
                        </td>
                        <td>
                            <div class="colorTile" style=" --tileColor: rgba(0, 0, 0, 0)">
                                <img src="/images/icons/{secondHalfOfPalette[index].icon}.png" alt="symbol for color {secondHalfOfPalette[index].muline.hex}" class="icon">
                            </div>
                        </td>
                        <td> 
                            <div class="colorTile"  style=" --tileColor: {secondHalfOfPalette[index].muline.hex}"/></td>
                        <td> 
                            <p>{secondHalfOfPalette[index].muline.id}</p>
                        </td>
                        <td> 
                            <p >x {secondHalfOfPalette[index].count}</p>
                        </td>
                        {/if}
                    </tr>
                    {/each}
                </table> 
            {/if}
        {/key}
    </div>
</div>


<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { Palette } from "../../data/mulineData";
    import { getPaletteBlob, getPaletteCounts } from "./paletteUtils";
    import { apiCall } from "../../request";
    

    export let fileName: string;
    export let exportedImagePalette: Array<Palette>;
    let imagePalette: Array<Palette>;

    let paletteNode: HTMLElement;
    let getPaletteImgBtn: HTMLElement;
    let ogImageNode: HTMLElement
        
    const dispatcher = createEventDispatcher();

    let paletteIsBig = false
    $: paletteToProcess = paletteIsBig ? imagePalette?.slice(0, imagePalette.length/2 + 1) : imagePalette;
    $: secondHalfOfPalette = paletteIsBig ? imagePalette?.slice(imagePalette.length/2 + 1, imagePalette.length) : undefined;

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
        await apiCall('/api/savePaletteImage', data).then(() => {
            dispatcher('paletteSaved');
        });
        
    };


    function mergeSameColors(imgPalette: Array<Palette>): Array<Palette> {
        let palette = [...imgPalette];
        for (let i = 0; i < palette.length; i ++) {
            const currentColor = palette[i];
            const found = imgPalette.filter(col => col.muline.id === currentColor.muline.id);
            if (found.length > 1) {
                for (const foundColor of found) {
                    if (foundColor.index !== currentColor.index) {
                        palette[i].count += foundColor.count;
                        palette = palette.filter(c => c.index !== foundColor.index);
                    }
                }
            }

        }
        return palette;
        
    }

    onMount(async () => {
        imagePalette = [ ...exportedImagePalette]
        setTimeout(async () => {
            imagePalette = await getPaletteCounts(ogImageNode, imagePalette);
            imagePalette = mergeSameColors(imagePalette);
            paletteIsBig = imagePalette.length > 10;
            getPaletteImgBtn.click();
            
        }, 1000)
        
       
        
    })
    
</script>

<style>
    .colorTile {
        width: 64px;
        height: 64px;
        margin: 5px;
        border: 3px black solid;
        background-color: var(--tileColor);
    }
    .legend {
        font-size: 15px;
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
        font-size: 15px;
        margin: 0;
        padding: 0;
        text-align: center;
        max-width: 64px;
    }

    .colorsContainer {
        gap: 0;
        margin: 5px;
        padding: 0;
    }


    .palette {
        margin-top: 0px;
        padding: 10px;
    }

    td {
        padding: 0 10px;
    }

    td p {
        font-size: 25px;
    }

</style>