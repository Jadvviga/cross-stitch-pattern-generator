<div style="border: 1px black solid">
    <MulineTypeSelector
        label={"Currently chosen palette (changing this will cause a palette refresh)"}
        {selectedMulineType}
        on:changedSelection={handleMulineTypeChange}/>
    
    <div class="rowContainer" style="margin: 0">
        <div>
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
        </div>
        
        <button on:click={revertAllChanges}
            class:visible={showRevertButton} class="revertButton">
            <img src="/undo.png" alt="revert all changes" title="Click to revert the changes" class="icon">      
            Revert all changes
        </button>
    </div>
    
   
    {#key imagePalette}
        {#if imagePalette}
            <div class="rowContainer paletteHeader">
                <p>
                    Pixel color
                    <span>{numberOfColors} colors</span>
                    <span style="opacity: 0;">0</span>
                </p>
                <p>
                    Embroidery floss color
                    <span>{numberOfMulineColors} colors</span>
                    <span style="font-weight: bold">(click on embroidery tiles to change colors or icons)</span>
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
                                    on:click={handleIconTileClick}/>
                                <p>{color.muline.id}</p>
                                <p style="font-size: 10px; margin-left: 0px;">x{color.count}</p>
                                {#if inModified(color)}
                                    <img on:click={() => revertSingleColorChanges(color, index)}  src="/undo.png" alt="revert color/icon change" title="Click to revert the changes" class="revert">
                                {/if}
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
        targetTileNode={clickedTile}
        currentColor={clickedColor}
        bind:show={showMulineColorPicker}
        on:mulinePicked={changeColorInPalette}/>

    <IconPicker
        targetTileNode={clickedTile}
        currentColor={clickedColor}
        bind:show={showIconPicker}
        on:iconPicked={changeIconInPalette}/>
    
    
   
</div>

<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import MulineTypeSelector from "$components/MulineTypeSelector.svelte";
    import { MULINE_TYPES } from "$lib/data/mulineData";
    import type { Palette } from "$lib/data/mulineData";
    import Loading from "$components/Loading.svelte";
    import { apiCall } from "$lib/request";
    import ColorTile from "$components/ColorTile.svelte";
    import IconPicker from "$components/PaletteSettings/IconPicker.svelte";
    import MulineColorPicker from "$components/PaletteSettings/MulineColorPicker.svelte";

    export let fileName: string;
    export let imagePalette: Array<Palette> = [];
    let ogImagePalette: Array<Palette>;
    let imagePixelsPalette: Array<Palette>;
    let sortedByMuline = false;
    let dontMergeSameColors = false;

    let showMulineColorPicker = false;
    let showIconPicker = false;
    let clickedTile: HTMLElement;
    let clickedColor: Palette;

    let modifiedColors: Array<Palette> = [];

    const dispatcher = createEventDispatcher();
    

    $: selectedMulineType = sessionStorage.getItem("mulineType") || MULINE_TYPES.Ariadna;
    $: numberOfColors = imagePalette?.length;
    $: numberOfMulineColors = getMulineCount(imagePalette);
    $: showRevertButton = modifiedColors.length !== 0;

    $: if (imagePalette) {
        dispatcher('paletteLoaded');
    }

    function handleColorTileClick(event: CustomEvent) {
        showIconPicker = false;
        showMulineColorPicker = false;
        const {color, node: tileNode} = event.detail;
        showMulineColorPicker = true;
        clickedTile = tileNode;
        clickedColor = color;
    }

    function handleIconTileClick(event: CustomEvent) {
        showIconPicker = false;
        showMulineColorPicker = false;
        const {color, node: tileNode} = event.detail;
        showIconPicker = true;
        console.log('aaa')
        clickedTile = tileNode;
        clickedColor = color;
    }

    function changeColorInPalette(event: CustomEvent) {
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
        addToModified(colorToChange);
    }

    function changeIconInPalette(event: CustomEvent) {
        const {currentColor: colorToChange, clickedIcon} = event.detail;
        const foundIndex = imagePalette.findIndex(col => col.index === colorToChange.index);
        imagePalette[foundIndex].icon = clickedIcon;
        //We do not change the muline color if icon is already in palette
        //It is up to user if they decide to have 2 diff colors with same icons
        imagePalette = imagePalette;
        addToModified(colorToChange);
    }

    function addToModified(color: Palette): void {
        if (!inModified(color)) {
            modifiedColors.push(color);
            modifiedColors = modifiedColors;
        }
    }

    function inModified(color: Palette): boolean {
        return modifiedColors.findIndex(col => col.index === color.index) !== -1;
    }

    function revertSingleColorChanges(color: Palette, index: number): void {
        modifiedColors = modifiedColors.filter(col => col.index !== color.index);
        const ogIndex = ogImagePalette.findIndex(col => col.index === color.index);
        imagePalette[index] = {...ogImagePalette[ogIndex]};
        imagePalette = imagePalette;
        
    }

    function revertAllChanges(): void {
        modifiedColors = [];
        imagePalette = JSON.parse(JSON.stringify(ogImagePalette));
    }

    async function handleMulineTypeChange(event: Event | any) {
        const  { selected } = event.detail;
        sessionStorage.setItem("mulineType", selected);
        selectedMulineType = selected;
        
        imagePalette = [];
        imagePalette = await requestPalette();
        imagePalette.sort(sortedByMuline ? compareByMuline : compareByPixels);
        saveOgImagePallet();
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

    function saveOgImagePallet() {
        ogImagePalette = JSON.parse(JSON.stringify(imagePalette));
    }

    onMount(async () => {
        imagePixelsPalette = await requestPixelsPalette();
        imagePalette = await requestPalette();
        saveOgImagePallet();

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

    .revertButton {
        display: flex;
        flex-direction: row;
        align-items: center;
        visibility: hidden;
    }

    .revertButton.visible {
        visibility: visible;
    }

    .revertButton .icon {
        width: 32px;
        height: 32px;
        filter: invert(100%);
    }

    .revertButton:hover .icon {
        filter: invert(0);
    }

    .palette {
        margin-top: 0px;
        max-height: 70vh;
        overflow-y: scroll;
        box-shadow: inset gray 0px 0px 20px -12px; 
        border-radius: 10px;
    }

    .revert {
        width: 16px;
        height: 16px;
        cursor: pointer;
    }

    .revert:hover {
        transform: scale(1.1);
        
    }
</style>