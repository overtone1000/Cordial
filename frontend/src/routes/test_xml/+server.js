import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST(params) {
    
    const body = await params.request.text();
    
    return new Response(
        String(
            "Test response confirmed"
        )
    );
  };