<h1>Pixel Art to Cross Stitch Pattern generator</h1>
<p>Click button below to upload pixel art image.</p>

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
        Upload
    </button>
    {#if uploadedImage}
        <div class="rowContainer">
            <img id="uploadedImg" src={uploadedImage} alt="uplaoded by user"/>
            <div class="columnContainer">
                {uploadedFileName}
                <MulineTypeSelector
                    label={"Select embroidery thread producer"}
                    bind:selectedMulineType/>
                
            </div>
        
        </div>
        
        <button
            on:click={requestGeneration}>
            generate pattern
        </button>
    {/if}
    {#if loading}
        loading...
    {/if}

    
</div>


<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import type { MULINE_TYPES } from "../data/mulineData";
    import MulineTypeSelector from "../components/MulineTypeSelector.svelte"


    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let imageType: string;
    let uploadedFileGeneratedName = "";
    let uploadedFileName = "";

    let loading = false;

    let selectedMulineType: MULINE_TYPES;


    function getBase64(image: File) {
        uploadedFileName = image.name;
        const reader = new FileReader();
        reader.readAsDataURL(image);
        imageType = String(image.type).split('/')[1];
        reader.onload = e => {
            uploadedImage = e?.target?.result;
            uploadFunction(e?.target?.result);
            
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
        sessionStorage.setItem('fileName', fileName);
    };

    async function requestGeneration() {
        loading = true;
        sessionStorage.setItem('mulineType', selectedMulineType);
        const data: any = {};
        data["fileName"] = uploadedFileGeneratedName;
        await fetch('/api/generatePreview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        })
        .then(() => {
            goto(`/preview/${uploadedFileGeneratedName}`);
        }
        );
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

    button {
        width: 128px;
        height: 32px;
        background-color: black;
        outline: black solid 2px;
        font-family: sans-serif;
        text-transform: uppercase;
        color: white;
        font-weight: bold;
        border: none;
    }

    button:hover {
        background-color: white;
        color: black;
        outline: black solid 2px;
    }
</style>