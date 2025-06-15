const port = process.env.PORT || 8080;

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === '/' && req.method === 'POST') {
      const body = await req.json();
      console.log({ req: body })

      const address = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const encodedAddress = `0x${'0'.repeat(24)}${address.substring(2)}`;
      const ccipReadRes = { data: encodedAddress };

      return new Response(JSON.stringify(ccipReadRes), {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
});

console.log(`Server is up and running on port ${port}`);