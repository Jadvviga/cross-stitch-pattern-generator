import { json } from '@sveltejs/kit';
import { generatePattern } from '$api/generatePattern.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    const palette = data["palette"];

    console.profile();
    await generatePattern(fileName, palette);
    console.profileEnd();
    
    return json(palette);
}
