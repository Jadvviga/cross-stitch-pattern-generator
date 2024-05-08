import fs from 'node:fs/promises';
import path from 'node:path';
import { json } from '@sveltejs/kit';

let called = false;
export async function POST({ request }) {
    if (called) {
        return json({ status: 201 });
    }
    const{ data } = await request.json();
    const srcArray = Array.isArray(data["src"]) ? data["src"] : [data["src"]];

    srcArray.forEach(async (src) => {
        for (const file of await fs.readdir(src)) {
            fs.rm(path.join(src, file), {recursive: true});
        }
    });
    called = true;
    return json({ status: 201 });
}

