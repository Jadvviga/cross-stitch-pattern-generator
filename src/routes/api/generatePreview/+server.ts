import { json } from '@sveltejs/kit';
import { generatePreview } from '../generatePattern.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    //console.log('generate preview', fileName)
    const message = await generatePreview(fileName);
    return json(message);
}
