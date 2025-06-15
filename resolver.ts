import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const port = process.env.PORT || 8080;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function generateRandomAddress(): Promise<string> {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
    chain: sepolia,
    transport: http(),
  });

  const addresses = await walletClient.getAddresses();
  return addresses[0] as `0x${string}`;
}

function encodeAddress(address: string): string {
  return `0x${'0'.repeat(24)}${address.substring(2)}`;
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Handle main endpoint
    if (url.pathname === '/' && req.method === 'POST') {
      const body = await req.json();
      console.log({ req: body });

      const randomAddress = await generateRandomAddress();
      const encodedAddress = encodeAddress(randomAddress);
      
      return new Response(JSON.stringify({ data: encodedAddress }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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