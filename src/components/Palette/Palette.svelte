

<div class='paletteNode'>
    <button on:click={createPaletteImg} style="display: hidden" bind:this={getPaletteImgBtn}> preview</button>

    <div  bind:this={paletteNode}> 
        {#if imagePalette}
            <div class='palette'>
                {#each imagePalette as color, index}
                <!-- TODO add second column if there are too much colors -->
                    <div class="rowContainer colorsContainer">
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
                            <!-- <p>({color.muline.hex})</p> -->
                        {/if}
                        
                    </div>
                    
                {/each}
            </div>
            
        {/if}
    </div>
</div>


<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { MULINE_TYPES } from "../../data/mulineData";
    import type { Palette } from "../../data/mulineData";
    import { getPaletteBlob } from "./paletteUtils";
    

    export let fileName: string;
    export let imagePalette: Array<Palette> | null;

    let paletteNode: HTMLElement;
    let getPaletteImgBtn: HTMLElement;
    

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


    async function requestPalette() {
        const data: any = {};
        data["fileName"] = fileName;
        data["mulineType"] = selectedMulineType;
        const response = await fetch(`/api/getPalette`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
       
        const { palette } = await response.json();
        return palette;
    }

    onMount(async () => {
        imagePalette = await requestPalette();
        imagePalette?.sort(compareByMuline);
        imagePalette = imagePalette;
        setTimeout(() => {
            getPaletteImgBtn.click();
        }, 1000);
        
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