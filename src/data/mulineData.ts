export enum MULINE_TYPES {
    Ariadna = "Ariadna",
    DMC = "DMC"
}

export type MulineData = {
    id: string;
    RGBnumbers?: number[];
    hex: string;
}
interface IPaletteFromImg  {
    index: number
    colorHex: string;
    count: number;
 }
 interface IPaletteFull extends IPaletteFromImg  {
    muline: MulineData;
    icon: string;
    invertIcon: boolean;
 }

export type PaletteFromImg = IPaletteFromImg;

export type Palette = IPaletteFull;



