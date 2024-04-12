<div in:fade={{ delay: 100, duration: 300 }}>
    <h1>Pixel Art to Cross Stitch Pattern generator</h1>
    <h2>Click button below to upload pixel art image.</h2>
    
    <div class="columnContainer">
        <input
            class="hidden"
            id="file-to-upload"
            type="file"
            accept=".png,.jpg"
            bind:files
            bind:this={fileInput}
            on:change={() => getBase64(files[0])}/>
        <button
            on:click={ () => fileInput.click() }>
            Upload image
        </button>
    
        {#if uploadedImage && uploadedFileGeneratedName}
        
            <div transition:fade={{ delay: 250, duration: 300 }}  class="rowContainer">
                <img id="uploadedImg" src={uploadedImage} alt="uploaded by user"/>
                <div class="columnContainer">
                    {uploadedFileName}
                    <MulineTypeSelector
                        label={"Select embroidery thread producer"}
                        bind:selectedMulineType/>
                </div>
            
            </div>
            
            <button transition:fade={{ delay: 250, duration: 300 }}
                on:click={requestGeneration}>
                generate pattern
            </button>
        {:else}
        <p class="note">note: Your image MUST be CLEAR PIXEL ART (1 square on image = 1 pixel).<br>Otherwise a proper output is not guaranteed.</p>
        {/if}
        
        {#if loading}
            <Loading/>
        {/if}
    </div>
</div>



<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import Loading from "../components/Loading.svelte";
    import type { MULINE_TYPES } from "../data/mulineData";
    import MulineTypeSelector from "../components/MulineTypeSelector.svelte"
    import { fade } from "svelte/transition";


    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let imageType: string;
    let uploadedFileGeneratedName = "";
    let uploadedFileName = "";

    let loading = false;

    let selectedMulineType: MULINE_TYPES;


    function getBase64(image: File) {
        loading = true;
        uploadedFileName = image.name;
        const reader = new FileReader();
        reader.readAsDataURL(image);
        imageType = String(image.type).split('/')[1];
        reader.onload = e => {
            uploadFunction(e?.target?.result);
            uploadedImage = e?.target?.result;
            
        };
    };

    async function uploadFunction(imgBase64: any) {
        const data: any = {};
        const imgData = imgBase64.split(',');
        data["image"] = imgData[1];
        // data["name"] = originalImage.name;
        // data["type"] = imageType;
        const response = await fetch(`/api/uploadImage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        const{ fileName } = await response.json();
        uploadedFileGeneratedName = fileName;
        loading = false;
        sessionStorage.setItem('fileName', fileName);
    };

    async function requestGeneration() {
        loading = true;
        sessionStorage.setItem('mulineType', selectedMulineType);
        const data: any = {};
        data["fileName"] = uploadedFileGeneratedName;
        const response = await fetch('/api/generatePreview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        const dimensions =  await response.json();
        
        sessionStorage.setItem("imageDimension", dimensions)
        goto(`/preview/${uploadedFileGeneratedName}`);
    }

    onMount(() => {
        uploadedImage = null;
        sessionStorage.clear();
    })
</script>


<style>
    #uploadedImg {
        height: auto;
        width: 128px;
        margin-bottom: 10px;
        border: 1px solid black;
    }

    .hidden {
        display: none;
    }

    .note {
        margin: 0;
        padding: 0;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
    }
</style>