// Cloudflare Worker for serving static site
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes if needed
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // Serve static files from the site bucket
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  // Example API endpoint
  if (request.method === 'GET' && request.url.pathname === '/api/health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}