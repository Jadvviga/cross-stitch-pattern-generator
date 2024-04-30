import { json } from '@sveltejs/kit';
import { getPaletteFromImage, loadPalette } from '../generatePalette.js';
import type { MULINE_TYPES } from '../../../data/mulineData.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    let palette = await getPaletteFromImage(fileName);
    console.log(palette)
    return json({palette});
}
