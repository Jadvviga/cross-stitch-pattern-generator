import Jimp from "jimp";
import type { Palette } from "../../data/mulineData";
import { hexToRgb, isColorDark, rgbToHex } from "./generatePalette";

//A4 ma na 350 dpi 2893 x 4092 px

//test ones
// const SCALE_SMALL = 54;
// const SCALE_MEDIUM = 32;
// const SCALE_BIG = 16;

//Sizes of squre in pixels and icons depending on size of image (the larger img the less size of square)
//(these are porper ones)
const SCALE_SMALL = 64;
const SCALE_MEDIUM = 32;
const SCALE_BIG = 16;

const SCALE_PREVIEW = 10;

const GRID_COLOR = 255;
// const GRID_COLOR_LIGHT = 170; //when next to dark colors
const GRID_COLOR_LIGHT = 4278244095; //when next to dark colors


const GRID_SIZE = 2;
const GRID_BIG_SIZE = 2;
const GRID_HIGHLIGHT_SIZE = 5;  //grid size for grid every 10 square

const GRID_SIZE_PREVIEW = 1;
const GRID_HIGHLIGHT_SIZE_PREVIEW = 3;  //grid size for grid every 10 square

const GRID_COUNTER = 10; //how often we have highlighted (thicker) grid

const THRESHOLD_SMALL = 20;
const THRESHOLD_BIG = 100;

const path = 'static/images/upload/';

// generating preview (image just scaled only a bit with grid)
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
        const pixel = image.getPixelColor(x, y) //value are in HEX number
        //if ((y==9 && x==10) || (y==0 && x==0)) console.log(Jimp.intToRGBA(pixel))
        imagePixelsArray.push(pixel); 
        if(Jimp.intToRGBA(pixel).a !== 0) {
          paletteSet.add(pixel);
        }
        
        
      }
    }
    await generatePaletteImage(paletteFileName, paletteSet);

    // get resized image pixel array
    const newWidth = getResizedDimension(ogWidth, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);
    const newHeight = getResizedDimension(ogHeight, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);

    const resizedImagePixelsArray = getPixelsOfGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, newHeight, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);


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


