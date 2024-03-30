import Jimp from "jimp";
import type { Palette } from "../../data/mulineData";
import { hexToRgb, rgbToHex } from "./generatePalette";
import PDFDocument from 'pdfkit';
import fs from 'fs';


//A4 ma na 350 dpi 2893 x 4092 px
//printing realted
const PAPER_MAX_WIDTH_PX = 740
const PAPER_MAX_HEIGHT_PX = 1070
const PAPER_MAX_WIDTH_PT = 550
const PAPER_MAX_HEIGHT_PT = 800
const MARGIN_PT = 18;
//Sizes of squre in pixels and icons depending on size of image (the larger img the less size of square)
const SCALE_SMALL = 64;
const SCALE_MEDIUM = 32;
const SCALE_BIG = 16;

// const SCALE_SMALL = 128;
// const SCALE_MEDIUM = 64;
// const SCALE_BIG = 24;

const SCALE_PREVIEW = 10;

const GRID_COLOR = 255;
// const GRID_COLOR_LIGHT = 170; //when next to dark colors
const GRID_COLOR_LIGHT = 4278244095; //when next to dark colors
const GRID_MIDDLE_COLOR = 4278190335; //red


const GRID_SIZE = 3;
const GRID_BIG_SIZE = 4;
const GRID_HIGHLIGHT_SIZE = 8;  //grid size for grid every 10 square

const GRID_SIZE_PREVIEW = 1;
const GRID_HIGHLIGHT_SIZE_PREVIEW = 3;  //grid size for grid every 10 square

const GRID_COUNTER = 10; //how often we have highlighted (thicker) grid

const THRESHOLD_SMALL = 20;
const THRESHOLD_BIG = 100;

const PATH_UPLOAD = 'static/images/upload/';
const PATH_PATTERN = 'static/images/pattern/';

