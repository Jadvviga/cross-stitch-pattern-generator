import Jimp from "jimp";
import { readFileSync } from "node:fs";

export function generatePattern(fileName: string) {
    const path = 'static/images/';
    const fullFileName = `${path}${fileName}.png`;

    // open a file called "lenna.png"
    Jimp.read(fullFileName) 
        .then((image) => {
            return image
            .resize(256, 256) // resize
            .quality(60) // set JPEG quality
            .greyscale() // set greyscale
            .write(`${path}${fileName}_test.png`); // save
        })
      .catch((err) => {
        console.error(err);
      });
        
}