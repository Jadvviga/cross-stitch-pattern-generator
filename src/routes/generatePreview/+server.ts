import { error, json } from '@sveltejs/kit';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { generatePreview } from './generatePattern.js';
 
export async function POST({ request }) {
    const { data } = await request.json();
    const fileName = data["fileName"];
    await generatePreview(fileName);
    let message = "test"
    return json(message);
}

// Not using pyhton for now
async function runPython() {
    const execFunc = promisify(exec);
    const { stdout, stderr } = await execFunc(`python ./src/python_scripts/main.py image.png`)
    return stderr || stdout;
}
