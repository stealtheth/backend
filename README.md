# Personal Off-chain ENS Resolver
*Note the assumption here is that the owner of the ENS is running this back-end. However the back-end will no longer be required if ENS and Wallet clients like MetaMask support [EIP-5564](https://eips.ethereum.org/EIPS/eip-5564).*

To install dependencies:

```bash
bun install
```

```bash
cp .env.example .env
```

and set the private key of the owner of the ENS name that the this off-chain resolver is being configured for.

Note, the private key is not strictly required since the back-end only needs the master viewing key to support its operations.

To run:

```bash
bun run start
```

this will start an off-chain resolver gateway that will be used by clients (e.g MetaMask) for off chian resolution of the ens name.
