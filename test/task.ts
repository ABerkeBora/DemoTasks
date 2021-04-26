import { task } from "hardhat/config";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { expect } from "chai";

describe("SimpleStorage Contract", () => {
    let SimpleStorage, simpleStorage, owner, addr2;

    beforeEach(async () => {
        SimpleStorage = await ethers.getContractFactory("SimpleStorage");
        simpleStorage = await SimpleStorage.deploy();
        [owner, addr2] = await ethers.getSigners();
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
    



});