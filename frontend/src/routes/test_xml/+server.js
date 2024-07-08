import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST(params) {
    
    const body = await params.request.json();
    console.debug(body);
    
    return new Response(
        String(
            "Test response confirmed"
        )
    );
  };