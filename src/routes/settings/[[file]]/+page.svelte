{#if uploadedImage && !loading} 
<h1>Here will be displayed preprocessed image, with simplest grid, and with possibility to set
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
    import { onMount } from 'svelte';


    let fileInput: HTMLElement;

    let files: File[];
    let uploadedImage: any;
    let loading = true; 
    let imageType: string;
    let messageUpload = "";

    export let data;


    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }

        uploadedImage = `/images/${data.fileName}_preview.png`;
        const loadImage = new Image();
        loadImage.onload = () => {
            loading = false;
        }
        let errorCount = 0;
        loadImage.onerror = () => {
            errorCount++;
            if (errorCount > 3) {
                goto('/');
            } else {    
                loadImage.src = uploadedImage;
            }

        }
        loadImage.src = uploadedImage;
        
    })
</script>


<style>
    .container {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    #uploadedImg {
        margin-bottom: 10px;
        /* max-width: 600px;
        height: auto; */
    }


</style>