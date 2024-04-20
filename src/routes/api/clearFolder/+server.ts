import fs from 'node:fs/promises';
import path from 'node:path';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    const{ data } = await request.json();
    const srcArray = Array.isArray(data["src"]) ? data["src"] : [data["src"]];

    srcArray.forEach(async (src) => {
        for (const file of await fs.readdir(src)) {
            fs.rm(path.join(src, file), {recursive: true});
        }
    });
    
    return json({ status: 201 });
}

