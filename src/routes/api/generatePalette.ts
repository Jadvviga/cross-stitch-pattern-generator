import Jimp from "jimp";
import { MULINE_TYPES, type MulineData, type Palette, type PaletteFromImg } from "../../data/mulineData";
import { ARIADNA } from "../../data/ariadna";
import { DMC } from "../../data/dmc";
import colorsea from 'colorsea';
import Color from "colorjs.io";


const path = 'static/images/upload/';
const ICON_COUNT = 55;

function getMulinePalette(mulineType: MULINE_TYPES): Array<MulineData> {
    switch (mulineType){
        case MULINE_TYPES.Ariadna:
            return ARIADNA;
        case MULINE_TYPES.DMC:
            return DMC;
        // possibly more muline producers in the future
    }
        
}

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex({r, g, b}: RGBA) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function hexToRgb(hex: string): RGBA {
  var result = /^#?([A-Fa-f\d]{2})([A-Fa-f\d]{2})([A-Fa-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 255
  } : { r: 255, g: 255, b: 255, a:255 };
}

export function JimpHexToString(hex: number): string {
  return rgbToHex(Jimp.intToRGBA(hex));
}

export function stringHexToJimp(hex: string): number {
  const rgb = hexToRgb(hex)
  return Jimp.rgbaToInt(rgb.r, rgb.g, rgb.b, rgb.a);
}

export async function getPaletteFromImage(fileName: string):  Promise<PaletteFromImg[]>  {
  const fullFileName = `static/images/upload/${fileName}/${fileName}.png`;
  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const paletteSet = new Set<number>();
  const paletteArray: Array<PaletteFromImg> = []

  let index = 0;
  for (let y = 0; y < ogHeight; y++) {
    for (let x = 0; x < ogWidth; x++) {
        let pixel = image.getPixelColor(x, y);
        if (paletteSet.has(pixel)) {
          let i = Array.from(paletteSet).findIndex(p => p === pixel);
          paletteArray[i].count++;
        } else {
          paletteArray.push({index, colorHex: JimpHexToString(pixel), count: 1 });
          index++;
        }
        paletteSet.add(pixel); 
    }
  }
  return paletteArray;
}

const MIN_DIST_THRESHOLD = 18; //for when using least colors as possible
//ITP - 19
//2000 - 7
//TODO consider giving option of choosing the color disatnce algo
export async function loadPalette(fileName: string, pixelsPalette: Array<PaletteFromImg>, mulineType: MULINE_TYPES, useLeastColors: boolean): Promise<Palette[]> {
  const mulinePalette = getMulinePalette(mulineType);
  const palette: Array<Palette> = []; // palette to return
  const mulineColorSet = new Set<string>; // set for icon control

  //if there is alpha - remove it from palette and start icons from indx 0 instead of -1
  // icon-1.png is empty image - used on most common color when we don't have alpha
  let iconID = -1;
  if (hasAlpha(pixelsPalette)) {
    iconID = 0;
    pixelsPalette = pixelsPalette.filter(pal => hexToRgb(pal.colorHex).a !== 0);
  }

  pixelsPalette.forEach(({colorHex, count, index}) => {
    let mulineIndex = -1;
    if (useLeastColors) {
      //Version 2
      //Get distance with color that is already in palette, and check for threshold minimum
      //If there is none, do version 1
      const colorDistancesPalette: number[] = [];
      palette.forEach(mulineColor => {
        colorDistancesPalette.push(getColorDifference(mulineColor.colorHex, colorHex))
      });
      const minDistPalette = Math.min(...colorDistancesPalette);

      if (minDistPalette < MIN_DIST_THRESHOLD) {
        const paletteIndex = colorDistancesPalette.indexOf(minDistPalette);
        const paletteColor = palette[paletteIndex];
        mulineIndex = mulinePalette.indexOf(paletteColor.muline);
      }
    }

    if (mulineIndex === -1) { //muline was not found in  palette
      //Version 1
      //Get distance with each muline color and get the minimum
      const colorDistances: number[] = [];
      mulinePalette.forEach(mulineColor => {
        colorDistances.push(getColorDifference(mulineColor.hex, colorHex))
      });
      const minDist = Math.min(...colorDistances);
      mulineIndex = colorDistances.indexOf(minDist);
    }
   

    let icon = `icon${iconID}`;
    const mulineColor = mulinePalette[mulineIndex];
    // check if muline color already in palette - if so, take its icon; otherwise take new icon
    if (mulineColorSet.has(mulineColor.id)) {
      const pal = palette.find(x => x.muline.id === mulineColor.id);
      icon = pal?.icon || icon;
    } else {
      mulineColorSet.add(mulineColor.id);
      iconID++;
      if (iconID > ICON_COUNT) {
        iconID = 0;
      }
    }
    
    palette.push({
      index,
      colorHex,
      muline: mulineColor,
      icon,
      invertIcon: isColorDark(mulineColor.hex),
      count
    });
  })

  return palette;
}