// generating pattern (image scaled properly with gri, palette and icons)
export async function generatePattern(fileName: string, palette: Array<Palette>) {
  const fullFileName = `${path}${fileName}.png`;
  const resizedFileName = `${path}${fileName}_pattern.png`;

  const imagePixelsArray: number[] = [];

  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const scale = determineScale(ogWidth, ogHeight);
  const gridSize = scale === SCALE_BIG ? GRID_BIG_SIZE : GRID_SIZE;

  //get pixels from og image to array
  for (let y = 0; y < ogHeight; y ++) {
    for (let x = 0; x < ogWidth; x ++) {
      let pixel = image.getPixelColor(x, y);
      let alpha = Jimp.intToRGBA(pixel).a;
      const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
      if (paletteColor && alpha !== 0) { //transparent pixel were not included in palette
        const rgb = hexToRgb(paletteColor.muline.hex);
        pixel = Jimp.rgbaToInt(rgb.r, rgb.g, rgb.b, rgb.a);
      }
      imagePixelsArray.push(pixel);  //value are in HEX number
      
    }
  }
  console.log('prepared pixel array')
  console.log(ogWidth , ogHeight)
  
  // get resized image pixel array
  const newWidth = getResizedDimension(ogWidth, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const newHeight = getResizedDimension(ogHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE);

  const iconsPositions: Array<number[]> = [];
  const resizedImagePixelsArray = getPixelsOfGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, newHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  

  console.log('got resized pixel array')
  console.log(newWidth*newHeight)
  console.log(resizedImagePixelsArray.length)
  
  // possible resize algos fro icon
  // Jimp.RESIZE_NEAREST_NEIGHBOR;
  // Jimp.RESIZE_BILINEAR;
  // Jimp.RESIZE_BICUBIC;
  // Jimp.RESIZE_HERMITE;
  // Jimp.RESIZE_BEZIER;
  
  let iconPosX = GRID_HIGHLIGHT_SIZE;
  let iconPosY = GRID_HIGHLIGHT_SIZE;
  let counterX = 0;
  let counterY = 0;
  
  for(let i = 0; i < ogWidth * ogHeight; i++ ) {
    iconsPositions.push([iconPosX, iconPosY])
    counterX++;
    iconPosX += scale + (counterX%GRID_COUNTER === 0  ? GRID_HIGHLIGHT_SIZE : gridSize);
    
    if ((i+1) % ogWidth === 0) {
      iconPosX = GRID_HIGHLIGHT_SIZE;
      counterX = 0;
     
      counterY++;
      iconPosY += scale + (counterY%GRID_COUNTER === 0  ? GRID_HIGHLIGHT_SIZE : gridSize);
      
    }
  }

  //create resized image
  try {
    await new Jimp(newWidth, newHeight, async (err, image) => {
     
      let count = 0;
      for (let y = 0; y < newHeight; y ++) {
        for (let x = 0; x < newWidth; x ++) {
          if (resizedImagePixelsArray[count]) {
            image.setPixelColor(resizedImagePixelsArray[count], x, y);
          } else {
            image.setPixelColor(0, x, y);
          }
          count++;
        }
      }

      for(const pos of iconsPositions) {
        const pixel = image.getPixelColor( pos[0], pos[1]);
        const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
        const icon = await Jimp.read(`static/images/icons/${paletteColor?.icon}.png`);
        if (paletteColor?.invertIcon) {
          icon.invert();
        }
        icon.resize(scale, scale,  Jimp.RESIZE_NEAREST_NEIGHBOR);
        image.composite(icon, pos[0], pos[1]);
        //image.setPixelColor(GRID_COLOR_LIGHT, pos[0], pos[1])
      }

      
      image.write(resizedFileName);
    });
  } catch (err) {
    console.error("Something went wrong when generating the pattern: " + err);
  }
}

function getColorFromPalette(colorHex: string, palette: Array<Palette>): Palette | undefined {
  return palette.find(col => col.colorHex.toLowerCase() === colorHex.toLowerCase()  || col.muline.hex.toLowerCase()  === colorHex.toLowerCase());
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
  // num of highlights without the edges ones
  const numOfHighlightsNoEdges = Math.floor((ogDimension - 1)/ GRID_COUNTER); //If dimention is divisible by GRID_COUNTER=10, then the last of numOfHighlist will be on the v.last column, so we only add 1 for fisrt column, isnetad of 2 for both last and first columns
  // colors
  const pixels = ogDimension * scale;
  // we add 2 to highlight for edges
  const highlights = (numOfHighlightsNoEdges + 2) * highlightGridWidth;
  //normal grids that are not highlights
  const grids = (ogDimension - 1 - numOfHighlightsNoEdges) * gridWidth;
  return pixels + highlights + grids;

}

function getPixelsOfGriddedImage( //generic func
  ogImagePixelsArray: number[],
  ogWidth: number,
  ogHeight: number,
  resizedWidth: number,
  resizedHeight: number,
  scale: number,
  gridWidth: number,
  highlightGridWidth: number
  ): number[] {

    
  let iconsPositions: Array<number[]>

  const resizedImagePixelsArray: number[] = []
  let pxColCount = 0;
  let pxRowCount = 0;
  let row: number[] = [];

  // add grid row to whole image array
  const addGridRow = (highlight: number) => {
    for (let h = 0; h < highlight; h++) {
      for (let i = 0; i < resizedWidth; i++) {
        resizedImagePixelsArray.push(GRID_COLOR)
      }
    }
    
  }

  //add grid column to current row
  const addGridCol = ( counter: number) => {
    for(let i = 0; i < counter; i++) {
      row.push(GRID_COLOR);
    }
  }

  //first grid column before row of color
  addGridCol(highlightGridWidth);
  
  for(const [index, pixel] of ogImagePixelsArray.entries()) {
    for(let i = 0; i < scale; i++) { //add pixel color * scale (new width of one square)
      row.push(pixel);
    }
    pxColCount++;
    const shouldBeHighlightCol = pxColCount % GRID_COUNTER === 0 || pxColCount === ogWidth;
    addGridCol( shouldBeHighlightCol ? highlightGridWidth : gridWidth);
    
    if (pxColCount === ogWidth) {
      if (pxRowCount === 0) {
        addGridRow(highlightGridWidth);  //add first grid row before adding proper rows
      }
      pxColCount = 0;
      for(let i = 0; i < scale; i++) { //push to image all pixel from current row
        row.forEach(px => resizedImagePixelsArray.push(px));
      }
      pxRowCount++;
      const shouldBeHighlightRow = pxRowCount % GRID_COUNTER === 0 || pxRowCount === ogHeight;
      addGridRow(shouldBeHighlightRow ? highlightGridWidth : gridWidth);
      if (pxRowCount !== ogHeight) { //if not end of image, clear row array and will go further
        row = [];
        
        addGridCol(highlightGridWidth); //first grid column before first row of color
      }
    }
  }
  //WIP trying to add lighter grid around dark pixels
  /*
  const notInOutsideGrids = (x: number, y: number) => {
    return (x >= highlightGridWidth && x < resizedWidth - highlightGridWidth
      &&  y >= highlightGridWidth && y < resizedHeight - highlightGridWidth)
  }

  let xCount = -100;
  let yCount = -100;

  let rowGridCounter = 0;
  let colGridCounter = 0;
  let onHighlightedRowGrid = 0;

  let pos = (x: number, y: number,) => { return y * resizedWidth + x}
  
  for (let y=0; y < resizedHeight; y++) {
    if (yCount % (scale+1) === 0) { // current (x,y) is on row grid
      rowGridCounter++;
    }
    for (let x=0; x < resizedWidth; x++) {
      if(notInOutsideGrids(x, y)){
        if (xCount === -100) {
          xCount = 0;
          yCount = 1;
          iconsPositions.push([x, y])
          // resizedImagePixelsArray[pos(x, y)] = GRID_COLOR_LIGHT;
        }
        if (yCount % (scale+1) === 0 || onHighlightedRowGrid !== 0) { // current (x,y) is on row grid
          let color = GRID_COLOR;
          const pixelOnTop = rgbToHex(Jimp.intToRGBA(resizedImagePixelsArray[pos(x, y - highlightGridWidth)]));
          const pixelOnBottom = rgbToHex(Jimp.intToRGBA(resizedImagePixelsArray[pos(x, y + highlightGridWidth)]));
          if (isColorDark(pixelOnTop) || isColorDark(pixelOnBottom)) {
            color = GRID_COLOR_LIGHT;
          }
          const currentGridWidth = rowGridCounter % GRID_COUNTER === 0 || onHighlightedRowGrid !== 0 ? highlightGridWidth : gridWidth;
          for(let i=0;i < currentGridWidth; i++) {
            resizedImagePixelsArray[pos(x, y+i)] = color;
          }
          if (currentGridWidth === highlightGridWidth) {
            yCount--;
            onHighlightedRowGrid++;
            
          }
          

         
        } 
          if (onHighlightedRowGrid === resizedWidth - 2*highlightGridWidth) {
            console.log(onHighlightedRowGrid)
            onHighlightedRowGrid = 0;
            yCount--;
          }
        

        if (xCount % scale === 0 && xCount > 0) { // current (x,y) is on column grid
          let color = GRID_COLOR;
          colGridCounter++;
          const currentGridWidth = colGridCounter % GRID_COUNTER === 0 ? highlightGridWidth : gridWidth;
          const pixelOnLeft = rgbToHex(Jimp.intToRGBA(resizedImagePixelsArray[pos(x - highlightGridWidth, y)]));
          const pixelOnRight = rgbToHex(Jimp.intToRGBA(resizedImagePixelsArray[pos(x + highlightGridWidth, y)]));
          if (isColorDark(pixelOnRight) || isColorDark(pixelOnLeft)) {
            color = GRID_COLOR_LIGHT
          }
          
          for(let i=0;i < currentGridWidth; i++) {
            if ( resizedImagePixelsArray[pos(x+i, y)] !== GRID_COLOR_LIGHT) {
              resizedImagePixelsArray[pos(x+i, y)] = color;
            }
          }
          xCount = -currentGridWidth
          
          //ogranac icons positions
          //if ((yCount- 1) )

          
    
        } 
        if (xCount !== -100) {
          xCount++;
        }
      } else {
        if (xCount !== -100) {
          xCount = 0;
          colGridCounter = 0;
        }
      }
      // y * width + x

      
    }
    if (yCount !== -100) {
      yCount++;
    }
  }
  */
  // iconsPositions.push([0, 0])
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