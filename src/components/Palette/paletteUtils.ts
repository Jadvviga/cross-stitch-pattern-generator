import domtoimage from 'dom-to-image'

export function getPaletteImg(node: HTMLElement): HTMLImageElement {
    let img = new Image();
    img.alt = "There should be palette image"

    
    domtoimage.toPng(node)
        .then(function (dataUrl) {
            console.log('dataUrl')
            img.src = dataUrl;
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
        });
    return img;
}

export function getPaletteBlob(node: HTMLElement): Promise<Blob> {
    return domtoimage.toBlob(node)
        .then(function (blob) {
            return blob;
        })
        .catch(function (error) {
            console.error('Something went wrong when saving palette image', error);
            return new Blob()
        })
}