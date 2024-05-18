import domtoimage from 'dom-to-image'

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