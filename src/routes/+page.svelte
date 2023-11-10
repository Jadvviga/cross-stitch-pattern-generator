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
        class="upload-btn"
        on:click={ () => fileInput.click() }>
        Upload
    </button>
    {#if avatar}
        <img id="uploadedImg" src={avatar} alt="avatar"/>
    {/if}

    <p>{messageErr}</p>
</div>


<script lang="ts">

    let fileInput: HTMLElement;

    let files: File[];
    let avatar: any;
    let messageErr = "";


    function getBase64(image: File) {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = e => {
            avatar = e?.target?.result;
            uploadFunction(e?.target?.result);
            
        };
    };

    async function uploadFunction(imgBase64) {
        const data = {}
        const imgData = imgBase64.split(',');
        data["image"] = imgData[1];
        const reponse = await fetch(`/uploadImage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({data})
        });
        const { message } = await reponse.json();
        messageErr = message;
    };
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

    .upload-btn {
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
