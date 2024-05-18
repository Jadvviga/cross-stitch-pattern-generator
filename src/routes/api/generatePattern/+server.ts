import { json } from '@sveltejs/kit';
import { generatePattern } from '../generatePattern.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    const palette = data["palette"];
    await generatePattern(fileName, palette);
    
    return json(palette);
}
