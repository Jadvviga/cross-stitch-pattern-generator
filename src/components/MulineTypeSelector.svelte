
<label>
    {label}
    <select>
        {#each Object.values(MULINE_TYPES) as type}
            <option
                value={type}
                on:click={() => selectedMulineType = type}>{type}</option>
        {/each}
    </select>
</label>

<script lang="ts">
    import { MULINE_TYPES } from "../data/mulineData";

    export let selectedMulineType: MULINE_TYPES = MULINE_TYPES.Ariadna;
    export let label = "Select muline producer:";

</script>