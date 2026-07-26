export async function GET() {
    return new Response('SSE endpoint has been removed. Use direct polling instead.', {
        status: 410,
    })
}