// generating preview (image just scaled only a bit with grid)
export async function generatePreview(fileName: string): Promise<string> {
  const fullFileName = `${PATH_UPLOAD}${fileName}.png`;
  const resizedFileName = `${PATH_UPLOAD}${fileName}_preview.png`;
  const paletteFileName = `${PATH_UPLOAD}${fileName}_palette.png`;

  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const scale = SCALE_PREVIEW;

  const paletteSet = new Set<number>();
  const imagePixelsArray = loadImageToPixelsArray(image, paletteSet);

  await generatePaletteImage(paletteFileName, paletteSet);

  // get resized image pixel array
  const newWidth = getResizedDimension(ogWidth, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);
  const newHeight = getResizedDimension(ogHeight, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);
  const resizedImagePixelsArray = getPixelsOfGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, newHeight, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);

  //create resized image
  try {
    new Jimp(newWidth, newHeight, (err, image) => {
      if (err) throw err;
      let count = 0;
      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
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

// generating pattern (image scaled properly with grid, palette and icons)
export async function generatePattern(fileName: string, palette: Array<Palette>) {
  const fullFileName = `${PATH_UPLOAD}${fileName}.png`;
  const patternFileName = `${PATH_PATTERN}${fileName}_pattern.png`;
  const patternBWFileName = `${PATH_PATTERN}${fileName}_pattern_bw.png`;
  const patternPaletteFileName = `${PATH_PATTERN}${fileName}_pattern_palette.png`;

  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const scale = determineScale(ogWidth, ogHeight);
  const gridSize = scale === SCALE_BIG ? GRID_BIG_SIZE : GRID_SIZE;

  const imagePixelsArray = loadImageToPixelsArray(image, undefined, palette);

  // get resized image pixel array
  const newWidth = getResizedDimension(ogWidth, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const newHeight = getResizedDimension(ogHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const resizedImagePixelsArray = getPixelsOfGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, newHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const resizedImageBWPixelsArray = getPixelsOfGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, newHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE, true);

  // Icons related
  const iconFiles = await loadIconsFromPalette(palette, scale)

  // Text - counter on borders related
  const fontToLoad = scale === SCALE_SMALL ? Jimp.FONT_SANS_64_BLACK : scale === SCALE_MEDIUM ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_12_BLACK;
  //const fontToLoad = scale === SCALE_SMALL ? Jimp.FONT_SANS_32_BLACK : scale === SCALE_MEDIUM ? Jimp.FONT_SANS_16_BLACK : Jimp.FONT_SANS_8_BLACK;
  const font = await Jimp.loadFont(fontToLoad);

  let imagesCount = 0;
  const savePatterPDF = () => {
    //documnt width is 595.28 points, which is about 793 pixels
    //heigth is 841.89 pt = 1122 px
    //margins starnadr is .25inch = 18 points
    //so max image width should be width - 2 x margin = 559,28 pt = 745 px
    //max height is hegith - w x margin = 805.89 pt = 1070 px
    imagesCount++;
    if (imagesCount === 2) {
      imagesCount = 0;
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN_PT });
      doc.pipe(fs.createWriteStream(`${PATH_PATTERN}${fileName}_pattern.pdf`));
      // console.log(doc.page.width)
      doc.image(patternFileName, { width: PAPER_MAX_WIDTH_PT, align: 'center' });
      doc.addPage().image(patternBWFileName, { width: PAPER_MAX_WIDTH_PT, align: 'center' });
      doc.addPage().image(patternPaletteFileName, { fit: [PAPER_MAX_WIDTH_PT, PAPER_MAX_WIDTH_PT] });
      doc.end();
    }
  }

  const offset = scale*2;
  const resizedWidth = newWidth + offset * 2;
  const resizedHeight = newHeight + offset * 2;
  //create resized image
  try {
    //color
    let colorImg: Jimp;
    await new Jimp(resizedWidth, resizedHeight, async (err, image) => {
      let count = 0;
      for (let y = 0; y < resizedHeight; y++) {
        for (let x = 0; x < resizedWidth; x++) {
          if (x < offset || y < offset || x >= resizedWidth - offset || y >= resizedHeight - offset) {
            image.setPixelColor(0, x, y);
          } else {
            if (resizedImagePixelsArray[count]) {
              image.setPixelColor(resizedImagePixelsArray[count], x, y);
            }
            count++;
          }

        }
      }
      
      image = addIconsToImage(image, ogWidth, ogHeight, scale, offset, gridSize, palette, iconFiles);
      image = addTextToImage(image, resizedWidth, resizedHeight, scale, offset, gridSize, font);
      image.write(patternFileName, savePatterPDF);
      colorImg = image;
    });
    // BW
    new Jimp(resizedWidth, resizedHeight, async (err, image) => {
      let count = 0;
      for (let y = 0; y < resizedHeight; y++) {
        for (let x = 0; x < resizedWidth; x++) {
          image.setPixelColor(0, x, y);
          if (x < offset || y < offset || x >= resizedWidth - offset || y >= resizedHeight - offset) {
            image.setPixelColor(0, x, y);
          } else {
            if (resizedImageBWPixelsArray[count]) {
              image.setPixelColor(resizedImageBWPixelsArray[count], x, y);
            }
            count++;
          }

        }
      }
      image = addIconsToImage(image, ogWidth, ogHeight, scale, offset, gridSize, palette, iconFiles, true, colorImg);
      image = addTextToImage(image, resizedWidth, resizedHeight, scale, offset, gridSize, font);
      image.write(patternBWFileName, savePatterPDF);
    });

  } catch (err) {
    console.error("Something went wrong when generating the pattern: " + err);
  }

}

function loadImageToPixelsArray(image: Jimp, paletteSet?: Set<number>, palette?: Array<Palette>): Array<number> {
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const imagePixelsArray: number[] = [];
  //get pixels from og image to array
  for (let y = 0; y < ogHeight; y++) {
    for (let x = 0; x < ogWidth; x++) {
      let pixel = image.getPixelColor(x, y);
      if (paletteSet) { // for preview - add pixel to palette
        if (Jimp.intToRGBA(pixel).a !== 0) {
          paletteSet.add(pixel);
        }
      }
      if (palette) { // for pattern replace og colors with palette ones
        const alpha = Jimp.intToRGBA(pixel).a;
        const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
        if (paletteColor && alpha !== 0) { //transparent pixel were not included in palette
          const rgb = hexToRgb(paletteColor.muline.hex);
          pixel = Jimp.rgbaToInt(rgb.r, rgb.g, rgb.b, rgb.a);
        }
      }
      imagePixelsArray.push(pixel);  // value are in HEX number
    }
  }
  return imagePixelsArray;
}


export async function _generatePattern(fileName: string, palette: Array<Palette>) {
  
}

function addIconsToImage(
  image: Jimp, 
  width: number,
  height: number,
  scale: number,
  offset: number,
  gridSize: number,
  palette: Array<Palette>,
  iconFiles: Jimp[],
  bw = false,
  colorImg: Jimp | null = null
  ): Jimp {
  const iconsPositions = getIconsPositions(width, height, scale, gridSize);
  const srcImg = colorImg || image;
  for (const pos of iconsPositions) {
    const pixel = srcImg.getPixelColor(pos[0] + offset, pos[1] + offset);
    const alpha = Jimp.intToRGBA(pixel).a;
    if (alpha !== 0) {
      const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
      const iconID = Number(paletteColor?.icon.split('icon')[1]);
      const icon = iconFiles[iconID + 1];
      if (bw) {
        icon.brightness(-1);
      }
      image.composite(icon, pos[0] + offset, pos[1] + offset);
    }
  }
  return image;
}

function _addIconsToImage(
  image: Jimp, 
  width: number,
  height: number,
  scale: number,
  gridSize: number,
  palette: Array<Palette>,
  iconFiles: Jimp[],
  bw = false,
  colorImg: Jimp | null = null
  ): Jimp {
  const iconsPositions = getIconsPositions(width, height, scale, gridSize);
  const srcImg = colorImg || image;
  for (const pos of iconsPositions) {
    const pixel = srcImg.getPixelColor(pos[0] + scale*2, pos[1] + scale*2);
    const alpha = Jimp.intToRGBA(pixel).a;
    if (alpha !== 0) {
      const paletteColor = getColorFromPalette(rgbToHex(Jimp.intToRGBA(pixel)), palette);
      const iconID = Number(paletteColor?.icon.split('icon')[1]);
      const icon = iconFiles[iconID + 1];
      if (bw) {
        icon.brightness(-1);
      }
      image.composite(icon, pos[0] + scale*2, pos[1] + scale*2);
    }
  }
  return image;
}

function addTextToImage(
  image: Jimp,
  resizedWidth: number,
  resizedHeight: number,
  scale: number,
  offset: number,
  gridSize: number,
  font: Font
): Jimp {
  const txtDist = scale * GRID_COUNTER + gridSize * (GRID_COUNTER - 1) + GRID_HIGHLIGHT_SIZE;
  let i = 0;
  for (let y = offset + GRID_HIGHLIGHT_SIZE; y < resizedHeight; y += txtDist) {
    image = printTextToImage(image, font, Math.floor(offset/2) - 2, y, `${i * 10}`, offset/2);
    i++;
  }
  i = 1;
  for (let x = offset + GRID_HIGHLIGHT_SIZE + txtDist; x < resizedWidth; x += txtDist) {
    image = printTextToImage(image, font, x, Math.floor(offset/2), `${i * 10}`, offset/2);
    i++;
  }
  return image;
}

function splitImage(imagePixelsArray: Array<number>, ogWidth: number, ogHeight: number): Array<number> | Array<Array<number>> {
  if (ogWidth < THRESHOLD_BIG && ogHeight < THRESHOLD_BIG) {
    return imagePixelsArray;
  }

  const getMidTen = (dim: number): number => {
    let mid = dim / 2;
    while (mid%10 !== 0) {
      mid++;
    }
    return mid;
  }

  const midX = getMidTen(ogWidth);
  const midY = getMidTen(ogHeight);

  const imagePixels1: Array<number> = [];
  const imagePixels2: Array<number> = [];
  const imagePixels3: Array<number> = [];
  const imagePixels4: Array<number> = [];

  for (let y = 0; y < ogHeight; y++) {
    for (let x = 0; x < ogWidth; x++) {
      let pos = y * ogWidth + x;
      if (x <= midX) {
        if (y <= midY) {
          imagePixels1.push(imagePixelsArray[pos]);
        } else {
          imagePixels3.push(imagePixelsArray[pos]);
        }
      } else {
        if (y <= midY) {
          imagePixels2.push(imagePixelsArray[pos]);
        } else {
          imagePixels4.push(imagePixelsArray[pos]);
        }
      }
    }
  }

  return [imagePixels1, imagePixels2, imagePixels3, imagePixels4];
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

async function loadIconsFromPalette(palette: Array<Palette>, scale: number): Promise<Jimp[]> {
  const icons = getPaletteIcons(palette);
  const iconFiles: Array<Jimp> = [];
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

//Icons position without offset
function getIconsPositions(ogWidth: number, ogHeight: number, scale: number, gridSize: number): Array<number[]> {
  const iconsPositions: Array<number[]> = [];
  let iconPosX = GRID_HIGHLIGHT_SIZE;
  let iconPosY = GRID_HIGHLIGHT_SIZE;
  let counterX = 0;
  let counterY = 0;

  for (let i = 0; i < ogWidth * ogHeight; i++) {
    iconsPositions.push([iconPosX, iconPosY])
    counterX++;
    iconPosX += scale + (counterX % GRID_COUNTER === 0 ? GRID_HIGHLIGHT_SIZE : gridSize);

    if ((i + 1) % ogWidth === 0) {
      iconPosX = GRID_HIGHLIGHT_SIZE;
      counterX = 0;

      counterY++;
      iconPosY += scale + (counterY % GRID_COUNTER === 0 ? GRID_HIGHLIGHT_SIZE : gridSize);

    }
  }
  return iconsPositions;
}

function getColorFromPalette(colorHex: string, palette: Array<Palette>): Palette | undefined {
  return palette.find(col => col.colorHex.toLowerCase() === colorHex.toLowerCase() || col.muline.hex.toLowerCase() === colorHex.toLowerCase());
}

function getPaletteIcons(palette: Array<Palette>): Array<string> {
  const iconsSet = new Set<string>;
  for (const color of palette) {
    iconsSet.add(`${color.icon}${color.invertIcon ? '!' : ''}`);
  }
  return Array.from(iconsSet);
}

function determineScale(width: number, height: number): number {
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
  const numOfHighlightsNoEdges = Math.floor((ogDimension - 1) / GRID_COUNTER); //If dimention is divisible by GRID_COUNTER=10, then the last of numOfHighlist will be on the v.last column, so we only add 1 for fisrt column, isnetad of 2 for both last and first columns
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
  highlightGridWidth: number,
  bw = false
): number[] {

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
  const addGridCol = (counter: number) => {
    for (let i = 0; i < counter; i++) {
      row.push(GRID_COLOR);
    }
  }

  //first grid column before row of color
  addGridCol(highlightGridWidth);

  for (const pixel of ogImagePixelsArray) {
    for (let i = 0; i < scale; i++) { //add pixel color * scale (new width of one square)
      row.push(bw ? 4294967295 : pixel);
    }
    pxColCount++;
    const shouldBeHighlightCol = pxColCount % GRID_COUNTER === 0 || pxColCount === ogWidth;
    addGridCol(shouldBeHighlightCol ? highlightGridWidth : gridWidth);

    if (pxColCount === ogWidth) {
      if (pxRowCount === 0) {
        addGridRow(highlightGridWidth);  //add first grid row before adding proper rows
      }
      pxColCount = 0;
      for (let i = 0; i < scale; i++) { //push to image all pixel from current row
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

  return resizedImagePixelsArray;
}



function _getPixelsOfGriddedImage( //generic func
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
  const addGridCol = (counter: number) => {
    for (let i = 0; i < counter; i++) {
      row.push(GRID_COLOR);
    }
  }

  //first grid column before row of color
  addGridCol(highlightGridWidth);

  for (const [index, pixel] of ogImagePixelsArray.entries()) {
    for (let i = 0; i < scale; i++) { //add pixel color * scale (new width of one square)
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
      for (let i = 0; i < scale; i++) { //push to image all pixel from current row
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
      for (let i = 0; i < paletteSet.size; i++) {
        image.setPixelColor(iterator.next().value, i, 0)
      }
      image.write(path);
    });
  } catch (err) {
    console.error("Something went wrong when generating the color palette: " + err);
  }


}