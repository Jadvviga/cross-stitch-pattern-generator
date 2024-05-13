import { ARIADNA } from "./ariadna";
import { DMC } from "./dmc";

export enum MULINE_TYPES {
    Ariadna = "Ariadna",
    DMC = "DMC"
}

export type MulineData = {
    id: string;
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

export function getMulinePalette(mulineType: MULINE_TYPES | string): Array<MulineData> {
    switch (mulineType){
        case MULINE_TYPES.Ariadna:
            return ARIADNA;
        case MULINE_TYPES.DMC:
            return DMC;
        // possibly more muline producers in the future
    }
    return [];
        
}



