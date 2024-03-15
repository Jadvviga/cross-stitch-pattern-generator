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
    index: number
    colorHex: string;
    muline: MulineData;
    icon: string;
    invertIcon: boolean;
    count: number;
}

