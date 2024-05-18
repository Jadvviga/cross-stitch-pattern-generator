import { json } from '@sveltejs/kit';
import { loadPalette } from '$api/generatePalette.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    const selectedMulineType = data["mulineType"];
    const useLeastColors = data["useLeastColors"];
    const pixelsPalette = data["pixelsPalette"];
    let palette = await loadPalette(pixelsPalette, selectedMulineType, useLeastColors);
    return json({palette});
}
