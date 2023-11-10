import { json } from '@sveltejs/kit';
import { writeFileSync } from 'fs';

export async function POST({ request }) {
    const { data } = await request.json();

    const file = data['image'];

	
    writeFileSync(`static/image.png`, file, 'base64');
    return json({ "message": "Data uploaded successfully!" }, { status: 201 });
}