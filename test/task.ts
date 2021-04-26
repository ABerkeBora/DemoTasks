import { task } from "hardhat/config";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { expect } from "chai";

describe("SimpleStorage Contract", () => {
    let SimpleStorage, simpleStorage, owner, addr2, Proxy, proxy;

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
            await expect(simpleStorage.connect(addr2).setValue(300)).to.be.revertedWith("Ownable: caller is not the owner");
            expect(await simpleStorage.getValue()).to.equal(0);
        });
    });
    describe("Proxy Contract Interaction with SimpleStorage",async () => {
        

        it("Should fail if tried to use runProxy without changing the owner of the contract", async () => {
            
            await expect(proxy.runProxy(100)).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Should be able use runProxy after changing the owner of the contract", async () => {
            await simpleStorage.transferOwnership(proxy.address);
            expect(await proxy.runProxy(100));
            expect(await simpleStorage.getValue()).to.be.equal(100);
        });
    });



});