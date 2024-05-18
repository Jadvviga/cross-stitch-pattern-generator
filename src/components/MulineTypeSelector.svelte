
<label>
    <span class={disabled ? 'disabled' : ''}>{label}</span>
    <select {disabled}>
        {#each Object.values(MULINE_TYPES) as type}
            <option
                selected={selectedMulineType === type}
                value={type}
                on:click={() => changeSelection(type)}>{type}</option>
        {/each}
    </select>
</label>

<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { MULINE_TYPES } from "$lib/data/mulineData";

    export let selectedMulineType: MULINE_TYPES | string = MULINE_TYPES.Ariadna;
    export let label = "Select muline producer:";
    export let disabled: boolean = false;

    const dispatcher = createEventDispatcher();

    function changeSelection(selected: MULINE_TYPES) {
        selectedMulineType = selected;
        dispatcher("changedSelection", {selected})
    }

</script>

<style> 
    .disabled {
        color: grey;
    }
</style>