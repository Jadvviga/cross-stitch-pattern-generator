<div class='paletteNode'>
    <button on:click={createPaletteImg} style="display: hidden" bind:this={getPaletteImgBtn}> preview</button>
    <img bind:this={ogImageNode} src="/images/upload/{fileName}.png" alt=''>

    <div  bind:this={paletteNode} style="background-color: white;">
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
                            <div class="colorTile" style=" --tileColor: {color.muline.hex}">
                                <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon {color.invertIcon ? 'inverted' : ''}">
                            </div>
                            <div class="colorTile" style=" --tileColor: rgba(0, 0, 0, 0)">
                                <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon">
                            </div>
                            <div class="colorTile"  style=" --tileColor: {color.muline.hex}"/>
                            <p class="paletteTxt">{color.muline.id}</p>
                            <p class="paletteTxt smalltxt">x {color.count}</p>
                            
                            
                        </div>
                        
                    {/each}
                </div>
                
            {/if}
        {/key}
    </div>
</div>


<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { Palette } from "../../data/mulineData";
    import { getPaletteBlob, getPaletteCounts } from "./paletteUtils";
    

    export let fileName: string;
    export let exportedImagePalette: Array<Palette>;
    let imagePalette: Array<Palette>;

    let paletteNode: HTMLElement;
    let getPaletteImgBtn: HTMLElement;
    let ogImageNode: HTMLElement
        
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
            getPaletteImgBtn.click();
            
        }, 1000)
        
       
        
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
    }

</style>