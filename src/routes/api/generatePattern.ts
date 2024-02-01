import Jimp from "jimp";
import type { MULINE_TYPES, MulineData } from "../../data/mulineData";
import { ARIADNA } from "../../data/ariadna";

//A4 ma na 350 dpi 2893 x 4092 px

//test ones
// const SCALE_SMALL = 54;
// const SCALE_MEDIUM = 32;
// const SCALE_BIG = 16;

//Sizes of squre in pixels and icons depending on size of image (the larger img the less size of square)
//(these are porper ones)
const SCALE_SMALL = 128;
const SCALE_MEDIUM = 64;
const SCALE_BIG = 32;

const SCALE_PREVIEW = 10;

const GRID_COLOR = 255;

const GRID_SIZE = 1;
const GRID_BIG_SIZE = 2; // grid size for way bigger images (for now not used)
const GRID_HIGHLIGHT_SIZE = 3;  //grid size for grid every 10 square

const GRID_COUNTER = 10;

const THRESHOLD_SMALL = 20;
const THRESHOLD_BIG = 100;

const path = 'static/images/upload/';


export async function generatePreview(fileName: string): Promise<string> {
    const fullFileName = `${path}${fileName}.png`;
    const resizedFileName = `${path}${fileName}_preview.png`;
    const paletteFileName = `${path}${fileName}_palette.png`;

    const imagePixelsArray: number[] = [];
    const paletteSet = new Set<number>();

    const image = await Jimp.read(fullFileName);
    const ogWidth = image.bitmap.width;
    const ogHeight = image.bitmap.height;
    const scale = SCALE_PREVIEW;

    //get pixels from og image to array
    for (let y = 0; y < ogHeight; y ++) {
      for (let x = 0; x < ogWidth; x ++) {
        const pixel = image.getPixelColor(x, y)
        imagePixelsArray.push(pixel); //value are in HEX
        if(Jimp.intToRGBA(pixel).a !== 0) {
          paletteSet.add(pixel);
        }
        
        
      }
    }
    await generatePaletteImage(paletteFileName, paletteSet);

    // get resized image pixel array
    const newWidth = getResizedDimension(ogWidth, scale, GRID_SIZE, GRID_HIGHLIGHT_SIZE);
    const newHeight = getResizedDimension(ogHeight, scale, GRID_SIZE, GRID_HIGHLIGHT_SIZE);

    const resizedImagePixelsArray = getPixelsOgGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, scale, GRID_SIZE, GRID_HIGHLIGHT_SIZE);

    //create resized image
    try {
      await new Jimp(newWidth, newHeight, (err, image) => {
        if (err) throw err;
        let count = 0;
        for (let y = 0; y < newHeight; y ++) {
          for (let x = 0; x < newWidth; x ++) {
            //console.log(resizedImagePixelsArray[count])
            if (resizedImagePixelsArray[count]) {
              image.setPixelColor(resizedImagePixelsArray[count], x, y);
            } else {
              image.setPixelColor(0, x, y);
            }
            
            count++;
          }
        }
        image.write(resizedFileName);
      });
    } catch (err) {
      console.error("Something went wrong when generating the pattern preview: " + err);
    }
    return `${ogWidth} x ${ogHeight}`;
}


