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
                    <label class="checkboxLabel">
                        <input type="checkbox" bind:checked={skipPreview}>
                        Skip settings and customization
                        <p>just generate the pattern</p>
                    </label>
                    <p>Settings</p>
                    <MulineTypeSelector
                        label={"Select embroidery thread producer"}
                        disabled={skipPreview}
                        bind:selectedMulineType/>
                    <label class="checkboxLabel {skipPreview ? 'disabled': ''}">
                        <input type="checkbox" bind:checked={useLeastColors} disabled={skipPreview}>
                        Use as least colors as possible
                    </label>
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
    import { fetchRequest } from "../request";


    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let imageType: string;
    let uploadedFileGeneratedName = "";
    let uploadedFileName = "";

    let loading = false;

    let selectedMulineType: MULINE_TYPES;

    let skipPreview = false;
    let useLeastColors = false;

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
        const{ fileName } = await fetchRequest('/api/uploadImage', data);
        uploadedFileGeneratedName = fileName;
        loading = false;
        sessionStorage.setItem('fileName', fileName);
    };

    async function requestGeneration() {
        loading = true;
        sessionStorage.setItem('mulineType', selectedMulineType);
        sessionStorage.setItem('skipPreview', `${skipPreview}`);
        sessionStorage.setItem('useLeastColors', `${useLeastColors}`);
        const data: any = {};
        data["fileName"] = uploadedFileGeneratedName;
        const dimensions =  await fetchRequest('/api/generatePreview', data);
        
        sessionStorage.setItem("imageDimension", dimensions)
        goto(`/preview/${uploadedFileGeneratedName}`);
    }

    onMount(async () => {
        uploadedImage = null;
        sessionStorage.clear();

        //Clearing upload and pattern folders at start of program
        //In proper program this would not be present - instead each dedicated pattern folder
        //would have time out for deleting it after certain time
        const data: any = {};
        data["src"] = ["static/images/upload", "static/images/pattern"]
        await fetchRequest('/api/clearFolder', data)
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

    .checkboxLabel {
        font-size: 16px;
        text-align: center;
    }

    .checkboxLabel p {
        font-size: 14px;
        margin-top: 0;
    }
    .checkboxLabel.disabled {
        color: grey;
    }
</style>