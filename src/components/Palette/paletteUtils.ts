import domtoimage from 'dom-to-image'

export function hexToRgb(hex: string): Array<number> {
    var result = /^#?([A-Fa-f\d]{2})([A-Fa-f\d]{2})([A-Fa-f\d]{2})$/i.exec(hex);
    if (result) {
        const col = [];
        col.push(parseInt(result[1], 16));
        col.push(parseInt(result[2], 16));
        col.push(parseInt(result[3], 16));
        col.push(255);
        return col;
    }
    return [0, 0, 0, 0];

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