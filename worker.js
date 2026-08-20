export default {
  async fetch(request, env) {
    try {
      // Fetch static asset from dist directory
      const response = await env.ASSETS.fetch(request);
      if (response.status !== 404) {
        return response;
      }

      // Single Page Application (SPA) Fallback to /index.html
      const spaRequest = new Request(new URL('/index.html', request.url), request);
      return await env.ASSETS.fetch(spaRequest);
    } catch (e) {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
