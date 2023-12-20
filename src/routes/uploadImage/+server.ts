import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';

export async function POST({ request }) {
    const { data } = await request.json();

    const file = data['image'];
    const type = String(data["type"]);

    //const fileName = randomUUID();
    const fileName = "testImage"
	
    writeFileSync(`static/images/${fileName}.png`, file, 'base64');
    return json({ "fileName": fileName }, { status: 201 });
}