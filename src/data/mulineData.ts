export enum MULINE_TYPES {
    Ariadna = "Ariadna",
    DMC = "DMC"
}

export type MulineData = {
    id: string;
    RGBnumbers: number[];
    hex?: number;
}

export type Palette = {
    colorHex: number;
    muline: MulineData;
    count: number;
}
