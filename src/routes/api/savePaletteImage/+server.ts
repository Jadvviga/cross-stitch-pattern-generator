import { json } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';

export async function POST({ request }) {
    const { data } = await request.json();
    const file = data['image'];

    //const fileName = randomUUID();
    const fileName = data['fileName'];
	console.log('save palette', fileName)
    writeFileSync(`static/images/pattern/${fileName}_pattern_palette.png`, file, 'base64');
    console.log('SAVED')
    return json({ "fileName": fileName }, { status: 201 });
}