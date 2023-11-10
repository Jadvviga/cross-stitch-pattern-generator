import { error, json } from '@sveltejs/kit';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
 
export async function GET() {
    const execFunc = promisify(exec);
    let message = "python run"
    const { stdout, stderr } = await execFunc(`python ./src/python_scripts/main.py image.png`)
    message = stderr || stdout;
    return json(message);
}
