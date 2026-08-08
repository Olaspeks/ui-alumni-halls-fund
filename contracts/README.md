# HallConfirmation contract

A single-purpose confirmation-ledger contract for the UI Alumni Halls
Fund. It never holds or moves funds — see the comment block at the top
of [`contracts/HallConfirmation.sol`](./contracts/HallConfirmation.sol)
for why that keeps the audit surface small.

This is a **separate, self-contained Hardhat project** (its own
`package.json`, `tsconfig.json`, `node_modules`) so contract tooling
never touches the Next.js app's build. The two projects only share
values through environment variables.

## 1. Get a free testnet wallet + funds

1. Create a fresh wallet for this purpose only (MetaMask → new account,
   or `npx hardhat-tools` — anything that gives you a private key).
   **Never reuse a wallet that holds real funds.**
2. Copy its private key (0x-prefixed) — you'll need it below.
3. Get free Polygon Amoy testnet MATIC from a faucet, e.g.
   https://faucet.polygon.technology (select "Amoy"). You only need a
   trace amount — this contract's only function is a cheap event emit.

## 2. Install & configure

```bash
cd contracts
npm install
cp .env.example .env
# edit .env: paste your CHAIN_PRIVATE_KEY (CHAIN_RPC_URL can stay default)
```

## 3. Compile

```bash
npm run compile
```

## 4. Deploy to Polygon Amoy

```bash
npm run deploy:amoy
```

This prints the deployed contract address and the exact three env vars
to copy into the **main app's** `.env.local` (or Vercel → Settings →
Environment Variables):

```
CHAIN_RPC_URL=https://rpc-amoy.polygon.technology
CHAIN_PRIVATE_KEY=<the same deployer key you just used>
CHAIN_CONTRACT_ADDRESS=<the address just printed>
```

The moment those three are set, the app flips from "mock chain, logs
only" to "really stamps confirmations on Amoy" — no code changes.

## 5. How the backend calls it

`lib/blockchain/stamp.ts` (in the main app) is the only code that ever
talks to this contract. It's called fire-and-forget from two places:

- After a webhook confirms a successful donation (`lib/donations.ts`).
- After a finance_admin records a fund movement
  (`app/api/admin/fund-movements/route.ts`).

Both call sites explicitly do **not** await the chain call before
responding — a slow or unreachable RPC must never delay or break a
donor's payment confirmation, per the project's hard constraints.

## 6. Going to mainnet later

Swap `CHAIN_RPC_URL` for a Polygon mainnet RPC, fund the same wallet
with a small amount of real MATIC (gas only — this contract still never
holds donor funds), redeploy with `npm run deploy:amoy` pointed at a new
`polygon` network block in `hardhat.config.ts`, and update the three env
vars. Also update `CHAIN_EXPLORER_TX_BASE_URL` in the main app's env to
`https://polygonscan.com/tx/`.
