
export async function apiCall(request: string, data: object) {
    const response = await fetch(request, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({data})
    });
    return await response.json();
}