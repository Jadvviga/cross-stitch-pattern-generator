import { redirect } from '@sveltejs/kit';

export async function load({ params }) {
    if (!params.file) {
        throw redirect(303, '/')
    }
    
	return {
		fileName: params.file
	};
}