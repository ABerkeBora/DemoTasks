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
        it("Should be able to set and get the Value from outside", async () => {
            await simpleStorage.setValue(100);
            expect(await simpleStorage.getValue()).to.equal(100);
        });
    });
    



});