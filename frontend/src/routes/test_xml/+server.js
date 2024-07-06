import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function POST(params) {
    console.debug(params);
    return new Response(
        String(
            "Test response confirmed"
        )
    );
  };