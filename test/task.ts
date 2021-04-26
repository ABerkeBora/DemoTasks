import { task } from "hardhat/config";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { expect } from "chai";

describe("SimpleStorage Contract", () => {
  let SimpleStorage, simpleStorage, Proxy, proxy, owner, addr2;

  beforeEach(async () => {
    SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await SimpleStorage.deploy(0);
    [owner, addr2] = await ethers.getSigners();
    Proxy = await ethers.getContractFactory("Proxy");
    proxy = await Proxy.deploy(simpleStorage.address);
  });
  describe("Setter & Getter for Value", () => {
    it("Should be able to set and get the Value correctly", async () => {
      await simpleStorage.setValue(100);
      expect(await simpleStorage.getValue()).to.equal(100);
    });
  });
  describe("Setter for Value is only called by owner", () => {
    it("Should be able to get called by owner", async () => {
      await simpleStorage.connect(owner).setValue(200);
      expect(await simpleStorage.getValue()).to.equal(200);
    });
    it("Shouldn't be able to get called by another address", async () => {
      await expect(
        simpleStorage.connect(addr2).setValue(300)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      expect(await simpleStorage.getValue()).to.equal(0);
    });
  });
  describe("Proxy Contract Interaction with SimpleStorage", () => {
    it("Should fail if tried to use runProxy without changing the owner of the contract", async () => {
      await expect(proxy.runProxy(100)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
    it("Should be able use runProxy after changing the owner of the contract", async () => {
      await simpleStorage.transferOwnership(proxy.address);
      expect(await proxy.runProxy(100));
      expect(await simpleStorage.getValue()).to.be.equal(100);
    });
  });
});

describe("ERC20 Token & Another Contract", () => {
  let Token, token, Another, another, owner, addr2, addr3;
  beforeEach(async () => {
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    [owner, addr2, addr3] = await ethers.getSigners();
    Another = await ethers.getContractFactory("AnotherContract");
    another = await Another.deploy(token.address);
  });
  describe("Token", () => {
    it("Should be able to deploy the token and mint for the deployer's address", async () => {
      expect(await token.totalSupply()).to.be.equal(1000);
      expect(await token.balanceOf(owner.address)).to.be.equal(1000);
    });
    it("Should be able to transfer tokens for some other address", async () => {
      await token.transfer(addr2.address, 100);
      expect(await token.balanceOf(addr2.address)).to.be.equal(100); //transfer is from owner's balance
      expect(await token.balanceOf(owner.address)).to.be.equal(900);
      expect(await token.totalSupply()).to.be.equal(1000);
    });
  });
  describe("Another Contract interaction with Token", () => {
    it("Should be able to Approve for the AnotherContract", async () => {
      await token.approve(another.address, 500);
      expect(await token.allowance(owner.address, another.address)).to.be.equal(
        500
      );
    });
    it("Should be able to transfer the approved amount from AnotherContract to outsider address", async () => {
      await token.approve(another.address, 500); //owner makes allowance for our contract
      expect(await token.allowance(owner.address, another.address)).to.be.equal(
        500
      ); //we see that allowance
      await another.transferFromContractAllowance(addr2.address, 300); //We call transferFromContractSupply
      expect(await token.balanceOf(addr2.address)).to.be.equal(300);
    });
    it("Shouldn't let any address other than approver to call the transferFromContractAllowance", async () => {
      await token.connect(addr2).approve(another.address, 500);
      expect(await token.allowance(addr2.address, another.address)).to.be.equal(
        500
      );
      await expect(
        another.connect(owner).transferFromContractAllowance(addr2.address, 300)
      ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
    });
  });
});
