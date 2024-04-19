import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import fs from 'node:fs/promises';
import path from 'node:path';

let id = 0;
export async function POST({ request }) {
    if (id === 0) { //TODO change condition after using uuids
        //clear folders with images at start of program

        for (const file of await fs.readdir("static/images/upload")) {
            await fs.unlink(path.join("static/images/upload", file));
        }

        for (const file of await fs.readdir("static/images/pattern")) {
            await fs.unlink(path.join("static/images/pattern", file));
        }

    }
    const { data } = await request.json();
    const file = data['image'];

    //const fileName = randomUUID();
    const fileName = `img${id}`;
    id++;
    writeFileSync(`static/images/upload/${fileName}.png`, file, 'base64');
    return json({ "fileName": fileName }, { status: 201 });
}