<svelte:body on:click={onClickOutside}/>
<div class="mulinePicker {show ? "visible" : "invisible"} {shouldBeAbove ? 'above' : 'below'}" bind:this={node}>

    {#if mulinePalette}
        <div class="tilesContainer">
                {#each mulinePalette as color}
                    <div id={color.id} class="tile" class:selected={currentColor?.muline.id === color.id} use:scrollToTile={currentColor}>
                        <ColorTile
                            {color}
                            colorToDisplay={color.hex}
                            clickable={true}
                            on:click={() => handleMulineSelect(color)}/>
                        <span class="label">{color.id}</span>
                    </div>
                {/each}
        </div>
    {/if}
   
</div>

<script lang="ts">
    import { MULINE_TYPES, getMulinePalette, type MulineData, type Palette} from "$lib/data/mulineData";
    import { createEventDispatcher, onMount } from 'svelte';
    import ColorTile from "$components/ColorTile.svelte";


    export let selectedMulineType: MULINE_TYPES | string = MULINE_TYPES.Ariadna;
    export let currentColor: Palette;
    export let targetTileNode: HTMLElement;

    let mulinePalette: Array<MulineData>;

    export let show = false;
    let node: HTMLElement;
    let shouldBeAbove: boolean

    $: if (targetTileNode && node) {
        setPickerPosition();
    }
    $: if (!show) {
        setTimeout(() => { if (node) node.style.display = "none";}, 200);
    } else {
        if (node) node.style.display = "initial";
    }

    const dispatcher = createEventDispatcher();

    function handleMulineSelect(clickedColor: MulineData) {
        dispatcher("mulinePicked", {currentColor, clickedColor})
        show = false;
    }


    function setPickerPosition() {
        if (!node || !node.parentElement) {
            return;
        }
       const { height, width, x, y, } = targetTileNode.getBoundingClientRect();
        const scrollContainer = targetTileNode?.parentElement?.parentElement?.getBoundingClientRect();
       
        shouldBeAbove = scrollContainer && y > (scrollContainer?.y + scrollContainer.height)/2 || false;
        const top = y + height - (shouldBeAbove ? node.offsetHeight + targetTileNode.offsetHeight : 0);
        const left = x + width ;
        node.style.top = `${top}px`;
        node.style.left = `${left}px`;
        node = node;
    }

    function scrollToTile(tileNode: HTMLElement, _targetColor: Palette) {
        return {
            update(targetColor: Palette) {
                if (tileNode.id === targetColor.muline.id) {
                    tileNode.scrollIntoView();
                }
            }
        }
    }


    function onClickOutside(event: MouseEvent) {
        if (!show || !targetTileNode) {
            return;
        }
        const target = event.target as Node;
        if (node.contains(target) || node === target || targetTileNode === target) {
            return;
        }
        show = false;
    }


    onMount(() => {
        mulinePalette = getMulinePalette(selectedMulineType);
    });

</script>

<style>
    .mulinePicker {
        position: fixed;
        overflow: scroll;
        height: 450px;
        border-radius: 10px;
        border: 1px solid rgb(168, 168, 168);
        box-shadow:  rgb(58, 57, 57) 10px 10px 20px -12px;
        background-color: white;
       
    }

    .above {
        border-radius: 10px 10px 10px 0px;
    }

    .below {
        border-radius: 0px 10px 10px 10px;
    }

    .visible {
        visibility: visible;
        opacity: 1;
        transition:  opacity 0.2s linear;
    }

    .invisible {
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.2s linear, visibility 0s 0.2s;
    }

    .tilesContainer {
        margin: 10px;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
    }

    .tile {
        text-align: center;
    }

    .selected {
        box-shadow:  rgba(4, 0, 238, 0.7) 0px 0px 4px 2px;
    }

    .label {
        margin-top: 0;
    }
</style>