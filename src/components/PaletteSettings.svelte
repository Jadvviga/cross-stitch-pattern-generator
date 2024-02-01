<div>
    <MulineTypeSelector
        label={"Currently chosen palette (changing this will cause a refresh)"}
        {selectedMulineType}
        on:changedSelection={handleMulineChange}/>
    <div>
        <label>
            <input type="checkbox" on:change={changePaletteSorting}>
            Sort by embroidery floss colors
        </label>
    </div>
   
    
        {#if imagePalette}
        <div class="rowContainer paletteHeader">
            <p>Pixel color</p>
            <p>Embroidery floss color</p>
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

<script lang="ts">
    import { onMount } from "svelte";
    import MulineTypeSelector from "./MulineTypeSelector.svelte";
    import { MULINE_TYPES } from "../data/mulineData";
    import type { Palette } from "../data/mulineData";
    import Loading from "./Loading.svelte";

    export let fileName: string;
    let imagePalette: Array<Palette> | null;
    let sortedByMuline = false;
    

    $: selectedMulineType = sessionStorage.getItem("mulineType") || MULINE_TYPES.Ariadna;
        
    async function handleMulineChange(event: Event | any) {
        const  { selected } = event.detail;
        sessionStorage.setItem("mulineType", selected);
        imagePalette = null;
        imagePalette = await requestPalette();
        imagePalette?.sort(sortedByMuline ? compareByMuline : compareByPixels);
    }
    
    function changePaletteSorting() {
        sortedByMuline = !sortedByMuline;
        imagePalette?.sort(sortedByMuline ? compareByMuline : compareByPixels);
        imagePalette = imagePalette;
    }

    // function RGBA2String(color: RGBA) {
    //     return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    // }

    function compareByMuline(col1: Palette, col2: Palette ) {
        if ( col1.muline.id < col2.muline.id ){
            return -1;
        }
        if ( col1.muline.id > col2.muline.id ){
            return 1;
        }
        return 0;
    }

    function compareByPixels(col1: Palette, col2: Palette ) {
        if ( col1.index < col2.index ){
            return -1;
        }
        if ( col1.index > col2.index ){
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

    .palette {
        margin-top: 0px;
        max-height: 70vh;
        overflow-y: scroll;
        box-shadow: inset gray 0px 0px 20px -12px; 
        border-radius: 10px;
    }
</style>