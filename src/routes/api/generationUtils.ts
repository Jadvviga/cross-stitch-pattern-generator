import Jimp from "jimp";
import type { Palette } from "$lib/data/mulineData";
import { JimpHexToString, stringHexToJimp } from "$api/generatePalette";
import type { IconFiles } from "$lib/data/generation";


let middleYIcon: Jimp, middleXIcon: Jimp;


export function loadImageToPixelsArray(image: Jimp, palette: Array<Palette>): Array<number> {
    const ogWidth = image.bitmap.width;
    const ogHeight = image.bitmap.height;
    const imagePixelsArray: number[] = [];
    //get pixels from og image to array
    for (let y = 0; y < ogHeight; y++) {
        for (let x = 0; x < ogWidth; x++) {
            let pixel = image.getPixelColor(x, y);
            const alpha = Jimp.intToRGBA(pixel).a;
            const paletteColor = getColorFromPalette(pixel, palette);
            if (paletteColor && alpha !== 0) { //do not replace transparent pixels
                pixel = stringHexToJimp(paletteColor.muline.hex);
            }

            imagePixelsArray.push(pixel);  // value are in HEX number
        }
    }
    return imagePixelsArray;
}



function getColorFromPalette(colorHex: number, palette: Array<Palette>): Palette | undefined {
    const hex = JimpHexToString(colorHex);
    return palette.find(col => col.colorHex.toLowerCase() === hex.toLowerCase() || col.muline.hex.toLowerCase() === hex.toLowerCase());
}

export function addIconsToImage(
    image: Jimp,
    ogWidth: number,
    ogHeight: number,
    scale: number,
    offset: number,
    gridSize: number,
    gridHighlightSize: number,
    palette: Array<Palette>,
    iconFiles: Array<IconFiles>,
    bw = false,
    colorImg: Jimp | null = null
): Jimp {
    const srcImg = colorImg || image;
    let iY = 0, iX = 0;
    for (let y = offset; iY < ogHeight; y += scale) {
        y += iY % 10 === 0 ? gridHighlightSize : gridSize;
        for (let x = offset; iX < ogWidth; x += scale) {
            x += iX % 10 === 0 ? gridHighlightSize : gridSize;
            const pixel = srcImg.getPixelColor(x, y);
            const alpha = Jimp.intToRGBA(pixel).a;
            if (alpha !== 0) {
                const paletteColor = getColorFromPalette(pixel, palette);
                if (paletteColor) {
                    const iconID = Number(paletteColor?.icon.split('icon')[1]);
                    const icon = iconFiles.find(iconFile => iconFile.index === iconID)?.file.clone();
                    if (icon) {
                        if (bw) {
                            icon.brightness(-1);
                        }
                        image.composite(icon, x, y);
                    }

                }

            }
            iX++;
        }
        iX = 0;
        iY++;
    }
    return image;
}

export function addTextToImage(
    image: Jimp,
    width: number,
    height: number,
    scale: number,
    offset: number,
    gridSize: number,
    gridHighlightSize: number,
    font: Font,
    startingNumberX: number,
    startingNumberY: number
): Jimp {
    let iY = 0, iX = 0;
    let i = startingNumberY;
    let middle = Math.floor(height / 2);

    for (let y = offset; iY < height; y += scale) {
        const isOnTenth = i % 10 === 0;
        y += isOnTenth ? gridHighlightSize : gridSize;
        if (i === middle && middleYIcon) {
            image.composite(middleYIcon, Math.floor(offset / 2) - 2, y);
        }
        if (isOnTenth) {
            image = printTextToImage(image, font, Math.floor(offset / 2) - 2, y, `${i}`, offset / 2);
        }

        i++;
        iY++;
    }

    i = startingNumberX;
    middle = Math.floor(width / 2);
    for (let x = offset; iX < width; x += scale) {
        const isOnTenth = i % 10 === 0;
        x += isOnTenth ? gridHighlightSize : gridSize;
        if (i === middle && middleXIcon) {
            image.composite(middleXIcon, x, Math.floor(offset / 2));
        }
        if (isOnTenth && i !== 0) {
            image = printTextToImage(image, font, x, Math.floor(offset / 2), `${i}`, offset / 2);
        }
        i++;
        iX++;
    }
    return image;
}

function printTextToImage(image: Jimp, font: Font, posX: number, posY: number, txt: string, max: number): Jimp {
    image.print(
        font,
        posX,
        posY,
        {
            text: txt,
            alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
            alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM,
        },
        max,
        max
    );
    return image;
}

export async function loadIconsFromPalette(palette: Array<Palette>, scale: number): Promise<Array<IconFiles>> {
    middleYIcon = await Jimp.read(`static/images/icons/middle_left.png`);
    middleYIcon.resize(scale, scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
    middleXIcon = await Jimp.read(`static/images/icons/middle_top.png`);
    middleXIcon.resize(scale, scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
    const icons = getPaletteIcons(palette);
    const iconFiles: Array<IconFiles> = [];
    for (const fileName of icons) {
        const inverse = fileName.includes('!');
        const iconName: string = fileName.split('!')[0]
        const icon = await Jimp.read(`static/images/icons/${iconName}.png`);
        const index = Number(iconName.replace('icon', ''));
        icon.resize(scale, scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
        if (inverse) {
            icon.invert();
        }
        iconFiles.push({ index, file: icon });
    }
    return iconFiles;
}

function getPaletteIcons(palette: Array<Palette>): Array<string> {
    const iconsSet = new Set<string>;
    for (const color of palette) {
        iconsSet.add(`${color.icon}${color.invertIcon ? '!' : ''}`);
    }
    return Array.from(iconsSet);
}