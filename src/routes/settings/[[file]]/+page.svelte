{#if uploadedImage} 
<h1>Here will be displayed preprocessed image, with simplest grid, and with psosibility to set
    size, colors etc
</h1>

<div class="container">
    
    <img id="uploadedImg" src={uploadedImage} alt="avatar"/>

    <div>
        test text
    </div>
    

</div>
{:else}
loading...
{/if}




<script lang="ts">
    import { goto } from '$app/navigation';
    import test from 'node:test';
    import { onMount } from 'svelte';


    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let imageType: string;
    let messageUpload = "";

    export let data;


    onMount(() => {
        const storageFileName = sessionStorage.getItem('fileName');
        uploadedImage = `/images/${data.fileName}.png`;
        
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
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
