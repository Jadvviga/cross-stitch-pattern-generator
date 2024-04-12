
<a {href} download={downloadFileName}>
    {#if type === "button"}
        <button class="downloadBtn">
            <img class="icon" src={downloadIconSrc} alt="download icon">
            <span>{downloadText}</span>
        </button>
    {:else}
        <img class="generatedPattern {isSplitImg ? 'splitPattern' : ''}" src={imgSrc} alt={imgAlt} title="Click to download"/>
    {/if}
</a>

<script lang="ts">
    export let type: "button" | "image" = "button";
    export let href: string;
    export let downloadFileName: string = "generatedPattern";

    export let downloadText: string = "";
    export let imgSrc: string = "";

    export let isSplitImg: boolean = false;
    export let imgAlt: string = "generated pattern";

    let downloadIconSrc = '/download.png';
</script>


<style>

    .generatedPattern {
        margin-bottom: 10px;
        max-height: 50vh;
        padding: 10px;
        box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.3);
    }

    .splitPattern {
        max-height: 25vh;
        margin: 0;
        padding: 0;
    }

    img {
        cursor: pointer;
    }

    .generatedPattern:hover {
        transform: scale(1.05);
        
    }

    .icon {
        width: 32px;
        height: 32px;
        filter: invert(100%);
    }

    .downloadBtn {
        width: auto;
        height: 50px;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 15px;
        font-size: 16px;
        
    }

    .downloadBtn .icon {
        padding: 10px;
    }

    .downloadBtn span {
        padding: 10px;
    }


    .downloadBtn:hover .icon {
        filter: invert(0);
    }

    a {
        text-decoration: none;
    }

</style>