import { json } from '@sveltejs/kit';
import fs from 'node:fs';

export async function POST({ request }) {
    const { data } = await request.json();
    const file = data['image'];

    //const fileName = randomUUID();
    const fileName = data['fileName'];
	console.log('save palette', fileName)

    // Save pallette to new pattern folder
    const patternDir = `static/images/pattern/${fileName}`;
    if (!fs.existsSync(patternDir)){
        fs.mkdirSync(patternDir);
    }
    fs.writeFileSync(`${patternDir}/pattern_palette.png`, file, 'base64');
    console.log('SAVED')
    return json({ "fileName": fileName }, { status: 201 });
}