// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LandRegistry
 * @dev Smart contract for blockchain-based land registration system
 * @notice This contract allows for immutable property registration and ownership transfers
 */
contract LandRegistry {
    
    // Structure to store property details
    struct Property {
        string propertyId;          // Unique property identifier (Survey Number)
        string propertyAddress;     // Full address of the property
        string city;                // City where property is located
        string postalCode;          // Postal/ZIP code
        uint256 area;               // Area in square meters
        string latitude;            // GPS latitude coordinate
        string longitude;           // GPS longitude coordinate
        address owner;              // Current owner's wallet address
        string ownerName;           // Owner's legal name
        string documentHash;        // IPFS hash of supporting documents
        uint256 registrationDate;   // Timestamp of registration
        bool isRegistered;          // Registration status
    }
    
    // Structure to store transfer history
    struct Transfer {
        address from;               // Previous owner
        address to;                 // New owner
        string newOwnerName;        // New owner's name
        uint256 transferDate;       // Timestamp of transfer
    }
    
    // Mappings
    mapping(string => Property) private properties;                    // propertyId => Property
    mapping(string => Transfer[]) private transferHistory;            // propertyId => Transfer history
    mapping(address => string[]) private ownerProperties;             // owner => propertyIds[]
    string[] private propertyIds;                                     // Array of all property IDs
    
    // Events
    event PropertyRegistered(
        string indexed propertyId,
        address indexed owner,
        uint256 registrationDate
    );
    
    event PropertyTransferred(
        string indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 transferDate
    );
    
    event PropertyUpdated(
        string indexed propertyId,
        address indexed owner,
        uint256 updateDate
    );
    
    // Modifiers
    modifier onlyPropertyOwner(string memory _propertyId) {
        require(
            properties[_propertyId].owner == msg.sender,
            "Only property owner can perform this action"
        );
        _;
    }
    
    modifier propertyExists(string memory _propertyId) {
        require(
            properties[_propertyId].isRegistered,
            "Property does not exist"
        );
        _;
    }
    
    modifier propertyNotExists(string memory _propertyId) {
        require(
            !properties[_propertyId].isRegistered,
            "Property already registered"
        );
        _;
    }
    
    /**
     * @dev Register a new property on the blockchain
     * @param _propertyId Unique property identifier
     * @param _address Full address of the property
     * @param _city City name
     * @param _postalCode Postal/ZIP code
     * @param _area Area in square meters
     * @param _latitude GPS latitude
     * @param _longitude GPS longitude
     * @param _ownerName Owner's legal name
     * @param _documentHash IPFS hash of supporting documents
     */
    function registerProperty(
        string memory _propertyId,
        string memory _address,
        string memory _city,
        string memory _postalCode,
        uint256 _area,
        string memory _latitude,
        string memory _longitude,
        string memory _ownerName,
        string memory _documentHash
    ) public propertyNotExists(_propertyId) {
        require(bytes(_propertyId).length > 0, "Property ID cannot be empty");
        require(bytes(_address).length > 0, "Address cannot be empty");
        require(_area > 0, "Area must be greater than 0");
        require(bytes(_ownerName).length > 0, "Owner name cannot be empty");
        
        // Create new property
        Property memory newProperty = Property({
            propertyId: _propertyId,
            propertyAddress: _address,
            city: _city,
            postalCode: _postalCode,
            area: _area,
            latitude: _latitude,
            longitude: _longitude,
            owner: msg.sender,
            ownerName: _ownerName,
            documentHash: _documentHash,
            registrationDate: block.timestamp,
            isRegistered: true
        });
        
        // Store property
        properties[_propertyId] = newProperty;
        propertyIds.push(_propertyId);
        ownerProperties[msg.sender].push(_propertyId);
        
        // Emit event
        emit PropertyRegistered(_propertyId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Transfer property ownership to a new owner
     * @param _propertyId Property identifier
     * @param _newOwner New owner's wallet address
     * @param _newOwnerName New owner's legal name
     */
    function transferProperty(
        string memory _propertyId,
        address _newOwner,
        string memory _newOwnerName
    ) public propertyExists(_propertyId) onlyPropertyOwner(_propertyId) {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != msg.sender, "Cannot transfer to yourself");
        require(bytes(_newOwnerName).length > 0, "New owner name cannot be empty");
        
        Property storage property = properties[_propertyId];
        address previousOwner = property.owner;
        
        // Record transfer in history
        Transfer memory newTransfer = Transfer({
            from: previousOwner,
            to: _newOwner,
            newOwnerName: _newOwnerName,
            transferDate: block.timestamp
        });
        transferHistory[_propertyId].push(newTransfer);
        
        // Update property ownership
        property.owner = _newOwner;
        property.ownerName = _newOwnerName;
        
        // Update owner properties mapping
        ownerProperties[_newOwner].push(_propertyId);
        
        // Remove from previous owner's list
        _removePropertyFromOwner(previousOwner, _propertyId);
        
        // Emit event
        emit PropertyTransferred(_propertyId, previousOwner, _newOwner, block.timestamp);
    }
    
    /**
     * @dev Update property details (only owner can update)
     * @param _propertyId Property identifier
     * @param _address Updated address
     * @param _documentHash Updated document hash
     */
    function updatePropertyDetails(
        string memory _propertyId,
        string memory _address,
        string memory _documentHash
    ) public propertyExists(_propertyId) onlyPropertyOwner(_propertyId) {
        Property storage property = properties[_propertyId];
        
        if (bytes(_address).length > 0) {
            property.propertyAddress = _address;
        }
        
        if (bytes(_documentHash).length > 0) {
            property.documentHash = _documentHash;
        }
        
        emit PropertyUpdated(_propertyId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get property details
     * @param _propertyId Property identifier
        * @return propertyId Property identifier
        * @return propertyAddress Physical address of the property
        * @return city City where the property is located
        * @return postalCode Postal code of the property location
        * @return area Area of the property
        * @return latitude Latitude coordinate
        * @return longitude Longitude coordinate
        * @return owner Current owner wallet address
        * @return ownerName Current owner name
        * @return documentHash Supporting document IPFS/content hash
        * @return registrationDate Registration timestamp
        * @return isRegistered Registration status flag
     */
    function getProperty(string memory _propertyId) public view returns (
        string memory propertyId,
        string memory propertyAddress,
        string memory city,
        string memory postalCode,
        uint256 area,
        string memory latitude,
        string memory longitude,
        address owner,
        string memory ownerName,
        string memory documentHash,
        uint256 registrationDate,
        bool isRegistered
    ) {
        Property memory property = properties[_propertyId];
        return (
            property.propertyId,
            property.propertyAddress,
            property.city,
            property.postalCode,
            property.area,
            property.latitude,
            property.longitude,
            property.owner,
            property.ownerName,
            property.documentHash,
            property.registrationDate,
            property.isRegistered
        );
    }
    
    /**
     * @dev Get transfer history for a property
     * @param _propertyId Property identifier
     * @return Array of all transfers
     */
    function getTransferHistory(string memory _propertyId) 
        public 
        view 
        propertyExists(_propertyId) 
        returns (Transfer[] memory) 
    {
        return transferHistory[_propertyId];
    }
    
    /**
     * @dev Get all properties owned by an address
     * @param _owner Owner's wallet address
     * @return Array of property IDs
     */
    function getPropertiesByOwner(address _owner) public view returns (string[] memory) {
        return ownerProperties[_owner];
    }
    
    /**
     * @dev Get total number of registered properties
     * @return Total count
     */
    function getPropertyCount() public view returns (uint256) {
        return propertyIds.length;
    }
    
    /**
     * @dev Get property ID by index
     * @param _index Index in the array
     * @return Property ID
     */
    function getPropertyIdByIndex(uint256 _index) public view returns (string memory) {
        require(_index < propertyIds.length, "Index out of bounds");
        return propertyIds[_index];
    }
    
    /**
     * @dev Verify if a property is registered
     * @param _propertyId Property identifier
     * @return Boolean indicating registration status
     */
    function isPropertyRegistered(string memory _propertyId) public view returns (bool) {
        return properties[_propertyId].isRegistered;
    }
    
    /**
     * @dev Internal function to remove property from owner's list
     * @param _owner Owner address
     * @param _propertyId Property identifier
     */
    function _removePropertyFromOwner(address _owner, string memory _propertyId) private {
        string[] storage ownedProperties = ownerProperties[_owner];
        
        for (uint256 i = 0; i < ownedProperties.length; i++) {
            if (keccak256(bytes(ownedProperties[i])) == keccak256(bytes(_propertyId))) {
                // Move the last element to the deleted position
                ownedProperties[i] = ownedProperties[ownedProperties.length - 1];
                // Remove the last element
                ownedProperties.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Get property verification details (for public verification)
     * @param _propertyId Property identifier
        * @return isRegistered Whether the property is registered
        * @return owner Current owner wallet address
        * @return ownerName Current owner name
        * @return registrationDate Registration timestamp
        * @return propertyAddress Physical address of the property
     */
    function verifyProperty(string memory _propertyId) public view returns (
        bool isRegistered,
        address owner,
        string memory ownerName,
        uint256 registrationDate,
        string memory propertyAddress
    ) {
        Property memory property = properties[_propertyId];
        return (
            property.isRegistered,
            property.owner,
            property.ownerName,
            property.registrationDate,
            property.propertyAddress
        );
    }
}
