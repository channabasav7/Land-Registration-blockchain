# TerraChain - Blockchain Land Registry System

A comprehensive blockchain-based land registration platform built with Ethereum smart contracts, featuring an attractive modern frontend and robust backend infrastructure.

## 🌟 Features

### Core Functionality
- **Immutable Property Registration** - Register properties permanently on the blockchain
- **Ownership Verification** - Instantly verify property ownership and authenticity
- **Transfer Management** - Securely transfer property ownership with complete history
- **Document Storage** - Link IPFS document hashes for supporting documentation
- **Transfer History** - View complete ownership history for any property
- **Real-time Statistics** - Track total properties, transfers, and active owners

### Technical Features
- **Smart Contract Security** - Audited Solidity smart contracts with ownership validation
- **MetaMask Integration** - Seamless Web3 wallet connectivity
- **Responsive Design** - Beautiful UI that works on all devices
- **Event Logging** - All transactions emit events for transparency
- **Gas Optimization** - Efficient contract design to minimize transaction costs

## 🎨 Frontend Design

The frontend features a distinctive **editorial earthtone aesthetic** with:
- Custom typography using Cormorant Garamond (display) and Space Mono (body)
- Animated gradient orbs and grid background
- Smooth transitions and micro-interactions
- Dark theme with golden accents (#d4a574)
- Professional, minimalist design

## 🏗️ Architecture

```
TerraChain/
├── index.html              # Main frontend interface
├── styles.css              # Custom styling with animations
├── app.js                  # Frontend JavaScript logic
├── LandRegistry.sol        # Smart contract (Solidity)
├── hardhat.config.js       # Hardhat configuration
├── deploy.js               # Deployment script
├── package.json            # Project dependencies
└── .env.template           # Environment variables template
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm
- MetaMask browser extension
- Git

### Installation

1. **Clone and setup**
```bash
# Create project directory
mkdir terrachain && cd terrachain

# Initialize npm project (if starting fresh)
npm init -y

# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install ethers@5.7.2 dotenv @openzeppelin/contracts
```

2. **Configure environment**
```bash
# Copy environment template
cp .env.template .env

# Edit .env and add your private key and RPC URLs
nano .env
```

3. **Create contract directory**
```bash
mkdir -p contracts
cp LandRegistry.sol contracts/
```

4. **Compile the smart contract**
```bash
npx hardhat compile
```

### Deployment

#### Option 1: Deploy to Local Hardhat Network (Testing)

```bash
# Terminal 1 - Start local node
npx hardhat node

# Terminal 2 - Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

#### Option 2: Deploy to Sepolia Testnet

```bash
# Get Sepolia ETH from faucet: https://sepoliafaucet.com/
npx hardhat run scripts/deploy.js --network sepolia
```

#### Option 3: Deploy to Polygon Mumbai Testnet

```bash
# Get Mumbai MATIC from faucet: https://faucet.polygon.technology/
npx hardhat run scripts/deploy.js --network mumbai
```

### Configure Frontend

1. **Update contract address in app.js**
```javascript
// Line 8 in app.js
const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
```

2. **Start a local web server**
```bash
# Option 1: Using Python
python3 -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server -p 8000

# Option 3: Using VS Code Live Server extension
# Just right-click index.html and select "Open with Live Server"
```

3. **Access the application**
```
Open browser and go to: http://localhost:8000
```

## 📝 Usage Guide

### 1. Connect Wallet
- Click "Connect Wallet" in the navigation
- Approve MetaMask connection
- Ensure you're on the correct network (Sepolia/Mumbai/Localhost)

### 2. Register a Property
- Fill in all property details:
  - Property ID (unique identifier)
  - Address, City, Postal Code
  - Area in square meters
  - GPS Coordinates (Latitude, Longitude)
  - Owner Name
  - Optional: IPFS Document Hash
- Click "Register on Blockchain"
- Confirm transaction in MetaMask
- Wait for confirmation

### 3. Explore Properties
- Click "Explorer" in navigation
- View all registered properties
- Click any property card to see full details
- Use search to filter by ID, owner, or address

### 4. Verify Property
- Click "Verify" in navigation
- Enter Property ID
- Click "Verify"
- View property authenticity and ownership details

### 5. Transfer Ownership
This requires extending the frontend, but the smart contract supports it:
```javascript
await contract.transferProperty(
    "propertyId",
    "0xNewOwnerAddress",
    "New Owner Name"
);
```

## 🔐 Smart Contract Functions

### Public Functions

#### `registerProperty()`
Register a new property with complete details.

**Parameters:**
- `_propertyId`: Unique identifier
- `_address`: Full property address
- `_city`: City name
- `_postalCode`: Postal code
- `_area`: Area in square meters
- `_latitude`: GPS latitude
- `_longitude`: GPS longitude
- `_ownerName`: Legal owner name
- `_documentHash`: IPFS document hash (optional)

#### `transferProperty()`
Transfer property to a new owner.

**Parameters:**
- `_propertyId`: Property identifier
- `_newOwner`: New owner's wallet address
- `_newOwnerName`: New owner's legal name

#### `getProperty()`
Retrieve complete property details.

**Returns:** All property information including owner, registration date, etc.

#### `getTransferHistory()`
Get complete transfer history for a property.

#### `verifyProperty()`
Verify property registration and ownership.

#### `getPropertiesByOwner()`
Get all properties owned by an address.

## 🧪 Testing

Create a test file `test/LandRegistry.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry", function () {
  let landRegistry;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.deployed();
  });

  it("Should register a property", async function () {
    await landRegistry.registerProperty(
      "SN-2024-001",
      "123 Main St",
      "New York",
      "10001",
      1000,
      "40.7128",
      "-74.0060",
      "John Doe",
      ""
    );

    const property = await landRegistry.getProperty("SN-2024-001");
    expect(property.isRegistered).to.equal(true);
    expect(property.ownerName).to.equal("John Doe");
  });

  it("Should transfer property", async function () {
    await landRegistry.registerProperty(
      "SN-2024-002",
      "456 Oak Ave",
      "Los Angeles",
      "90001",
      2000,
      "34.0522",
      "-118.2437",
      "Jane Smith",
      ""
    );

    await landRegistry.transferProperty(
      "SN-2024-002",
      addr1.address,
      "Bob Johnson"
    );

    const property = await landRegistry.getProperty("SN-2024-002");
    expect(property.owner).to.equal(addr1.address);
    expect(property.ownerName).to.equal("Bob Johnson");
  });
});
```

Run tests:
```bash
npx hardhat test
```

## 🔧 Advanced Configuration

### Custom Network

Add to `hardhat.config.js`:
```javascript
myNetwork: {
  url: "https://rpc-url.com",
  accounts: [process.env.PRIVATE_KEY],
  chainId: 12345
}
```

### Contract Verification

After deployment, verify on Etherscan:
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 📊 Gas Optimization Tips

1. **Batch Operations** - Register multiple properties in a single transaction
2. **String Optimization** - Use shorter property IDs when possible
3. **Storage vs Memory** - Contract uses appropriate data locations
4. **Event Indexing** - Events are properly indexed for efficient querying

## 🔒 Security Considerations

1. **Ownership Validation** - Only property owners can transfer
2. **Unique Property IDs** - Prevents duplicate registrations
3. **Address Validation** - Prevents transfers to zero address
4. **Immutable Records** - Registration data cannot be deleted
5. **Access Control** - Critical functions protected by modifiers

## 🛠️ Troubleshooting

### MetaMask Connection Issues
- Ensure MetaMask is installed and unlocked
- Check you're on the correct network
- Clear MetaMask cache if needed

### Transaction Failures
- Ensure sufficient ETH/MATIC for gas fees
- Check contract address is correct in app.js
- Verify network in MetaMask matches deployment network

### Contract Not Responding
- Confirm contract is deployed (check address on block explorer)
- Verify ABI in app.js matches deployed contract
- Check browser console for errors

## 📈 Future Enhancements

- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] IPFS integration for document uploads
- [ ] Property marketplace features
- [ ] Government/authority verification system
- [ ] Automated property valuation
- [ ] Integration with mapping services
- [ ] Dispute resolution mechanism
- [ ] Rental agreement management
- [ ] Property tax integration

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review smart contract comments

## 🎯 Project Status

**Current Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2024

---

Built with ❤️ using Ethereum, Solidity, and modern web technologies.
