

<div class='paletteNode'>
    <button on:click={createPaletteImg} style="display: hidden" bind:this={getPaletteImgBtn}> preview</button>

    <div  bind:this={paletteNode}> 
        {#if imagePalette}
            <div class="rowContainer paletteHeader">
                <p>
                    Pixel color
                    <span>{numberOfColors} colors</span>
                </p>
                <p>
                    Embroidery floss color
                    <span>{numberOfMulineColors} colors</span>
                </p>
            </div>
                <div class='palette'>
                    {#each imagePalette as color, index}
                        <div class="rowContainer colorsContainer">
                            <div
                            class="colorTile"
                            style=" --tileColor: {color.colorHex}"/>
                            <p style="width: 70px">({color.colorHex})</p>
                            {#if !previousMulineColIsSame(color, index)}
                                <p>→ </p>
                                <div
                                class="colorTile"
                                style=" --tileColor: {color.muline.hex}"/>
                                <div
                                class="colorTile"
                                style=" --tileColor: {color.muline.hex}">
                                <img src="/images/icons/{color.icon}.png" alt="symbol for color {color.muline.hex}" class="icon {color.invertIcon ? 'inverted' : ''}">
                                </div>
                                <p>{color.muline.id}</p>
                                <!-- <p>({color.muline.hex})</p> -->
                            {/if}
                            
                        </div>
                        
                    {/each}
                </div>
            {:else}
                <Loading/>
            {/if}
    </div>
</div>


<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import { MULINE_TYPES } from "../../data/mulineData";
    import type { Palette } from "../../data/mulineData";
    import Loading from "../Loading.svelte";
    import { getPaletteImg, getPaletteBlob } from "./paletteUtils";
    

    export let fileName: string;
    export let imagePalette: Array<Palette> | null;

    let paletteNode: HTMLElement;
    let getPaletteImgBtn: HTMLElement;

    //TODO proper palette design for pattern
    

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
        setTimeout(() => {
            getPaletteImgBtn.click();
            console.log('click')
        }, 1000);
        
    })
    
</script>

<style>
    .colorTile {
        width: 30px;
        height: 30px;
        margin: 10px;
        border: 3px white solid;
        box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.3);
        background-color: var(--tileColor);
    }

    .paletteNode {
        position: fixed;
        top: 0;
        right: 0;
    }

    .icon {
        width: 30px;
        height: 30px;
    }

    .inverted {
        filter: invert(1);
    }

    .colorsContainer {
        gap: 0;
        margin: 0;
        padding: 0;
    }
    .colorsContainer p {
        padding: 2px;
    }

    .paletteHeader {
        margin: 8px;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 0px;
    }

    .paletteHeader span {
        font-size: 14px;
        font-weight: 500;
        text-transform: none;
    }
    .paletteHeader span::before {
        content: "\A";
        white-space: pre;
    }

    .palette {
        margin-top: 0px;
        border: 1px solid black;
    }
</style>