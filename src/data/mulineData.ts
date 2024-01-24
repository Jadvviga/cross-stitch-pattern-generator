export enum MULINE_TYPES {
    Ariadna = "Ariadna",
    DMC = "DMC"
}

export type MulineData = {
    id: string;
    RGBnumbers?: number[];
    hex: string;
}

export type Palette = {
    colorHex: string;
    muline: MulineData;
    count?: number;
}
