import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';

let id = 0;
export async function POST({ request }) {
    const { data } = await request.json();

    //TODO clear folder with images at start of program or sth
    const file = data['image'];

    //const fileName = randomUUID();
    const fileName = `img${id}`;
    id++;
	//console.log('saveImg', fileName)
    writeFileSync(`static/images/upload/${fileName}.png`, file, 'base64');
    //console.log('SAVED')
    return json({ "fileName": fileName }, { status: 201 });
}