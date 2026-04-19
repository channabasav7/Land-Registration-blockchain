// TerraChain - Land Registration DApp

// Contract ABI and Configuration
const CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "_propertyId", "type": "string"},
            {"internalType": "string", "name": "_address", "type": "string"},
            {"internalType": "string", "name": "_city", "type": "string"},
            {"internalType": "string", "name": "_postalCode", "type": "string"},
            {"internalType": "uint256", "name": "_area", "type": "uint256"},
            {"internalType": "string", "name": "_latitude", "type": "string"},
            {"internalType": "string", "name": "_longitude", "type": "string"},
            {"internalType": "string", "name": "_ownerName", "type": "string"},
            {"internalType": "string", "name": "_documentHash", "type": "string"}
        ],
        "name": "registerProperty",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "_propertyId", "type": "string"},
            {"internalType": "address", "name": "_newOwner", "type": "address"},
            {"internalType": "string", "name": "_newOwnerName", "type": "string"}
        ],
        "name": "transferProperty",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "_propertyId", "type": "string"}],
        "name": "getProperty",
        "outputs": [
            {"internalType": "string", "name": "propertyId", "type": "string"},
            {"internalType": "string", "name": "propertyAddress", "type": "string"},
            {"internalType": "string", "name": "city", "type": "string"},
            {"internalType": "string", "name": "postalCode", "type": "string"},
            {"internalType": "uint256", "name": "area", "type": "uint256"},
            {"internalType": "string", "name": "latitude", "type": "string"},
            {"internalType": "string", "name": "longitude", "type": "string"},
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "string", "name": "ownerName", "type": "string"},
            {"internalType": "string", "name": "documentHash", "type": "string"},
            {"internalType": "uint256", "name": "registrationDate", "type": "uint256"},
            {"internalType": "bool", "name": "isRegistered", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getPropertyCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_index", "type": "uint256"}],
        "name": "getPropertyIdByIndex",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "string", "name": "propertyId", "type": "string"},
            {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "registrationDate", "type": "uint256"}
        ],
        "name": "PropertyRegistered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "string", "name": "propertyId", "type": "string"},
            {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "transferDate", "type": "uint256"}
        ],
        "name": "PropertyTransferred",
        "type": "event"
    }
];

// Global Variables
let provider;
let signer;
let contract;
let userAccount;
const HARDHAT_CHAIN_ID = '0x7A69'; // 31337
const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';

// Replace with your deployed contract address
const DEFAULT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let contractAddress = DEFAULT_CONTRACT_ADDRESS;

