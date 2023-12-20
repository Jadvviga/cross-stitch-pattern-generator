<h1>Pixel Art to Cross Stitch Pattern generator</h1>
<p>Click button below to upload pixel art image.</p>

<div class="container">
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
        <img id="uploadedImg" src={uploadedImage} alt="avatar"/>
        {messageUpload}
        <button
            on:click={requestGeneration}>generate pattern</button>
    {/if}
    {#if loading}
        loading...
    {/if}

    
</div>


<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";


    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let imageType: string;
    let messageUpload = "";
    let uploadedFileName = "";

    let loading = false;


    function getBase64(image: File) {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        imageType = String(image.type).split('/')[1];
        reader.onload = e => {
            uploadedImage = e?.target?.result;
            
            uploadFunction(e?.target?.result, image);
            
        };
    };

    async function uploadFunction(imgBase64: any, originalImage: File) {
        const data: any = {};
        const imgData = imgBase64.split(',');
        data["image"] = imgData[1];
        data["name"] = originalImage.name;
        data["type"] = imageType;
        const response = await fetch(`/uploadImage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        const{ fileName } = await response.json();
        uploadedFileName = fileName;
        sessionStorage.setItem('fileName', fileName);
    };

    async function requestGeneration() {
        loading = true;
        const data: any = {};
        data["fileName"] = uploadedFileName;
        await fetch('/generatePreview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        })
        .then(() => {
            goto(`/settings/${uploadedFileName}`);
        }
        );
    }

    onMount(() => {
        console.log("onMount")
        uploadedImage = null;
        sessionStorage.clear();
    })
</script>


<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    #uploadedImg {
        height: auto;
        width: 128px;
        margin-bottom: 10px;
    }

    .hidden {
        display: none;
    }

    button {
        width: 128px;
        height: 32px;
        background-color: black;
        font-family: sans-serif;
        color: white;
        font-weight: bold;
        border: none;
    }

    .upload-btn:hover {
        background-color: white;
        color: black;
        outline: black solid 2px;
    }
</style>