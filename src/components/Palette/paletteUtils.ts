import domtoimage from 'dom-to-image'
import type { Palette } from '../../data/mulineData';

export function getPaletteCounts(ogImgNode: HTMLElement, ogPalette: Array<Palette>): Promise<Palette[]> {
    //TODO on stardew valley image count is 0
    const imagePalette = [...ogPalette];
    imagePalette.forEach(color => color.count = 0);
    let count = 0;

    return domtoimage.toPixelData(ogImgNode)
        .then(function (pixels) {
            console.log(ogImgNode.scrollHeight * ogImgNode.scrollWidth)
            console.log(imagePalette)
            console.log(pixels)
            for (let y = 0; y < ogImgNode.scrollHeight; y++) {
                for (let x = 0; x < ogImgNode.scrollWidth; x++) {
                    let pixelAtXYOffset = (4 * y * ogImgNode.scrollHeight) + (4 * x);
                    /* pixelAtXY is a Uint8Array[4] containing RGBA values of the pixel at (x, y) in the range 0..255 */
                    let pixelAtXY = pixels.slice(pixelAtXYOffset, pixelAtXYOffset + 4);
                    let colorFromPalette = getColorFromPalette(pixelAtXY, imagePalette)
                    if (colorFromPalette) {
                        imagePalette[colorFromPalette.index].count++;
                    }
                    count++;
                }
            }
            console.log(count)
            console.log(imagePalette)
            return imagePalette;
        });
}

function getColorFromPalette(color: Uint8ClampedArray, palette: Array<Palette>): Palette | undefined {

    return palette.find(col => {
        const rgbCol = hexToRgb(col.colorHex);
        return color[0] === rgbCol[0] && color[1] === rgbCol[1] && color[2] === rgbCol[2] && color[3] === rgbCol[3];
    });
}


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