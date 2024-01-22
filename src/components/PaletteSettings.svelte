<div>
    <MulineTypeSelector
        label={"Currently chosen palette (changing this will cause a refresh)"}
        {selectedMulineType}
        on:chnangedSelection={handleMulineChange}/>
    {#if imagePalette} 
        {#each imagePalette as color}
            <div>
                
            </div>
            <div
                class="colorTile"
                style=" --tileColor: {RGBA2String(color)}"/> 
                <div>{RGBA2String(color)}</div>
        {/each}
    {/if}
   
</div>

<script lang="ts">
    import { onMount } from "svelte";
    import MulineTypeSelector from "./MulineTypeSelector.svelte";
    import { MULINE_TYPES } from "../data/mulineData";

    export let fileName: string;
    let imagePalette: Array<number>;

    $: selectedMulineType = sessionStorage.getItem("mulineType") || MULINE_TYPES.Ariadna;
        
    function handleMulineChange(event: Event) {
        console.log(event)
    }

    function RGBA2String(color: RGBA) {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    }

    onMount(async () => {
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
        imagePalette = palette;
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
</style>