async function loadContractAddress() {
    try {
        const response = await fetch(`contract-address.json?ts=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`Failed to load contract-address.json (${response.status})`);
        }

        const data = await response.json();
        if (data && typeof data.address === 'string' && data.address.trim()) {
            contractAddress = data.address.trim();
        }
    } catch (error) {
        console.warn('Using fallback contract address:', error);
    }

    return contractAddress;
}

function toChainIdNumber(chainIdHex) {
    if (!chainIdHex) {
        return NaN;
    }

    return Number.parseInt(String(chainIdHex), 16);
}

// Initialize
window.addEventListener('load', async () => {
    initializeEventListeners();
    updateStats();
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
    } else {
        showToast('Please install MetaMask to use this application', 'error');
    }
});

// Initialize Event Listeners
function initializeEventListeners() {
    // Wallet Connection
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    
    // Registration Form
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            navigateTo(target);
        });
    });
}

// Connect Wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showToast('Please install MetaMask!', 'error');
            return;
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];

        // Ensure MetaMask is on the local Hardhat chain used by this app.
        await ensureHardhatNetwork();

        // Initialize provider and signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        // Initialize contract
        const resolvedContractAddress = await loadContractAddress();
        contract = new ethers.Contract(resolvedContractAddress, CONTRACT_ABI, signer);

        // Update UI
        const walletBtn = document.getElementById('connectWallet');
        walletBtn.innerHTML = `
            <span class="wallet-icon">⬡</span>
            <span class="wallet-text">${userAccount.substring(0, 6)}...${userAccount.substring(38)}</span>
        `;
        
        showToast('Wallet connected successfully!', 'success');

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                showToast('Please connect to MetaMask', 'warning');
            } else {
                userAccount = accounts[0];
                location.reload();
            }
        });

        window.ethereum.on('chainChanged', () => {
            // Reinitialize provider/signer/contract when user switches networks in MetaMask.
            location.reload();
        });

    } catch (error) {
        console.error('Error connecting wallet:', error);
        const message = String(error?.message || '');
        if (message.includes('ERR_NAME_NOT_RESOLVED')) {
            showToast('RPC URL not reachable. In MetaMask set Localhost RPC to http://127.0.0.1:8545', 'error');
        } else if (error?.code === 4001) {
            showToast('Wallet connection request was rejected', 'warning');
        } else {
            showToast('Failed to connect wallet', 'error');
        }
    }
}

async function ensureContractAvailable() {
    if (!contract || !provider) {
        showToast('Please connect your wallet first', 'warning');
        return false;
    }

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainIdNumber = toChainIdNumber(chainId);
    const hardhatChainIdNumber = toChainIdNumber(HARDHAT_CHAIN_ID);

    if (currentChainIdNumber !== hardhatChainIdNumber) {
        showToast('Switch MetaMask network to Hardhat Local (chain 31337)', 'error');
        return false;
    }

    const resolvedContractAddress = await loadContractAddress();
    const code = await provider.getCode(resolvedContractAddress);
    if (!code || code === '0x') {
        showToast(`No contract found at ${resolvedContractAddress} on ${HARDHAT_RPC_URL}. Redeploy and refresh.`, 'error');
        return false;
    }

    return true;
}

function handleContractCallError(error, fallbackMessage) {
    const message = String(error?.message || '');

    if (message.includes('could not decode result data') || message.includes('BAD_DATA')) {
        showToast('Contract call failed: wrong network or stale contract address. Reconnect wallet on Hardhat Local and refresh.', 'error');
        return;
    }

    showToast(fallbackMessage, 'error');
}

async function ensureHardhatNetwork() {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (toChainIdNumber(currentChainId) === toChainIdNumber(HARDHAT_CHAIN_ID)) {
        return;
    }

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HARDHAT_CHAIN_ID }]
        });
    } catch (switchError) {
        // If the chain has not been added to MetaMask, add it and retry.
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: HARDHAT_CHAIN_ID,
                    chainName: 'Hardhat Local',
                    rpcUrls: ['http://127.0.0.1:8545'],
                    nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18
                    }
                }]
            });
            return;
        }

        throw switchError;
    }
}

// Handle Registration Form
async function handleRegistration(e) {
    e.preventDefault();

    if (!userAccount) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }

    try {
        if (!(await ensureContractAvailable())) {
            return;
        }

        // Get form data
        const propertyId = document.getElementById('propertyId').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const postalCode = document.getElementById('postalCode').value;
        const area = document.getElementById('area').value;
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const ownerName = document.getElementById('ownerName').value;
        const documentHash = document.getElementById('documentHash').value || '';

        showToast('Submitting transaction...', 'info');

        // Call smart contract
        const tx = await contract.registerProperty(
            propertyId,
            address,
            city,
            postalCode,
            area,
            latitude,
            longitude,
            ownerName,
            documentHash
        );

        showToast('Transaction submitted. Waiting for confirmation...', 'info');

        // Wait for transaction confirmation
        await tx.wait();

        showToast('Property registered successfully!', 'success');

        // Reset form
        document.getElementById('registrationForm').reset();

        // Update stats
        updateStats();

    } catch (error) {
        console.error('Error registering property:', error);
        if (error.message.includes('user rejected')) {
            showToast('Transaction rejected by user', 'warning');
        } else if (error.message.includes('already registered')) {
            showToast('Property ID already registered', 'error');
        } else {
            handleContractCallError(error, 'Failed to register property');
        }
    }
}

// Search Property
async function searchProperty() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        loadAllProperties();
        return;
    }

    try {
        if (!(await ensureContractAvailable())) {
            return;
        }

        const count = await contract.getPropertyCount();
        const propertiesList = document.getElementById('propertiesList');
        propertiesList.innerHTML = '';

        let found = false;

        for (let i = 0; i < count; i++) {
            const propertyId = await contract.getPropertyIdByIndex(i);
            const property = await contract.getProperty(propertyId);

            if (
                property.propertyId.toLowerCase().includes(searchTerm) ||
                property.propertyAddress.toLowerCase().includes(searchTerm) ||
                property.ownerName.toLowerCase().includes(searchTerm) ||
                property.city.toLowerCase().includes(searchTerm)
            ) {
                found = true;
                propertiesList.appendChild(createPropertyCard(property));
            }
        }

        if (!found) {
            propertiesList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No properties found matching your search.</p>';
        }

    } catch (error) {
        console.error('Error searching properties:', error);
        handleContractCallError(error, 'Failed to search properties');
    }
}

// Load All Properties
async function loadAllProperties() {
    try {
        if (!(await ensureContractAvailable())) {
            return;
        }

        const count = await contract.getPropertyCount();
        const propertiesList = document.getElementById('propertiesList');
        propertiesList.innerHTML = '';

        if (Number(count) === 0) {
            propertiesList.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">No properties registered yet.</p>';
            return;
        }

        for (let i = 0; i < count; i++) {
            const propertyId = await contract.getPropertyIdByIndex(i);
            const property = await contract.getProperty(propertyId);
            propertiesList.appendChild(createPropertyCard(property));
        }

    } catch (error) {
        console.error('Error loading properties:', error);
        handleContractCallError(error, 'Failed to load properties');
    }
}

// Create Property Card
function createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'property-card';
    card.onclick = () => showPropertyDetails(property);

    const date = new Date(Number(property.registrationDate) * 1000);

    card.innerHTML = `
        <div class="property-id">${property.propertyId}</div>
        <div class="property-address">${property.propertyAddress}</div>
        <div class="property-meta">
            <span>📍 ${property.city}</span>
            <span>📐 ${property.area} m²</span>
        </div>
        <div class="property-owner">Owner: ${property.ownerName}</div>
    `;

    return card;
}

// Show Property Details
function showPropertyDetails(property) {
    const modal = document.getElementById('propertyModal');
    const modalBody = document.getElementById('modalBody');

    const date = new Date(Number(property.registrationDate) * 1000);

    modalBody.innerHTML = `
        <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 1.5rem; color: var(--color-primary);">
            ${property.propertyId}
        </h2>
        
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Address</div>
                <div style="font-size: 1.1rem;">${property.propertyAddress}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">City</div>
                    <div>${property.city}</div>
                </div>
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Postal Code</div>
                    <div>${property.postalCode}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Area</div>
                    <div>${property.area} m²</div>
                </div>
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">GPS Coordinates</div>
                    <div>${property.latitude}, ${property.longitude}</div>
                </div>
            </div>
            
            <div>
                <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Current Owner</div>
                <div style="margin-bottom: 0.25rem;">${property.ownerName}</div>
                <div style="font-family: monospace; font-size: 0.85rem; color: var(--color-text-tertiary);">${property.owner}</div>
            </div>
            
            <div>
                <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Registration Date</div>
                <div>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
            </div>
            
            ${property.documentHash ? `
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Document Hash</div>
                    <div style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">${property.documentHash}</div>
                </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'block';
}

// Close Modal
function closeModal() {
    document.getElementById('propertyModal').style.display = 'none';
}

// Verify Property
async function verifyProperty() {
    const propertyId = document.getElementById('verifyPropertyId').value;
    
    if (!propertyId) {
        showToast('Please enter a Property ID', 'warning');
        return;
    }

    try {
        if (!(await ensureContractAvailable())) {
            return;
        }

        const property = await contract.getProperty(propertyId);
        const verifyResult = document.getElementById('verifyResult');

        if (!property.isRegistered) {
            verifyResult.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                    <h3 style="font-family: var(--font-display); font-size: 2rem; color: var(--color-error); margin-bottom: 0.5rem;">Not Verified</h3>
                    <p style="color: var(--color-text-secondary);">This property ID is not registered on the blockchain.</p>
                </div>
            `;
            return;
        }

        const date = new Date(Number(property.registrationDate) * 1000);

        verifyResult.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h3 style="font-family: var(--font-display); font-size: 2rem; color: var(--color-success); margin-bottom: 1rem;">Verified Property</h3>
            </div>
            
            <div style="display: grid; gap: 1.5rem; margin-top: 2rem;">
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Property ID</div>
                    <div style="font-size: 1.1rem; color: var(--color-primary);">${property.propertyId}</div>
                </div>
                
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Owner</div>
                    <div>${property.ownerName}</div>
                    <div style="font-family: monospace; font-size: 0.85rem; color: var(--color-text-tertiary); margin-top: 0.25rem;">${property.owner}</div>
                </div>
                
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Address</div>
                    <div>${property.propertyAddress}, ${property.city} ${property.postalCode}</div>
                </div>
                
                <div>
                    <div style="color: var(--color-text-secondary); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Registered On</div>
                    <div>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error verifying property:', error);
        handleContractCallError(error, 'Failed to verify property');
    }
}

// Update Statistics
async function updateStats() {
    try {
        if (!(await ensureContractAvailable())) {
            return;
        }

        const count = await contract.getPropertyCount();
        
        // Animate counter
        animateCounter('totalProperties', Number(count));
        
        // For demo purposes, set some values
        // In production, you'd calculate these from contract events
        animateCounter('totalTransfers', Math.floor(Number(count) * 0.3));
        animateCounter('activeOwners', Math.floor(Number(count) * 0.7));

    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Animate Counter
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const duration = 2000;
    const steps = 60;
    const stepValue = targetValue / steps;
    let currentValue = 0;
    
    const interval = setInterval(() => {
        currentValue += stepValue;
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, duration / steps);
}

// Navigation
function navigateTo(section) {
    // Hide all sections
    document.getElementById('registration-section').style.display = 'none';
    document.getElementById('explorer-section').style.display = 'none';
    document.getElementById('verify-section').style.display = 'none';

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    switch(section) {
        case 'home':
            document.getElementById('registration-section').style.display = 'block';
            document.querySelector('a[href="#home"]').classList.add('active');
            break;
        case 'explorer':
            document.getElementById('explorer-section').style.display = 'block';
            document.querySelector('a[href="#explorer"]').classList.add('active');
            loadAllProperties();
            break;
        case 'verify':
            document.getElementById('verify-section').style.display = 'block';
            document.querySelector('a[href="#verify"]').classList.add('active');
            break;
    }
}

// Show functions for buttons
function showRegistrationForm() {
    navigateTo('home');
}

function showExplorer() {
    navigateTo('explorer');
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    
    const colors = {
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
        info: 'var(--color-primary)'
    };

    toast.textContent = message;
    toast.style.borderLeft = `4px solid ${colors[type]}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('propertyModal');
    if (event.target === modal) {
        closeModal();
    }
}
