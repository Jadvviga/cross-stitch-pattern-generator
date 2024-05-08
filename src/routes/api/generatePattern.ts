import Jimp from "jimp";
import type { Palette } from "../../data/mulineData";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { addIconsToImage, addTextToImage, generatePaletteImage, loadIconsFromPalette, loadImageToPixelsArray } from "./generationUtils";
import JSZip from "jszip";


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
const WHITE = 4294967295;

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
  const uploadDir = `static/images/upload/${fileName}`;
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir);
    }
  const fullFileName = `${uploadDir}/${fileName}.png`;
  const resizedFileName = `${uploadDir}/preview.png`;
  const paletteFileName = `${uploadDir}/palette.png`;

  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const scale = SCALE_PREVIEW;

  const paletteSet = new Set<number>();
  const imagePixelsArray: number[] = [];
  //get pixels from og image to array
  for (let y = 0; y < ogHeight; y++) {
      for (let x = 0; x < ogWidth; x++) {
          let pixel = image.getPixelColor(x, y);
          paletteSet.add(pixel);
          imagePixelsArray.push(pixel);  // value are in HEX number
      }
  }

  await generatePaletteImage(paletteFileName, paletteSet);

  // get resized image pixel array
  const newWidth = getResizedDimension(ogWidth, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);
  const newHeight = getResizedDimension(ogHeight, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);
  const resizedImagePixelsArray = getPixelsOfGriddedImage(imagePixelsArray, ogWidth, ogHeight, newWidth, newHeight, scale, GRID_SIZE_PREVIEW, GRID_HIGHLIGHT_SIZE_PREVIEW);

  //create resized, preveiw image
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

export async function generatePattern(fileName: string, palette: Array<Palette>) {
  const patternDir = `${PATH_PATTERN}${fileName}`;
  if (!fs.existsSync(patternDir)){
      fs.mkdirSync(patternDir);
  }
  fs.copyFileSync(`${PATH_UPLOAD}${fileName}/preview.png`, `${patternDir}/preview.png`);
  //TODO try making splitting more clear - instead of curretn process, try:
  // split image -> reapeat same process for each image (generating images)
  //in reapeat, inlcude another split if possible 

  //OR
  //add additional process of splitting image itself, and recommend it to user if the image is above 200 pixels

  //OR
  //just make sure that the single image for page does not cross 60 in splitting process


  const fullFileName = `${PATH_UPLOAD}${fileName}/${fileName}.png`;
  const image = await Jimp.read(fullFileName);
  const ogWidth = image.bitmap.width;
  const ogHeight = image.bitmap.height;
  const scale = determineScale(ogWidth, ogHeight);

  // Icons related
  const iconFiles = await loadIconsFromPalette(palette, scale)

  // Text - counter on borders related
  const fontToLoad = scale === SCALE_SMALL ? Jimp.FONT_SANS_64_BLACK : scale === SCALE_MEDIUM ? Jimp.FONT_SANS_32_BLACK : Jimp.FONT_SANS_12_BLACK;
  //const fontToLoad = scale === SCALE_SMALL ? Jimp.FONT_SANS_32_BLACK : scale === SCALE_MEDIUM ? Jimp.FONT_SANS_16_BLACK : Jimp.FONT_SANS_8_BLACK;
  const font = await Jimp.loadFont(fontToLoad);

  const firstImagePixelsArray = loadImageToPixelsArray(image, palette);
  const splitImagesArrays = splitImage(firstImagePixelsArray, ogWidth, ogHeight);

  const expectedImagesNumber = splitImagesArrays.length * 2; //times 2 cuz we count color + BW
  const imagesForPDFCol: Array<string> = [];
  const imagesForPDFBW: Array<string> = [];
  const shouldRotateForPrinting =ogWidth > ogHeight;
  for (const [index, imagePixelsArray] of splitImagesArrays.entries()) {
    await generateImagePattern(patternDir, imagePixelsArray.array, imagePixelsArray.width, imagePixelsArray.height, imagePixelsArray.startX, imagePixelsArray.startY, index, imagesForPDFCol, imagesForPDFBW, expectedImagesNumber, scale, iconFiles, font, palette, shouldRotateForPrinting);
  }

}

