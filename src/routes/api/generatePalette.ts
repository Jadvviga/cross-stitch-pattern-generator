import Jimp from "jimp";
import { MULINE_TYPES, type MulineData } from "../../data/mulineData";
import { ARIADNA } from "../../data/ariadna";
import { DMC } from "../../data/dmc";


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
  
//   colors.forEach(color => {
//     palette
//   })

  return colors;
}
