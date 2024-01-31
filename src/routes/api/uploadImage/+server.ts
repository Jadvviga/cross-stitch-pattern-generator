import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';

export async function POST({ request }) {
    const { data } = await request.json();

    //TODO clear folder with images at start of program or sth
    const file = data['image'];

    const fileName = randomUUID();
    //const fileName = "testImage"
	
    writeFileSync(`static/images/upload/${fileName}.png`, file, 'base64');
    return json({ "fileName": fileName }, { status: 201 });
}