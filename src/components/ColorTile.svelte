<div
    bind:this={node}
    class="colorTile"
    class:clickableTile={clickable}
    style=" --tileColor: {colorToDisplay}"
    on:click={handleClick}
    title={clickable ? `Click to change ${icon ? 'icon' : 'embroidery floss color'}` : ''}>
    {#if icon} 
        <img src="/images/icons/{icon}.png" alt="symbol for color {colorToDisplay}" class="icon {color?.invertIcon ? 'inverted' : ''}">
    {/if}
</div>

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { MulineData, Palette } from "$lib/data/mulineData";

    export let color: Palette | MulineData;
    export let colorToDisplay: string;
    export let icon: string | null = null;
    export let clickable = false;

    let node: HTMLElement;

    const dispatcher = createEventDispatcher();

    function handleClick() {
        if (clickable && node) {
            dispatcher('click', {color, node});
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