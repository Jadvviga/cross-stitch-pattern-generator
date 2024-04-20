import Jimp from "jimp";
import { MULINE_TYPES, type MulineData, type Palette } from "../../data/mulineData";
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

//zrobic mapowanie bezposrednio do kolorow mulin
// kazdy kolor zapisuje sie do plaety obraka i kazdy kolejny kolor najpierw
//sprawdza czy w palecie obrazka jest juz wystarczajacy kolor - dodac to jako opcje do togglowania
export async function loadPalette(fileName: string, mulineType: MULINE_TYPES): Promise<Palette[]> {
  const paletteFileName = `${path}/${fileName}/palette.png`;
  const mulinePalette = getMulinePalette(mulineType);
  const paletteImage = await Jimp.read(paletteFileName);
  let colors: Array<RGBA> = [];
  const palette: Array<Palette> = [];
  const mulineColorSet = new Set<string>;

  for (let i = 0; i < paletteImage.bitmap.width; i++) {
    colors.push(Jimp.intToRGBA(paletteImage.getPixelColor(i, 0)));
  }

  //if there is alpha - remove it from palette and start icons from indx 0 instead of -1
  // icon-1.png is empty image - used when we have most common color when we don't have alpha
  let iconID = -1;
  if (hasAlpha(colors)) {
    iconID = 0;
    colors = colors.filter(color => color.a !== 0);
  }
  colors.forEach((color, index) => {
    const colorDistances: number[] = [];
    mulinePalette.forEach(mulineColor => {
      colorDistances.push(getColorDifference(mulineColor.hex, rgbToHex(color)))
    });
    const minDist = Math.min(...colorDistances);
    const minIndex = colorDistances.indexOf(minDist);

    let icon = `icon${iconID}`;
    const mulineColor = mulinePalette[minIndex];
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


function hasAlpha(colorsArray: Array<RGBA>) {
  return colorsArray.findIndex(color => color.a === 0) !== -1
  
}

//colorsea
// function getColorDifference_(colorHex1: string, colorHex2: string): number {
//   const col1 = hexToRgb(colorHex1);
//   const col2 = hexToRgb(colorHex2);
  
//   const color1 = colorsea.lab(col1.r, col1.g, col1.b);
//   const color2 = colorsea.lab(col2.r, col2.g, col2.b);



//   // CIE2000 not doing well with greens, otherwise very gud
//   // CIE1976 is better
//   return color1.deltaE(color2, "CIE1976");
// }