//not yet used
export async function generatePattern(fileName: string) {
  const fullFileName = `${path}${fileName}.png`;
  const paletteFileName = `${path}${fileName}_palette.png`;

  const imagePixelsArray: number[] = [];
  const paletteSet = new Set<number>();

  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const scale = determineScale(ogWidth, ogHeight);
  const gridSize = scale === SCALE_BIG ? GRID_BIG_SIZE : GRID_SIZE;

  //get pixels from og image to array
  for (let y = 0; y < ogHeight; y ++) {
    for (let x = 0; x < ogWidth; x ++) {
      imagePixelsArray.push(image.getPixelColor(x, y)); //value are in HEX
      paletteSet.add(image.getPixelColor(x, y));
    }
  }
  
  // get resized image pixel array
  const newWidth = getResizedDimension(ogWidth, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const newHeight = getResizedDimension(ogHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE);

  const resizedImagePixelsArray = getPixelsOgGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  
  // TODO read palette
  const palletteImg = await Jimp.read(paletteFileName);

  // const icon = await Jimp.read(`static/icons/icon0.png`);
  // icon.resize(scale, scale,  Jimp.RESIZE_NEAREST_NEIGHBOR);
  // Jimp.RESIZE_NEAREST_NEIGHBOR;
  // Jimp.RESIZE_BILINEAR;
  // Jimp.RESIZE_BICUBIC;
  // Jimp.RESIZE_HERMITE;
  // Jimp.RESIZE_BEZIER;

  //create resized image
  await new Jimp(newWidth, newHeight, (err, image) => {
    if (err) throw err;
    let count = 0;
    for (let y = 0; y < newHeight; y ++) {
      for (let x = 0; x < newWidth; x ++) {
        image.setPixelColor(resizedImagePixelsArray[count], x, y);
        count++;
      }
    }

    //test icons
    // image.composite(icon, 1, 1);

    image.write(resizedFileName);
  })

 
      
}

function determineScale(width: number, height: number) {
  if (width <= THRESHOLD_SMALL || height <= THRESHOLD_SMALL) {
    return SCALE_SMALL;
  }
  if (width > THRESHOLD_BIG || height > THRESHOLD_BIG) {
    return SCALE_BIG;
  }
  return SCALE_MEDIUM;
}

function getResizedDimension(
  ogDimension: number, //30 / 45
  scale: number, //10
  gridWidth: number, //1
  highlightGridWidth: number //3
): number {
  // num of highlits without the edges ones
  const numOfHighlightsNoEdges = Math.floor((ogDimension - 1)/ GRID_COUNTER); //If dimention is divisible by GRID_COUNTER=10, then the last of numOfHighlist will be on the v.last column, so we only add 1 for fisrt column, isnetad of 2 for both last and first columns
  // colors
  const pixels = ogDimension * scale;
  // we add 2 to highligth for edges
  const highlits = (numOfHighlightsNoEdges + 2) * highlightGridWidth;
  //normal grids that are not highlits
  const grids = (ogDimension - 1 - numOfHighlightsNoEdges) * gridWidth;
  return pixels + highlits + grids;

}

function getPixelsOgGriddedImage( //generic func
  ogImagePixelsArray: number[],
  ogWidth: number,
  ogHeight: number,
  resizedWidth: number,
  scale: number,
  gridWidth: number,
  highlightGridWidth: number) {

  const resizedImagePixelsArray: number[] = []
  let pxColCount = 0;
  let pxRowCount = 0;
  let row: number[] = [];

  const addGridRow = (highlight = 1) => {
    for (let h = 0; h < highlight; h++) {
      for (let i = 0; i < resizedWidth; i++) {
        resizedImagePixelsArray.push(GRID_COLOR)
      }
    }
    
  }

  const addGridCol = (counter = gridWidth) => {
    for(let i = 0; i < counter; i++) {
      row.push(GRID_COLOR);
    }
  }

  addGridCol(highlightGridWidth);
  
  for (const pixel of ogImagePixelsArray) {
    for(let i = 0; i < scale; i++) {
      row.push(pixel);
    }
    pxColCount++;
    const shouldBeHighlightCol = pxColCount % GRID_COUNTER === 0 || pxColCount === ogWidth;
    addGridCol(shouldBeHighlightCol ? highlightGridWidth : gridWidth);
    
    if (pxColCount === ogWidth) {
      if (pxRowCount === 0) {
        addGridRow(highlightGridWidth);  //add first grid row before adding proper rows
      }
      pxColCount = 0;
      for(let i = 0; i < scale; i++) {
        row.forEach(px => resizedImagePixelsArray.push(px));
      }
      pxRowCount++;
      const shouldBeHighlightRow = pxRowCount % GRID_COUNTER === 0 || pxRowCount === ogHeight;
      addGridRow(shouldBeHighlightRow ? highlightGridWidth : gridWidth);
      if (pxRowCount !== ogHeight) {
        
        row = [];
        addGridCol(highlightGridWidth);
      }
    }
  }
  return resizedImagePixelsArray;
}

async function generatePaletteImage(path: string, paletteSet: Set<number>) {
  try {
    await new Jimp(paletteSet.size, 1, (err, image) => {
      if (err) {
        throw err;
      }
      const iterator = paletteSet.values()
      for (let i = 0; i < paletteSet.size; i ++) {
        image.setPixelColor(iterator.next().value, i, 0)
      }
      image.write(path);
    });
  } catch (err) {
    console.error("Something went wrong when generating the color palette: " + err);
  }
  
 
}