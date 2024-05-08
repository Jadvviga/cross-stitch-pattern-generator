import { json } from '@sveltejs/kit';
import { getPaletteFromImage, loadPalette } from '../generatePalette.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    let palette = await getPaletteFromImage(fileName);
    return json({palette});
}
