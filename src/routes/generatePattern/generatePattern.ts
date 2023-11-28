import { readFileSync } from "node:fs";

export function generatePattern(fileName: string) {
    const file = readFileSync(`static/images/${fileName}.png`);
    console.log(typeof file)
}