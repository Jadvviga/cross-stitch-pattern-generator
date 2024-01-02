
<label>
    {label}
    <select>
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
    import { MULINE_TYPES } from "../data/mulineData";

    export let selectedMulineType: MULINE_TYPES | string;
    export let label = "Select muline producer:";

    const dispatcher = createEventDispatcher();

    function changeSelection(selected: MULINE_TYPES) {
        selectedMulineType = selected;
        dispatcher("chnangedSelection", {selected})
    }

</script>