<div style="border: 1px black solid">
    <MulineTypeSelector
        label={"Currently chosen palette (changing this will cause a palette refresh)"}
        {selectedMulineType}
        on:changedSelection={handleMulineTypeChange}/>
    <div>
        <label>
            <input type="checkbox" on:change={changePaletteSorting}>
            Sort by embroidery floss colors
        </label>
    </div>
    <div>
        <label>
            <input type="checkbox" bind:checked={dontMergeSameColors}>
            Do not merge same colors
        </label>
    </div>
   
    {#key imagePalette}
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
                <div class='palette' on:scroll={() => {showIconPicker = false; showMulineColorPicker = false;}}>
                    {#each imagePalette as color, index}
                        <div class="rowContainer colorsContainer">
                            <ColorTile
                                {color}
                                colorToDisplay={color.colorHex}/>
                            <p style="width: 70px">({color.colorHex})</p>
                            {#if !previousMulineColIsSame(color, index) || dontMergeSameColors}
                                <p> → </p>
                                <ColorTile
                                    {color}
                                    colorToDisplay={color.muline.hex}
                                    clickable={true}
                                    on:click={handleColorTileClick}/>
                                <ColorTile
                                    {color}
                                    colorToDisplay={color.muline.hex}
                                    clickable={true}
                                    icon={color.icon}
                                    on:click/>
                                <p>{color.muline.id}</p>
                                <p style="font-size: 10px; margin-left: 0px;">x{color.count}</p>
                                <!-- TODO revert button -->
                            {/if}
                            
                        </div>
                        
                    {/each}
                </div>
        {:else}
            <Loading text="loading palette..."/>
        {/if}
    {/key}

    <MulineColorPicker
        {selectedMulineType}
        bind:show={showMulineColorPicker}
        targetTileNode={clickedTile}
        currentColor={clickedColor}
        on:mulinePicked={changeColorInPalette}/>
    
    
   
</div>

<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import MulineTypeSelector from "../MulineTypeSelector.svelte";
    import { MULINE_TYPES } from "../../data/mulineData";
    import type { Palette } from "../../data/mulineData";
    import Loading from "../Loading.svelte";
    import { apiCall } from "../../request";
    import ColorTile from "../ColorTile.svelte";
    import MulineColorPicker from "./MulineColorPicker.svelte";

    export let fileName: string;
    export let imagePalette: Array<Palette> | null;
    let imagePixelsPalette: Array<Palette> | null;
    let sortedByMuline = false;
    let dontMergeSameColors = false;

    let showMulineColorPicker = false;
    let showIconPicker = false;
    let clickedTile: HTMLElement;
    let clickedColor: Palette;

    const dispatcher = createEventDispatcher();
    

    $: selectedMulineType = sessionStorage.getItem("mulineType") || MULINE_TYPES.Ariadna;
    $: numberOfColors = imagePalette?.length;
    $: numberOfMulineColors = getMulineCount(imagePalette);

    $: if (imagePalette) {
        dispatcher('paletteLoaded')
    }

    function handleColorTileClick(event: CustomEvent) {
        const {color, node: tileNode} = event.detail;
        showMulineColorPicker = true;
        clickedTile = tileNode;
        clickedColor = color;
    }

    function changeColorInPalette(event: CustomEvent) {
        if (!imagePalette) {
            return;
        }
        const {currentColor: colorToChange, clickedColor} = event.detail;
        const foundIndex = imagePalette.findIndex(col => col.index === colorToChange.index);
        imagePalette[foundIndex].muline = clickedColor;

        // If clicked muline color is already in palette - apply its icon
        const mulineAlreadyInPalette = imagePalette.findIndex(col => col.muline.id === clickedColor.id);
        if (mulineAlreadyInPalette) {
            const takeIconFrom = imagePalette[mulineAlreadyInPalette];
            imagePalette[foundIndex].icon = takeIconFrom.icon;
            imagePalette[foundIndex].invertIcon = takeIconFrom.invertIcon;
        }
        imagePalette = imagePalette;
    }
        
    async function handleMulineTypeChange(event: Event | any) {
        const  { selected } = event.detail;
        sessionStorage.setItem("mulineType", selected);
        selectedMulineType = selected;
        
        imagePalette = null;
        imagePalette = await requestPalette();
        imagePalette?.sort(sortedByMuline ? compareByMuline : compareByPixels);
    }
    
    function changePaletteSorting() {
        sortedByMuline = !sortedByMuline;
        imagePalette?.sort(sortedByMuline ? compareByMuline : compareByPixels);
        imagePalette = imagePalette;
    }

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
        if (index === 0 || !imagePalette) {
            return false;
        }
        return color.muline.id === imagePalette[index - 1].muline.id;
    }

    function getMulineCount(palette: Array<Palette> | null): number {
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
        const useLeastColors = sessionStorage.getItem('useLeastColors') === "true";
        const data: any = {};
        data["fileName"] = fileName;
        data["mulineType"] = selectedMulineType;
        data["useLeastColors"] = useLeastColors;
        data["pixelsPalette"] = imagePixelsPalette;
        const { palette } = await apiCall('/api/getPalette', data);
        return palette;
    }

    async function requestPixelsPalette() {
        const data: any = {};
        data["fileName"] = fileName;
        
        const { palette } = await apiCall('/api/getPaletteFromImage', data);
        return palette;
    }

    onMount(async () => {
        imagePixelsPalette = await requestPixelsPalette();
        imagePalette = await requestPalette();
        console.log(imagePalette)
    })
    
</script>

<style>
    .colorsContainer {
        gap: 0;
        margin: 0;
        padding: 0;
    }
    .colorsContainer p {
        margin: 8px;
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
        max-height: 70vh;
        overflow-y: scroll;
        box-shadow: inset gray 0px 0px 20px -12px; 
        border-radius: 10px;
    }
</style>