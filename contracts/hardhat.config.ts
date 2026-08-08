import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    amoy: {
      // Polygon Amoy testnet — free, low-fee, swap to Polygon mainnet
      // later by adding a "polygon" network block with the same shape.
      url: process.env.CHAIN_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.CHAIN_PRIVATE_KEY ? [process.env.CHAIN_PRIVATE_KEY] : [],
    },
  },
};

export default config;