async function generateImagePattern(
  patternDir: string,
  imagePixelsArray: Array<number>,
  width: number,
  height: number,
  startingNumberX: number,
  startingNumberY: number,
  index: number,
  imagesForPDFCol: Array<string>,
  imagesForPDFBW: Array<string>,
  expectedImagesNumber: number,
  scale: number,
  iconFiles: Array<Jimp>,
  font: Font,
  palette: Array<Palette>,
  shouldRotateForPrinting: boolean
) {

  const patternBWFileName = `${patternDir}/pattern_bw_${index}.png`;
  const patternFileName = `${patternDir}/pattern_${index}.png`;

  const gridSize = scale === SCALE_BIG ? GRID_BIG_SIZE : GRID_SIZE;

  // get resized image pixel array
  const newWidth = getResizedDimension(width, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const newHeight = getResizedDimension(height, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const resizedImagePixelsArray = getPixelsOfGriddedImage(imagePixelsArray, width, height, newWidth, newHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE);
  const resizedImageBWPixelsArray = getPixelsOfGriddedImage(imagePixelsArray, width, height, newWidth, newHeight, scale, gridSize, GRID_HIGHLIGHT_SIZE, true);

  const savePatterPDF = (imageFileName: string) => {
    if (imageFileName.includes('bw')) {
      imagesForPDFBW.push(imageFileName);
    } else {
      imagesForPDFCol.push(imageFileName)
    }

    if (imagesForPDFCol.length + imagesForPDFBW.length === expectedImagesNumber) {
      generatePDF(patternDir, expectedImagesNumber, imagesForPDFCol.concat(imagesForPDFBW), shouldRotateForPrinting);
    }
  }

  const offset = scale * 2;
  const resizedWidth = newWidth + offset * 2;
  const resizedHeight = newHeight + offset * 2;
  try {
    //color
    let colorImg: Jimp;
    await new Jimp(resizedWidth, resizedHeight, async (err, image) => {
      let count = 0;
      for (let y = 0; y < resizedHeight; y++) {
        for (let x = 0; x < resizedWidth; x++) {
          image.setPixelColor(WHITE, x, y);
          if (x < offset || y < offset || x >= resizedWidth - offset || y >= resizedHeight - offset) {
            image.setPixelColor(WHITE, x, y);
          } else {
            if (resizedImagePixelsArray[count]) {
              image.setPixelColor(resizedImagePixelsArray[count], x, y);
            }
            count++;
          }

        }
      }

      image = addIconsToImage(image, width, height, scale, offset, gridSize, GRID_HIGHLIGHT_SIZE, palette, iconFiles);
      image = addTextToImage(image, width, height, scale, offset, gridSize, GRID_HIGHLIGHT_SIZE, font, startingNumberX, startingNumberY);
      image.write(patternFileName, () => { savePatterPDF(patternFileName) });
      colorImg = image;
    });
    // BW
    new Jimp(resizedWidth, resizedHeight, async (err, image) => {
      let count = 0;
      for (let y = 0; y < resizedHeight; y++) {
        for (let x = 0; x < resizedWidth; x++) {
          image.setPixelColor(WHITE, x, y);
          if (x < offset || y < offset || x >= resizedWidth - offset || y >= resizedHeight - offset) {
            image.setPixelColor(WHITE, x, y);
          } else {
            if (resizedImageBWPixelsArray[count]) {
              image.setPixelColor(resizedImageBWPixelsArray[count], x, y);
            }
            count++;
          }

        }
      }

      image = addIconsToImage(image, width, height, scale, offset, gridSize, GRID_HIGHLIGHT_SIZE, palette, iconFiles, true, colorImg);
      image = addTextToImage(image, width, height, scale, offset, gridSize, GRID_HIGHLIGHT_SIZE, font, startingNumberX, startingNumberY);

      image.write(patternBWFileName, () => { savePatterPDF(patternBWFileName) });
    });

  } catch (err) {
    console.error("Something went wrong when generating the pattern: " + err);
  }


}


function generatePDF(
  patternDir: string,
  expectedImagesNumber: number,
  imagesForPDF: Array<string>,
  shouldRotate: boolean
) {
  //documnt width is 595.28 points, which is about 793 pixels
  //heigth is 841.89 pt = 1122 px
  //margins starnadr is .25inch = 18 points
  //so max image width should be width - 2 x margin = 559,28 pt = 745 px
  //max height is hegith - w x margin = 805.89 pt = 1070 px

  const previewFileName = `${patternDir}/preview.png`;
  const patternPaletteFileName = `${patternDir}/pattern_palette.png`;
  const patternBaseFileName = `${patternDir}/pattern_0.png`;
  const patternBaseBWFileName = `${patternDir}/pattern_bw_0.png`;
  
  const patternPDFFileName = `${patternDir}/pattern.pdf`;

  const addRotatedImage = (doc: PDFKit.PDFDocument, image: string) => {
    doc.rotate(90, {origin : [0, 0]});
    doc.image(image, 0, -PAPER_MAX_WIDTH_PT,  { fit: [PAPER_MAX_HEIGHT_PT, PAPER_MAX_WIDTH_PT] });
    doc.restore();
  }

  const addPageWithImage = (doc: PDFKit.PDFDocument, image: string) => {
    doc.addPage();
    if (shouldRotate) {
      addRotatedImage(doc, image);
    } else {
      doc.image(image, { fit: [PAPER_MAX_WIDTH_PT, PAPER_MAX_HEIGHT_PT] });
    }
    doc.text('Pixel to Pattern', doc.page.width/2 - 50, doc.page.height - 15, { lineBreak: false });
  }

  try {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN_PT });
    const pdfWriteStream = fs.createWriteStream(patternPDFFileName)
    doc.pipe(pdfWriteStream);
    doc.image(previewFileName, { fit: [PAPER_MAX_WIDTH_PT, PAPER_MAX_HEIGHT_PT/2] });
    doc.image(patternPaletteFileName, { fit: [PAPER_MAX_WIDTH_PT, PAPER_MAX_HEIGHT_PT/2] } );
    doc.text('Pixel to Pattern', doc.page.width/2 - 50, doc.page.height - 15, {lineBreak: false});
    if (expectedImagesNumber > 2) { //image is split
      for (const image of imagesForPDF) {
        if (!image.includes('_0')) {
            addPageWithImage(doc, image);
        }
      }
    } else {
      addPageWithImage(doc, patternBaseFileName);
      addPageWithImage(doc, patternBaseBWFileName);
    }

    doc.end();

    pdfWriteStream.on('finish', () => {
      generateZip(patternDir);
    })
  } catch (err) {
    console.error("Something went wrong when generating PDF: " + err);
  }

}

