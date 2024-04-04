import Jimp from "jimp";
import type { Palette } from "../../data/mulineData";
import { hexToRgb, rgbToHex } from "./generatePalette";
import PDFDocument from 'pdfkit';
import fs from 'fs';

export function loadImageToPixelsArray(image: Jimp, paletteSet?: Set<number>, palette?: Array<Palette>): Array<number> {
    const ogWidth = image.bitmap.width;
    const ogHeight = image.bitmap.height;
    const imagePixelsArray: number[] = [];
    //get pixels from og image to array
    for (let y = 0; y < ogHeight; y++) {
        for (let x = 0; x < ogWidth; x++) {
            let pixel = image.getPixelColor(x, y);
            if (paletteSet) { // for preview - add pixel to palette
                //TODO handle alpah correctly
                // if there is element with alpha - alpha color gets icon-1.png
                // if not - the first detected colors gets icon-1.png

                //otherwise on BW most commone color icon will not be visible
                //if (Jimp.intToRGBA(pixel).a !== 0) {
                    paletteSet.add(pixel);
                //} 
            }
            if (palette) { // for pattern replace og colors with palette ones
                const alpha = Jimp.intToRGBA(pixel).a;
                const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
                if (paletteColor && alpha !== 0) { //do not replace transparent pixels
                    const rgb = hexToRgb(paletteColor.muline.hex);
                    pixel = Jimp.rgbaToInt(rgb.r, rgb.g, rgb.b, rgb.a);
                }
            }
            imagePixelsArray.push(pixel);  // value are in HEX number
        }
    }
    return imagePixelsArray;
}

function getColorFromPalette(colorHex: string, palette: Array<Palette>): Palette | undefined {
    return palette.find(col => col.colorHex.toLowerCase() === colorHex.toLowerCase() || col.muline.hex.toLowerCase() === colorHex.toLowerCase());
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
    iconFiles: Jimp[],
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
                const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
                if (paletteColor) {
                    const iconID = Number(paletteColor?.icon.split('icon')[1]);
                    const icon = iconFiles[iconID + 1].clone(); //+1 cuz icons start at -1
                    if (bw) {
                        icon.brightness(-1);
                    }
                    image.composite(icon, x, y);
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
    resizedWidth: number,
    resizedHeight: number,
    scale: number,
    offset: number,
    gridSize: number,
    gridHighlightSize: number,
    font: Font,
    startingNumberX: number,
    startingNumberY: number
): Jimp {
    let i = startingNumberY;

    //todo change it analogically to addIcons so that end condition depends on ogSize rather then resied
    for (let y = offset; y < resizedHeight; y += scale) {
        const isOnTenth = i % 10 === 0;
        y += isOnTenth ? gridHighlightSize : gridSize;
        if (isOnTenth) {
            image = printTextToImage(image, font, Math.floor(offset / 2) - 2, y, `${i}`, offset / 2);
        }
        i++;
    }
    i = startingNumberX;
    for (let x = offset; x < resizedWidth; x += scale) {
        const isOnTenth = i % 10 === 0;
        x += isOnTenth ? gridHighlightSize : gridSize;
        if (isOnTenth) {
            image = printTextToImage(image, font, x, Math.floor(offset / 2), `${i}`, offset / 2);
        }
        i++;
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

export async function loadIconsFromPalette(palette: Array<Palette>, scale: number): Promise<Jimp[]> {
    const icons = getPaletteIcons(palette);
    const iconFiles: Array<Jimp> = [];
    const found = icons.find(icon => icon.includes('-1'));
    if (found == undefined) { //if icon-1 is not included (aka there is alpha), add it still for proper calculations
        iconFiles.push(await Jimp.read(`static/images/icons/icon-1.png`));
    }
    for (const fileName of icons) {
        const inverse = fileName.includes('!');
        const icon = await Jimp.read(`static/images/icons/${fileName.split('!')[0]}.png`);
        icon.resize(scale, scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
        if (inverse) {
            icon.invert();
        }
        iconFiles.push(icon);
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

export async function generatePaletteImage(path: string, paletteSet: Set<number>) {
    try {
      await new Jimp(paletteSet.size, 1, (err, image) => {
        if (err) {
          throw err;
        }
        const iterator = paletteSet.values()
        for (let i = 0; i < paletteSet.size; i++) {
          image.setPixelColor(iterator.next().value, i, 0)
        }
        image.write(path);
      });
    } catch (err) {
      console.error("Something went wrong when generating the color palette: " + err);
    }
  
  
  }