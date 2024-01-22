<div>
    <MulineTypeSelector
        label={"Currently chosen palette (changing this will cause a refresh)"}
        {selectedMulineType}
        on:changedSelection={handleMulineChange}/>
    {#if imagePalette} 
        {#each imagePalette as color}
            <div class="rowContainer colorsContainer">
                <div
                class="colorTile"
                style=" --tileColor: {RGBA2String(color)}"/> 
                <div>{RGBA2String(color)}</div>
            </div>
            
        {/each}
    {:else}
        Loading palette...
    {/if}
   
</div>

<script lang="ts">
    import { onMount } from "svelte";
    import MulineTypeSelector from "./MulineTypeSelector.svelte";
    import { MULINE_TYPES } from "../data/mulineData";

    export let fileName: string;
    let imagePalette: Array<number> | null;

    $: selectedMulineType = sessionStorage.getItem("mulineType") || MULINE_TYPES.Ariadna;
        
    async function handleMulineChange(event: Event | any) {
        const  { selected } = event.detail;
        sessionStorage.setItem("mulineType", selected);
        imagePalette = null;
        imagePalette = await requestPalette();
    }

    function RGBA2String(color: RGBA) {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
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
        //console.log(imagePalette)
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

    .colorsContainer {
        gap: 0;
        margin: 0;
        padding: 0;
    }
</style>