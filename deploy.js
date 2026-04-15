// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  console.log("Deploying LandRegistry contract...");

  // Get the contract factory
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  
  // Deploy the contract
  const landRegistry = await LandRegistry.deploy();
  
  // Wait for deployment to finish
  await landRegistry.deployed();
  
  console.log("LandRegistry deployed to:", landRegistry.address);
  console.log("\nDeployment successful!");
  console.log("\nNext steps:");
  console.log("1. Update CONTRACT_ADDRESS in app.js with:", landRegistry.address);
  console.log("2. Verify the contract on Etherscan (if deploying to a public network)");
  console.log("3. Test the registration functionality");
  
  // Save the contract address to a file
  const fs = require('fs');
  const contractAddress = {
    address: landRegistry.address,
    network: hre.network.name,
    deploymentTime: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'contract-address.json',
    JSON.stringify(contractAddress, null, 2)
  );
  
  console.log("\nContract address saved to contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
