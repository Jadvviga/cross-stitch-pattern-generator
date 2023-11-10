<h1>Pixel Art to Cross Stitch Pattern generator</h1>
<p>Click button belowe to upload pixel art image.</p>

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
        <p>{messageUpload}</p>

        <button
            on:click={requestGeneration}>generate pattern</button>
    {/if}

    
</div>


<script lang="ts">

    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let imageType: string;
    let messageUpload = "";


    function getBase64(image: File) {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        imageType = String(image.type).split('/')[1];
        reader.onload = e => {
            uploadedImage = e?.target?.result;
            uploadFunction(e?.target?.result, image);
            
        };
    };

    async function uploadFunction(imgBase64, originalImage: File) {
        const data = {}
        const imgData = imgBase64.split(',');
        data["image"] = imgData[1];
        data["name"] = originalImage.name;
        data["type"] = imageType;
        console.log(data)
        const reponse = await fetch(`/uploadImage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        const { message } = await reponse.json();
        messageUpload = message;
    };

    async function requestGeneration() {
        const response = await fetch('/generatePattern');
        const  message  = await response.json();
        console.log(message) 
    }
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
