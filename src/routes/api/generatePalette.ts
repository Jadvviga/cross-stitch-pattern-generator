import Jimp from "jimp";
import { MULINE_TYPES, type MulineData } from "../../data/mulineData";
import { ARIADNA } from "../../data/ariadna";
import { DMC } from "../../data/dmc";
import colorsea from 'colorsea';


const path = 'static/images/';

function getMulinePalette(mulineType: MULINE_TYPES) {
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

function rgbToHex({r, g, b}: RGBA) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex: string) {
  var result = /^#?([A-Fa-f\d]{2})([A-Fa-f\d]{2})([A-Fa-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

//zrobic mapowanie bezposrednio do kolorow mulin
// kazdy kolor zapisuje sie do plaety obraka i kazdy kolejny kolor najpierw
//sprawdza czy w palecie obrazka jest juz wystarczajacy kolor - dodac to jako opcje do togglowania
export async function loadPalette(fileName: string, mulineType: MULINE_TYPES): Promise<RGBA[]> {
  const paletteFileName = `${path}${fileName}_palette.png`;
  const mulinePalette = getMulinePalette(mulineType);
  console.log(mulinePalette)
  const ogImageName = `${path}${fileName}.png`;
  const paletteImage = await Jimp.read(paletteFileName);
  const colors = [];
  const palette: MulineData[] = [];

  for (let i = 0; i < paletteImage.bitmap.width; i++) {
    colors.push(Jimp.intToRGBA(paletteImage.getPixelColor(i, 0)));
  }
  
  colors.forEach(color => {
    console.log(color, rgbToHex(color))
  })
  ARIADNA.forEach(color => {
    console.log(color.id)
  })
  //console.log(ARIADNA["1500"])

  return colors;
}

function getColorFromPalette(colorID: string, palette: Array<MulineData>) {
  return palette.find(col => col.id === colorID);
}


function getColorDifference(colorHex1: string, colorHex2: string): number {
  const col1 = hexToRgb(colorHex1);
  const col2 = hexToRgb(colorHex2);
  
  const color1 = colorsea.lab(col1.r, col1.g, col1.b);
  const color2 = colorsea.lab(col2.r, col2.g, col2.b);


  return color1.deltaE(color2, "CMC");
}
