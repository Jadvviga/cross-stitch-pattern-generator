import { error, json } from '@sveltejs/kit';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { generatePreview } from '../generatePattern.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    console.log('generate preview', fileName)
    await generatePreview(fileName);
    let message = "test"
    return json(message);
}
