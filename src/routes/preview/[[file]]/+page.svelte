{#if uploadedImage && !loading} 
<div transition:fade={{ delay: 250, duration: 300 }} class="container">
    
    <img id="uploadedImg" src={uploadedImage} alt="avatar"/>

    <div>
        <PaletteSettings
            {fileName}/>
    </div>
    
</div>
{:else}
    <Loading/>
{/if}




<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import PaletteSettings from '../../../components/PaletteSettings.svelte';
    import Loading from '../../../components/Loading.svelte';
    import { fade } from 'svelte/transition';


 
    let uploadedImage: any;
    let fileName: string;
    let loading = true;


    export let data;


    onMount(() => {
        loading = true;
        const storageFileName = sessionStorage.getItem('fileName');
        if (!storageFileName || storageFileName !== data.fileName) {
            goto('/');
        }
        fileName = data.fileName;
        uploadedImage = `/images/upload/${data.fileName}_preview.png`;
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
        gap: 20px;
    }

    #uploadedImg {
        margin-bottom: 10px;
         max-width: 600px;
        height: auto; 
    }


</style>