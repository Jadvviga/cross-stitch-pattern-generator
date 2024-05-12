<div class="mulinePicker" class:visible={show}>

    {#if mulinePalette}
    <div class="tilesContainer">
            {#each mulinePalette as color}
            <div class="tile">
                <ColorTile
                    {color}
                    clickable={true}/>
                <span class="label">{color.id}</span>
            </div>
                
            {/each}
        </div>
    {/if}
   
</div>

<script lang="ts">
    import { MULINE_TYPES, getMulinePalette, type MulineData} from "../../data/mulineData";
    import { onMount } from 'svelte';
    import ColorTile from "../ColorTile.svelte";


export let selectedMulineType: MULINE_TYPES = MULINE_TYPES.Ariadna;
let mulinePalette: Array<MulineData>;
// export let currentTileColor: string; //hex
// export let currentIndex: number;
// export let tileNode: HTMLElement;

export let show = false;

onMount(() => {
    mulinePalette = getMulinePalette(selectedMulineType);
    console.log(mulinePalette)
});

</script>

<style>
    .mulinePicker {
        position: absolute;
        top: 0;
        overflow: scroll;
        height: 500px;
        border-radius: 10px;
        border: 1px solid rgb(58, 57, 57);
        box-shadow:  rgb(58, 57, 57) 10px 10px 20px -12px;
        background-color: white;

    }

    .visible {
        display: none;
    }

    .tilesContainer {
        margin: 10px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
    }

    .tile {
        text-align: center;
    }

    .label {
        margin-top: 0;
    }
</style>