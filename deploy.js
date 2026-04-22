// deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying LandRegistry contract...");

  // Get the contract factory
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  
  // Deploy the contract
  const landRegistry = await LandRegistry.deploy();
  
  // Wait for deployment to finish
  await landRegistry.waitForDeployment();

  const deployedAddress = await landRegistry.getAddress();
  
  console.log("LandRegistry deployed to:", deployedAddress);
  console.log("\nDeployment successful!");
  console.log("\nNext steps:");
  console.log("1. Refresh the frontend; it reads contract-address.json automatically.");
  console.log("   Latest address:", deployedAddress);
  console.log("2. Verify the contract on Etherscan (if deploying to a public network)");
  console.log("3. Test the registration functionality");
  
  // Save the contract address to a file
  const fs = require('fs');
  const path = require('path');
  const contractAddress = {
    address: deployedAddress,
    network: hre.network.name,
    deploymentTime: new Date().toISOString()
  };

  const networkFileName = `contract-address.${hre.network.name}.json`;
  fs.writeFileSync(
    path.join(process.cwd(), networkFileName),
    JSON.stringify(contractAddress, null, 2)
  );
  console.log(`\nContract address saved to ${networkFileName}`);

  // Keep production-friendly default for hosted frontend; do not overwrite with localhost.
  if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
    fs.writeFileSync(
      path.join(process.cwd(), 'contract-address.json'),
      JSON.stringify(contractAddress, null, 2)
    );
    console.log('Contract address saved to contract-address.json');
  } else {
    console.log('Skipped updating contract-address.json for local network.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
