import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import fs from 'node:fs';

let id = 0;
export async function POST({ request }) {
    const { data } = await request.json();
    const file = data['image'];

    //const fileName = randomUUID();
    const fileName = `img${id}`;
    id++;
    const uploadDir = `static/images/upload/${fileName}`;
    if (!fs.existsSync(uploadDir)){
        fs.mkdirSync(uploadDir);
    }
    fs.writeFileSync(`${uploadDir}/${fileName}.png`, file, 'base64');
    return json({ "fileName": fileName }, { status: 201 });
}