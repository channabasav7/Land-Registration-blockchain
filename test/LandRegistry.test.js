const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("LandRegistry", function () {
  let LandRegistry;
  let landRegistry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await landRegistry.getAddress()).to.be.properAddress;
    });

    it("Should start with zero properties", async function () {
      const count = await landRegistry.getPropertyCount();
      expect(count).to.equal(0);
    });
  });

  describe("Property Registration", function () {
    it("Should register a property successfully", async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main Street",
        "New York",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        "QmHash123"
      );

      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.isRegistered).to.equal(true);
      expect(property.propertyId).to.equal("SN-2024-001");
      expect(property.propertyAddress).to.equal("123 Main Street");
      expect(property.city).to.equal("New York");
      expect(property.ownerName).to.equal("John Doe");
      expect(property.owner).to.equal(owner.address);
    });

    it("Should increment property count", async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        ""
      );

      const count = await landRegistry.getPropertyCount();
      expect(count).to.equal(1);
    });

    it("Should emit PropertyRegistered event", async function () {
      await expect(
        landRegistry.registerProperty(
          "SN-2024-001",
          "123 Main St",
          "NYC",
          "10001",
          1000,
          "40.7128",
          "-74.0060",
          "John Doe",
          ""
        )
      )
        .to.emit(landRegistry, "PropertyRegistered")
        .withArgs("SN-2024-001", owner.address, anyValue);
    });

    it("Should reject duplicate property registration", async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        ""
      );

      await expect(
        landRegistry.registerProperty(
          "SN-2024-001",
          "456 Oak Ave",
          "LA",
          "90001",
          2000,
          "34.0522",
          "-118.2437",
          "Jane Smith",
          ""
        )
      ).to.be.revertedWith("Property already registered");
    });

    it("Should reject empty property ID", async function () {
      await expect(
        landRegistry.registerProperty(
          "",
          "123 Main St",
          "NYC",
          "10001",
          1000,
          "40.7128",
          "-74.0060",
          "John Doe",
          ""
        )
      ).to.be.revertedWith("Property ID cannot be empty");
    });

    it("Should reject empty address", async function () {
      await expect(
        landRegistry.registerProperty(
          "SN-2024-001",
          "",
          "NYC",
          "10001",
          1000,
          "40.7128",
          "-74.0060",
          "John Doe",
          ""
        )
      ).to.be.revertedWith("Address cannot be empty");
    });

    it("Should reject zero area", async function () {
      await expect(
        landRegistry.registerProperty(
          "SN-2024-001",
          "123 Main St",
          "NYC",
          "10001",
          0,
          "40.7128",
          "-74.0060",
          "John Doe",
          ""
        )
      ).to.be.revertedWith("Area must be greater than 0");
    });

    it("Should reject empty owner name", async function () {
      await expect(
        landRegistry.registerProperty(
          "SN-2024-001",
          "123 Main St",
          "NYC",
          "10001",
          1000,
          "40.7128",
          "-74.0060",
          "",
          ""
        )
      ).to.be.revertedWith("Owner name cannot be empty");
    });
  });

  describe("Property Transfer", function () {
    beforeEach(async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        ""
      );
    });

    it("Should transfer property successfully", async function () {
      await landRegistry.transferProperty(
        "SN-2024-001",
        addr1.address,
        "Jane Smith"
      );

      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.owner).to.equal(addr1.address);
      expect(property.ownerName).to.equal("Jane Smith");
    });

    it("Should emit PropertyTransferred event", async function () {
      await expect(
        landRegistry.transferProperty(
          "SN-2024-001",
          addr1.address,
          "Jane Smith"
        )
      )
        .to.emit(landRegistry, "PropertyTransferred")
        .withArgs("SN-2024-001", owner.address, addr1.address, anyValue);
    });

    it("Should record transfer in history", async function () {
      await landRegistry.transferProperty(
        "SN-2024-001",
        addr1.address,
        "Jane Smith"
      );

      const history = await landRegistry.getTransferHistory("SN-2024-001");
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(owner.address);
      expect(history[0].to).to.equal(addr1.address);
      expect(history[0].newOwnerName).to.equal("Jane Smith");
    });

    it("Should only allow owner to transfer", async function () {
      await expect(
        landRegistry.connect(addr1).transferProperty(
          "SN-2024-001",
          addr2.address,
          "Bob Johnson"
        )
      ).to.be.revertedWith("Only property owner can perform this action");
    });

    it("Should reject transfer to zero address", async function () {
      await expect(
        landRegistry.transferProperty(
          "SN-2024-001",
          ethers.ZeroAddress,
          "Invalid"
        )
      ).to.be.revertedWith("Invalid new owner address");
    });

    it("Should reject transfer to self", async function () {
      await expect(
        landRegistry.transferProperty(
          "SN-2024-001",
          owner.address,
          "John Doe"
        )
      ).to.be.revertedWith("Cannot transfer to yourself");
    });

    it("Should reject transfer with empty name", async function () {
      await expect(
        landRegistry.transferProperty(
          "SN-2024-001",
          addr1.address,
          ""
        )
      ).to.be.revertedWith("New owner name cannot be empty");
    });

    it("Should handle multiple transfers", async function () {
      // First transfer
      await landRegistry.transferProperty(
        "SN-2024-001",
        addr1.address,
        "Jane Smith"
      );

      // Second transfer
      await landRegistry.connect(addr1).transferProperty(
        "SN-2024-001",
        addr2.address,
        "Bob Johnson"
      );

      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.owner).to.equal(addr2.address);
      expect(property.ownerName).to.equal("Bob Johnson");

      const history = await landRegistry.getTransferHistory("SN-2024-001");
      expect(history.length).to.equal(2);
    });
  });

  describe("Property Update", function () {
    beforeEach(async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        ""
      );
    });

    it("Should update property address", async function () {
      await landRegistry.updatePropertyDetails(
        "SN-2024-001",
        "456 New Address",
        ""
      );

      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.propertyAddress).to.equal("456 New Address");
    });

    it("Should update document hash", async function () {
      await landRegistry.updatePropertyDetails(
        "SN-2024-001",
        "",
        "QmNewHash456"
      );

      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.documentHash).to.equal("QmNewHash456");
    });

    it("Should emit PropertyUpdated event", async function () {
      await expect(
        landRegistry.updatePropertyDetails(
          "SN-2024-001",
          "456 New Address",
          "QmHash"
        )
      )
        .to.emit(landRegistry, "PropertyUpdated")
        .withArgs("SN-2024-001", owner.address, anyValue);
    });

    it("Should only allow owner to update", async function () {
      await expect(
        landRegistry.connect(addr1).updatePropertyDetails(
          "SN-2024-001",
          "Unauthorized Update",
          ""
        )
      ).to.be.revertedWith("Only property owner can perform this action");
    });
  });

  describe("Property Queries", function () {
    beforeEach(async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        "QmHash1"
      );

      await landRegistry.connect(addr1).registerProperty(
        "SN-2024-002",
        "456 Oak Ave",
        "LA",
        "90001",
        2000,
        "34.0522",
        "-118.2437",
        "Jane Smith",
        "QmHash2"
      );
    });

    it("Should get property by ID", async function () {
      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.propertyId).to.equal("SN-2024-001");
      expect(property.ownerName).to.equal("John Doe");
    });

    it("Should get property count", async function () {
      const count = await landRegistry.getPropertyCount();
      expect(count).to.equal(2);
    });

    it("Should get property ID by index", async function () {
      const id1 = await landRegistry.getPropertyIdByIndex(0);
      const id2 = await landRegistry.getPropertyIdByIndex(1);
      expect(id1).to.equal("SN-2024-001");
      expect(id2).to.equal("SN-2024-002");
    });

    it("Should get properties by owner", async function () {
      const ownerProperties = await landRegistry.getPropertiesByOwner(owner.address);
      expect(ownerProperties.length).to.equal(1);
      expect(ownerProperties[0]).to.equal("SN-2024-001");

      const addr1Properties = await landRegistry.getPropertiesByOwner(addr1.address);
      expect(addr1Properties.length).to.equal(1);
      expect(addr1Properties[0]).to.equal("SN-2024-002");
    });

    it("Should verify property registration", async function () {
      const isRegistered = await landRegistry.isPropertyRegistered("SN-2024-001");
      expect(isRegistered).to.equal(true);

      const notRegistered = await landRegistry.isPropertyRegistered("SN-2024-999");
      expect(notRegistered).to.equal(false);
    });

    it("Should get verification details", async function () {
      const verification = await landRegistry.verifyProperty("SN-2024-001");
      expect(verification.isRegistered).to.equal(true);
      expect(verification.owner).to.equal(owner.address);
      expect(verification.ownerName).to.equal("John Doe");
      expect(verification.propertyAddress).to.equal("123 Main St");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle property with no document hash", async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        ""
      );

      const property = await landRegistry.getProperty("SN-2024-001");
      expect(property.documentHash).to.equal("");
    });

    it("Should reject getting non-existent property", async function () {
      const property = await landRegistry.getProperty("NON-EXISTENT");
      expect(property.isRegistered).to.equal(false);
    });

    it("Should reject out of bounds index", async function () {
      await expect(
        landRegistry.getPropertyIdByIndex(999)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("Should handle transfer history for property with no transfers", async function () {
      await landRegistry.registerProperty(
        "SN-2024-001",
        "123 Main St",
        "NYC",
        "10001",
        1000,
        "40.7128",
        "-74.0060",
        "John Doe",
        ""
      );

      const history = await landRegistry.getTransferHistory("SN-2024-001");
      expect(history.length).to.equal(0);
    });
  });
});
