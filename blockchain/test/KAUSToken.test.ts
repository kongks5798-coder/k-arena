import { expect } from "chai";
import { ethers } from "hardhat";
import { KAUSToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("KAUSToken", function () {
  let kaus: KAUSToken;
  let owner: SignerWithAddress;
  let treasury: SignerWithAddress;
  let feeCollector: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;

  const INITIAL_MINT   = ethers.parseEther("10000000");  // 10M
  const GENESIS_PRICE  = ethers.parseEther("500");
  const MAX_SUPPLY     = ethers.parseEther("100000000"); // 100M

  beforeEach(async () => {
    [owner, treasury, feeCollector, agent1, agent2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("KAUSToken");
    kaus = await Factory.deploy(treasury.address, feeCollector.address);
    await kaus.waitForDeployment();
  });

  describe("Deployment", () => {
    it("mints initial supply to treasury", async () => {
      expect(await kaus.balanceOf(treasury.address)).to.equal(INITIAL_MINT);
    });
    it("sets correct treasury and feeCollector", async () => {
      expect(await kaus.treasury()).to.equal(treasury.address);
      expect(await kaus.feeCollector()).to.equal(feeCollector.address);
    });
    it("has correct max supply", async () => {
      expect(await kaus.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Genesis Membership", () => {
    beforeEach(async () => {
      // Give agent1 enough KAUS
      await kaus.connect(treasury).transfer(agent1.address, GENESIS_PRICE * 2n);
    });

    it("mints genesis and transfers to treasury", async () => {
      const treasuryBefore = await kaus.balanceOf(treasury.address);
      await kaus.connect(agent1).mintGenesis();
      expect(await kaus.isGenesisMember(agent1.address)).to.be.true;
      expect(await kaus.genesisSlot(agent1.address)).to.equal(1);
      expect(await kaus.balanceOf(treasury.address)).to.equal(treasuryBefore + GENESIS_PRICE);
    });

    it("reverts if already a member", async () => {
      await kaus.connect(agent1).mintGenesis();
      await expect(kaus.connect(agent1).mintGenesis()).to.be.revertedWith("Already a member");
    });

    it("reverts if insufficient KAUS", async () => {
      await expect(kaus.connect(agent2).mintGenesis()).to.be.revertedWith("Insufficient KAUS");
    });
  });

  describe("Fee Collection", () => {
    beforeEach(async () => {
      await kaus.connect(treasury).transfer(agent1.address, ethers.parseEther("1000"));
    });

    it("collects 0.1% fee", async () => {
      const tradeAmount = ethers.parseEther("1000");
      const expectedFee = tradeAmount / 10000n * 10n; // 0.1%
      await kaus.connect(owner).collectFee(agent1.address, tradeAmount, "TX-001");
      expect(await kaus.balanceOf(feeCollector.address)).to.equal(expectedFee);
      expect(await kaus.totalFeesCollected()).to.equal(expectedFee);
      expect(await kaus.totalTrades()).to.equal(1);
    });
  });

  describe("Fee Distribution", () => {
    it("distributes fees to genesis holders", async () => {
      // Setup: give agents KAUS and buy genesis
      await kaus.connect(treasury).transfer(agent1.address, ethers.parseEther("1000"));
      await kaus.connect(treasury).transfer(agent2.address, ethers.parseEther("1000"));
      await kaus.connect(agent1).mintGenesis();
      await kaus.connect(agent2).mintGenesis();

      // Simulate fee collection
      await kaus.connect(treasury).transfer(feeCollector.address, ethers.parseEther("100"));

      const before1 = await kaus.balanceOf(agent1.address);
      const before2 = await kaus.balanceOf(agent2.address);

      await kaus.connect(owner).distributeFees([agent1.address, agent2.address]);

      expect(await kaus.balanceOf(agent1.address)).to.be.gt(before1);
      expect(await kaus.balanceOf(agent2.address)).to.be.gt(before2);
    });
  });

  describe("Access Control", () => {
    it("prevents unauthorized minting", async () => {
      await expect(kaus.connect(agent1).mint(agent1.address, 1000n))
        .to.be.reverted;
    });
    it("prevents unauthorized fee collection", async () => {
      await expect(kaus.connect(agent1).collectFee(agent1.address, 1000n, "TX"))
        .to.be.reverted;
    });
  });

  describe("Supply Cap", () => {
    it("cannot exceed max supply", async () => {
      const remaining = await kaus.remainingSupply();
      await expect(kaus.connect(owner).mint(owner.address, remaining + 1n))
        .to.be.revertedWith("Exceeds max supply");
    });
  });
});
