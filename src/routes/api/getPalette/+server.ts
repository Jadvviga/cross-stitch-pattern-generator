import { json } from '@sveltejs/kit';
import { loadPalette } from '../generatePalette.js';
import type { MULINE_TYPES } from '../../../data/mulineData.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    const selectedMulineType = data["mulineType"];
    const useLeastColors = data["useLeastColors"];
    const pixelsPalette = data["pixelsPalette"];
    let palette = await loadPalette(fileName, pixelsPalette, selectedMulineType, useLeastColors);
    return json({palette});
}
