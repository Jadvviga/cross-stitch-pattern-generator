<div
    class="colorTile"
    class:clickableTile={clickable}
    style=" --tileColor: {color?.colorHex || color?.hex}"
    on:click={handleClick}>
    {#if icon} 
        <img src="/images/icons/{icon}.png" alt="symbol for color {color?.muline.hex || color?.hex}" class="icon {color?.invertIcon ? 'inverted' : ''}">
    {/if}
</div>

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { MulineData, Palette } from "../data/mulineData";

    export let color: Palette | MulineData;
    export let icon: string | null = null;
    export let clickable = false;


    const dispatcher = createEventDispatcher();

    function handleClick() {
        if (clickable) {
            dispatcher('click', {color});
        }
    }

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

    .clickableTile {
        cursor: pointer;
    }

    .clickableTile:hover {
        transform: scale(1.1);
        
    }

    .icon {
        width: 30px;
        height: 30px;
    }

    .inverted {
        filter: invert(1);
    }
</style>