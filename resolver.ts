import { createPublicClient, createWalletClient, http, type PublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { 
  extractViewingPrivateKeyNode, 
  generateEphemeralPrivateKey, 
  generateFluidkeyMessage, 
  generateKeysFromSignature, 
  generateStealthAddresses 
} from "@fluidkey/stealth-account-kit"
import { getKernelAddressFromECDSA } from '@zerodev/ecdsa-validator'
import { getEntryPoint, KERNEL_V3_1 } from '@zerodev/sdk/constants'

const PORT = process.env.PORT || 8080
const SEPOLIA_CHAIN_ID = 11155111
const STEALTH_ADDRESS_COUNT = 10

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Helper function to get a random address from an array
function getRandomAddress(addresses: string[]): `0x${string}` {
  const randomIndex = Math.floor(Math.random() * addresses.length)
  return addresses[randomIndex] as `0x${string}`
}

// Helper function to encode address for ENS resolution (adds 24 zero bytes prefix)
function encodeAddress(address: string): string {
  return `0x${'0'.repeat(24)}${address.substring(2)}`
}

// Main function to generate stealth addresses using Fluidkey protocol
async function generateRandomStealthAddresses(): Promise<string[]> {
  // Create wallet client for signing operations
  const walletClient = createWalletClient({
    account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
    chain: sepolia,
    transport: http(),
  })
  
  // Generate message for Fluidkey signature
  const { message } = generateFluidkeyMessage({ 
    pin: "0000", 
    address: walletClient.account.address 
  })

  // Sign message and derive stealth keys
  const signature = await walletClient.signMessage({ message })
  const { spendingPrivateKey, viewingPrivateKey } = generateKeysFromSignature(signature)
  
  // Extract BIP32 node and create spending account
  const derivedBIP32Node = extractViewingPrivateKeyNode(viewingPrivateKey, 0)
  const spendingAccount = privateKeyToAccount(spendingPrivateKey)
  const spendingPublicKey = spendingAccount.publicKey

  const stealthAddresses: string[] = []

  // Generate multiple stealth addresses using different nonces
  for (let nonce = 0; nonce < STEALTH_ADDRESS_COUNT; nonce++) {
    const { ephemeralPrivateKey } = generateEphemeralPrivateKey({
      viewingPrivateKeyNode: derivedBIP32Node,
      nonce: BigInt(nonce),
      chainId: SEPOLIA_CHAIN_ID,
    })

    const { stealthAddresses: newAddresses } = generateStealthAddresses({
      spendingPublicKeys: [spendingPublicKey],
      ephemeralPrivateKey,
    })

    const kernelAddress = await getKernelAddress(newAddresses[0] as `0x${string}`)
    stealthAddresses.push(kernelAddress)
  }

  return stealthAddresses
}

// Get the kernel address for a stealth address
async function getKernelAddress(stealthAddress: `0x${string}`) {
  console.log("stealthAddress", stealthAddress)
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  })

  const smartAccountAddress = await getKernelAddressFromECDSA({
      publicClient,
      eoaAddress: stealthAddress as `0x${string}`,
      index: BigInt(0), 
      entryPoint: getEntryPoint("0.7"), 
      kernelVersion: KERNEL_V3_1,
    });
    return smartAccountAddress
}

// Main request handler for the ENS resolver
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname === '/' && req.method === 'POST') {
    const body = await req.json()
    console.log({ req: body })

    // Generate stealth addresses, pick random one, and encode for response
    const stealthAddresses = await generateRandomStealthAddresses()
    const randomAddress = getRandomAddress(stealthAddresses)
    const encodedAddress = encodeAddress(randomAddress)    
    return new Response(JSON.stringify({ data: encodedAddress }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response('Not Found', { status: 404 })
}

// Start the Bun server
Bun.serve({
  port: PORT,
  fetch: handleRequest,
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: { 'Content-Type': 'text/html' },
    })
  },
})

console.log(`Server is up and running on port ${PORT}`)