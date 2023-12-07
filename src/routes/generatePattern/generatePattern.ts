import Jimp from "jimp";
import { readFileSync } from "node:fs";

const SCALE_SMALL = 8;
const SCALE_MEDIUM = 6;
const SCALE_BIG = 4;

const GRID_COLOR = 255;

const THRESHOLD_SMALL = 20;
const THRESHOLD_BIG = 100;

export  async function generatePattern(fileName: string) {
    const path = 'static/images/';
    const fullFileName = `${path}${fileName}.png`;
    const resizedFileName = `${path}${fileName}_resize.png`;

    const imagePixelsArray: number[] = [];
    const paletteSet = new Set();

    const image = await Jimp.read(fullFileName);
    const ogWidth = image.bitmap.width;
    const ogHeight = image.bitmap.height;
    const scale = determineScale(ogWidth, ogHeight);
    console.log(scale)
    // image
    //   .scale(scale) // resize
    //   .write(resizedFileName); // save

    for (let y = 0; y < ogHeight; y ++) {
      for (let x = 0; x < ogWidth; x ++) {
        imagePixelsArray.push(image.getPixelColor(x, y)); //value are in HEX
        paletteSet.add(image.getPixelColor(x, y));
      }
    }
    // console.log(paletteSet)
    // console.log(imagePixelsArray)  
    // console.log(typeof Jimp.intToRGBA(imagePixelsArray[0]))

    const resizedImagePixelsArray = getPixelsOfResizedImage(imagePixelsArray, ogWidth, ogHeight, scale)
    const newWidth = ogWidth * scale + ogWidth + 1; // width+1 is for grid
    const newHeight = ogHeight * scale + ogHeight + 1;
    

    await new Jimp(newWidth, newHeight, (err, image) => {
      if (err) throw err;
      let count = 0;
      for (let y = 0; y < newHeight; y ++) {
        for (let x = 0; x < newWidth; x ++) {
          image.setPixelColor(resizedImagePixelsArray[count], x, y);
          count++;
        }
      }
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

function getPixelsOfResizedImage(
  ogImagePixelsArray: number[],
  ogWidth: number,
  ogHeight: number,
  scale: number) {
  
  const newWidth = ogWidth * scale + ogWidth + 1; // width+1 is for grid
  const newHeight = ogHeight * scale + ogHeight + 1;

  const resizedImagePixelsArray: number[] = []

  const addGridRow = () => {
    for (let i = 0; i < newWidth; i++) {
      resizedImagePixelsArray.push(GRID_COLOR)
    }
  }

  
  addGridRow();
  let pxCount = 0;
  let gridCount = 0;
  let row: number[] = [];
  row.push(GRID_COLOR);
  for (const pixel of ogImagePixelsArray) {
    
    for(let i = 0; i < scale; i++) {
      row.push(pixel);
    }
    row.push(GRID_COLOR);
    pxCount++;
    if (pxCount === ogWidth) {
      pxCount = 0;
      for(let i = 0; i < scale; i++) {
        row.forEach(px => resizedImagePixelsArray.push(px));
      }
      addGridRow();
      row = [];
      row.push(GRID_COLOR)
    }
  }
  console.log(newWidth* newHeight)
  console.log(resizedImagePixelsArray.length)
  return resizedImagePixelsArray;


}