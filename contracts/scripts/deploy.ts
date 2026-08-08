import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying HallConfirmation with owner:", deployer.address);

  const Factory = await ethers.getContractFactory("HallConfirmation");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\nHallConfirmation deployed to:", address);
  console.log("\nNext step — add these to the Next.js app's .env.local (or Vercel env vars):");
  console.log(`  CHAIN_RPC_URL=${process.env.CHAIN_RPC_URL || "https://rpc-amoy.polygon.technology"}`);
  console.log(`  CHAIN_PRIVATE_KEY=<same deployer key you just used>`);
  console.log(`  CHAIN_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