export async function _loadPalette(fileName: string, pixelsPalette: Array<PaletteFromImg>, mulineType: MULINE_TYPES, useLeastColors: boolean): Promise<Palette[]> {
  console.log('aaa', pixelsPalette)


  const mulinePalette = getMulinePalette(mulineType);

  const paletteFileName = `${path}/${fileName}/palette.png`;
  const paletteImage = await Jimp.read(paletteFileName);
 
  let colors: Array<RGBA> = [];
  const palette: Array<Palette> = []; // palette to return
  const mulineColorSet = new Set<string>;

  for (let i = 0; i < paletteImage.bitmap.width; i++) {
    colors.push(Jimp.intToRGBA(paletteImage.getPixelColor(i, 0)));
  }

  //if there is alpha - remove it from palette and start icons from indx 0 instead of -1
  // icon-1.png is empty image - used when we have most common color when we don't have alpha
  let iconID = -1;
  if (_hasAlpha(colors)) {
    iconID = 0;
    colors = colors.filter(color => color.a !== 0);
  }

  colors.forEach((color, index) => {

    let mulineIndex = -1;
    if (useLeastColors) {
      //Version 2
      //Get distance with color that is already in palette, cnd check for threshold minimum
      //If there is none, do version 1
      const colorDistancesPalette: number[] = [];
      palette.forEach(mulineColor => {
        colorDistancesPalette.push(getColorDifference(mulineColor.colorHex, rgbToHex(color)))
      });
      const minDistPalette = Math.min(...colorDistancesPalette);

      if (minDistPalette < MIN_DIST_THRESHOLD) {
        const paletteIndex = colorDistancesPalette.indexOf(minDistPalette);
        const paletteColor = palette[paletteIndex];
        mulineIndex = mulinePalette.indexOf(paletteColor.muline);
      }
    }

    if (mulineIndex === -1) { //muline was not found in  palette
      //Version 1
      //Get distance with each muline color and get the minimum
      const colorDistances: number[] = [];
      mulinePalette.forEach(mulineColor => {
        colorDistances.push(getColorDifference(mulineColor.hex, rgbToHex(color)))
      });
      const minDist = Math.min(...colorDistances);
      mulineIndex = colorDistances.indexOf(minDist);
    }
   

    let icon = `icon${iconID}`;
    const mulineColor = mulinePalette[mulineIndex];
    if (mulineColorSet.has(mulineColor.id)) {
      const pal = palette.find(x => x.muline.id === mulineColor.id);
      icon = pal?.icon || icon;
    } else {
      mulineColorSet.add(mulineColor.id);
      iconID++;
      if (iconID > ICON_COUNT) {
        iconID = 0;
      }
    }
    
    palette.push({
      index,
      colorHex: rgbToHex(color),
      muline: mulineColor,
      icon,
      invertIcon: isColorDark(mulineColor.hex),
      count: 0
    });
  })

  return palette;
}


//     CMC 
//     CIE2000 2000
//     CIE1994 = 'CIE1994',
//     CIE1976 76
// ITP (only color.js)


//color.js
function getColorDifference(colorHex1: string, colorHex2: string): number {
  const color1 = new Color(colorHex1);
  const color2 = new Color(colorHex2);

  // CIE2000 is okay but gives more saturated colors
  // ITP seems okay too but give worse greens
  return color1.deltaE(color2, "ITP");
}

export function isColorDark(colorHex: string, threshold = 4.5) {
  const color1 = new Color(colorHex);
  const color2 = new Color('#000000'); //black - color of icons

  const contrast = color1.contrastWCAG21(color2);
  return contrast < threshold;
}


function _hasAlpha(colorsArray: Array<RGBA>) {
  return colorsArray.findIndex(color => color.a === 0) !== -1
}

function hasAlpha(pixelsPalette: Array<PaletteFromImg>) {
  const foundIndex = pixelsPalette.findIndex(pal => hexToRgb( pal.colorHex ).a === 0);
  return foundIndex !== -1
}