async function generateZip(
  patternDir: string
) {
  const patternPDFFileName = `${patternDir}/pattern.pdf`;
  const patternZipFileName = `${patternDir}/pattern_images.zip`;
  const patternZipAllFileName = `${patternDir}/pattern_all.zip`;

  try {
    let zip = new JSZip();
    for (const file of fs.readdirSync(patternDir)) {
      if (!file.includes('.pdf')) {
        let fileContent = fs.readFileSync(`${patternDir}/${file}`);
        zip.file(file, fileContent);
      }
    }
    zip.generateAsync({ type: "nodebuffer" }).then((content) => {
      fs.writeFileSync(patternZipFileName, content);
    });

    let fileContent = fs.readFileSync(patternPDFFileName);
    zip.file(`pattern.pdf`, fileContent);
    zip.generateAsync({ type: "nodebuffer" }).then((content) => {
      fs.writeFileSync(patternZipAllFileName, content);
    });
  } catch (err) {
    console.error("Something went wrong when generating ZIP: " + err);
  }
  
}


function splitImage(imagePixelsArray: Array<number>, ogWidth: number, ogHeight: number): Array<{ array: Array<number>, width: number, height: number, startX: number, startY: number }> {
  if (ogWidth < THRESHOLD_BIG && ogHeight < THRESHOLD_BIG) {
    return [{ array: imagePixelsArray, width: ogWidth, height: ogHeight, startX: 0, startY: 0 }];
  }

  const getMidTen = (dim: number): number => {
    let mid = Math.floor(dim / 2);
    while (mid % 10 !== 0) {
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
      if (x < midX) {
        if (y < midY) {
          imagePixels1.push(imagePixelsArray[pos]);
        } else {
          imagePixels3.push(imagePixelsArray[pos]);
        }
      } else {
        if (y < midY) {
          imagePixels2.push(imagePixelsArray[pos]);
        } else {
          imagePixels4.push(imagePixelsArray[pos]);
        }
      }
    }
  }

  return [
    { array: imagePixelsArray, width: ogWidth, height: ogHeight, startX: 0, startY: 0  },
    { array: imagePixels1, width: midX, height: midY, startX: 0, startY: 0  },
    { array: imagePixels2, width: ogWidth - midX, height: midY, startX: midX, startY: 0  },
    { array: imagePixels3, width: midX, height: ogHeight - midY, startX: 0, startY: midY  },
    { array: imagePixels4, width: ogWidth - midX, height: ogHeight - midY, startX: midX, startY: midY  }
  ];
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
      row.push(bw ? WHITE : pixel);
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


