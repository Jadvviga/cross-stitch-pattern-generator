{#if uploadedImage} 
<h1>Here will be displayed preprocessed image, with simplest grid, and with psosibility to set
    size, colors etc
</h1>

<div class="container">
    
    <img id="uploadedImg" src={uploadedImage} alt="avatar"/>

    <div>
        test
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
        //TODO ogarnąć porządny loaidng tak zeby strona nie wczytywała się zanim sie obrazek nie wczyta
        uploadedImage = `/images/${data.fileName}_resize.png`;
        
        
        const storageFileName = sessionStorage.getItem('fileName');
        console.log("onMount settings", data.fileName, storageFileName)
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