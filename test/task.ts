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
describe("Storage with Mapping", () => {
  let StorageWithMapping, storageWithMapping, owner, addr2;
  beforeEach(async () => {
    StorageWithMapping = await ethers.getContractFactory("StorageWithMapping");
    storageWithMapping = await StorageWithMapping.deploy();
    [owner, addr2] = await ethers.getSigners();
  });

  describe("Setter & Getter with mapping", () => {
    it("Should be able to set & get same value with same key", async () => {
      await storageWithMapping.setValue(
        ethers.utils.formatBytes32String("abc"),
        100
      );
      expect(
        await storageWithMapping.getValue(
          ethers.utils.formatBytes32String("abc")
        )
      ).to.equal(100);
      await storageWithMapping.setValue(
        ethers.utils.formatBytes32String("ree"),
        250
      );
      expect(
        await storageWithMapping.getValue(
          ethers.utils.formatBytes32String("ree")
        )
      ).to.equal(250);
    });
    it("Only owner should be able to set the value, reverting when someone else tries to set", async () => {
      await expect(
        storageWithMapping
          .connect(addr2)
          .setValue(ethers.utils.formatBytes32String("abc"), 100)
      ).to.be.revertedWith("Only owner can call this function.");
      expect(
        await storageWithMapping.getValue(
          ethers.utils.formatBytes32String("abc")
        )
      ).to.equal(0);
    });
    it("Should be able to set the same key & value pair twice", async () => {
      await storageWithMapping.setValue(
        ethers.utils.formatBytes32String("abc"),
        100
      );
      expect(
        await storageWithMapping.getValue(
          ethers.utils.formatBytes32String("abc")
        )
      ).to.equal(100);
      await storageWithMapping.setValue(
        ethers.utils.formatBytes32String("abc"),
        250
      );
      expect(
        await storageWithMapping.getValue(
          ethers.utils.formatBytes32String("abc")
        )
      ).to.equal(250);
    });
  });
  describe("Testing & Emitting ValueSet", () => {
    it("Emitting the Event correctly with right variables after setValue triggered", async () => {
      await expect(
        storageWithMapping.setValue(
          ethers.utils.formatBytes32String("abc"),
          100
        )
      )
        .to.emit(storageWithMapping, "ValueSet")
        .withArgs(ethers.utils.formatBytes32String("abc"), 100);
    });
  });
});
describe("D Contract & Lines", () => {
  let D, d, Token, token, Token2, token2, owner, addr2, addr3, addr4;
  let maturityDate;
  let expectedMaturityDate;
  let expectedLineID;
  beforeEach(async () => {
    D = await ethers.getContractFactory("D");
    d = await D.deploy();
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    Token2 = await ethers.getContractFactory("Token");
    token2 = await Token2.deploy();
    [owner, addr2, addr3, addr4] = await ethers.getSigners();
    maturityDate =
      (2020 - 1970) * 365 * 24 * 60 * 60 + 60 * 60 * 9 + 60 * 35 + 48;
    //Addition is there so we can test if rolling to midnight is functioning right I ignore the leap years as we dont really need to check it right now, we need to do it right on front end
    //Using 2020 date so we can withdraw or else it wont let us withdraw because of the require condition
    expectedMaturityDate = maturityDate - (maturityDate % (60 * 60 * 24));
    expectedLineID = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256"],
      [owner.address, expectedMaturityDate, token.address]
    );
  });

  describe("Deploying Contract and openLine()", () => {
    it("Should be able to use Openline with right inputs & emit events", async () => {
      await expect(
        d.openLine(
          maturityDate,
          token.address,
          [addr2.address, addr3.address],
          [100, 200]
        )
      )
        .to.emit(d, "LineOpened")
        .withArgs(expectedLineID, owner.address, addr2.address);

      await expect(
        d.openLine(
          maturityDate,
          token.address,
          [addr2.address, addr3.address],
          [100, 200]
        )
      )
        .to.emit(d, "LineOpened")
        .withArgs(expectedLineID, owner.address, addr3.address);

      //if balances were public, we could just check it by the addresses.
      //expect(await d.balances(expectedLineID,addr3.address)).to.equal(400);
      //expect(await d.balances(expectedLineID,0)).to.equal(600);
    });
    it("Should revert with right message if arrays are not in same length", async () => {
      await expect(
        d.openLine(
          maturityDate,
          token.address,
          [owner.address, addr2.address, addr3.address],
          [100, 200]
        )
      ).to.be.revertedWith("recievers and amounts array lengths should match");
      await expect(
        d.openLine(
          maturityDate,
          token.address,
          [addr2.address, addr3.address],
          [100, 200, 300]
        )
      ).to.be.revertedWith("recievers and amounts array lengths should match");
    });
    it("Should revert with the right message if there is a zero address in reciever addresses.", async () => {
      await expect(
        d.openLine(
          maturityDate,
          token.address,
          [owner.address, "0x0000000000000000000000000000000000000000"],
          [100, 200]
        )
      ).to.be.revertedWith("Zero address can't recieve as it means burning");
    });
  });
  describe("transferLine()", () => {
    it("Should be able to use TransferLine & emit events", async () => {
      d.openLine(
        maturityDate,
        token.address,
        [owner.address, addr2.address, addr3.address],
        [600, 200, 300]
      );
      expect(
        await d.transferLine(
          expectedLineID,
          [addr2.address, addr3.address],
          [100, 200]
        )
      )
        .to.emit(d, "LineTransferred")
        .withArgs(expectedLineID, addr2.address);

      expect(
        await d.transferLine(
          expectedLineID,
          [addr2.address, addr3.address],
          [100, 200]
        )
      )
        .to.emit(d, "LineTransferred")
        .withArgs(expectedLineID, addr3.address);
    });
    it("Should revert with right message if arrays are not in same length", async () => {
      d.openLine(maturityDate, token.address, [owner.address], [600]);

      await expect(
        d.transferLine(
          expectedLineID,
          [addr2.address, addr3.address],
          [100, 200, 300]
        )
      ).to.be.revertedWith("recievers and amounts array lengths should match");

      await expect(
        d.transferLine(
          expectedLineID,
          [owner.address, addr2.address, addr3.address],
          [100, 200]
        )
      ).to.be.revertedWith("recievers and amounts array lengths should match");
    });
    it("Should revert if transferLine() caller doesn't have enough balance in its index", async () => {
      d.openLine(maturityDate, token.address, [owner.address], [300]);
      await expect(
        d.transferLine(
          expectedLineID,
          [addr2.address, addr3.address],
          [200, 200]
        )
      ).to.be.revertedWith(
        "Sender does not have the total amount to send to all"
      );
    });
    it("Should revert if there is zero address in the recievers", async () => {
      d.openLine(maturityDate, token.address, [], []);
      await expect(
        d.transferLine(
          expectedLineID,
          ["0x0000000000000000000000000000000000000000", addr3.address],
          [100, 100]
        )
      ).to.be.revertedWith("Zero address can't recieve as it means burning");
    });
  });
  describe("Issuer Issuing erc20Token & closeLine() & Withdraw by the reciever", () => {
    it("closeLine() should revert if issuer didn't issue tokens to contract or didn't issued enough tokens", async () => {
      await d.openLine(
        maturityDate,
        token.address,
        [addr2.address, addr3.address],
        [100, 200]
      );
      await expect(d.closeLine(maturityDate, token.address)).to.be.revertedWith(
        "ERC20: transfer amount exceeds allowance"
      );
      await token.approve(d.address, 250);
      await expect(d.closeLine(maturityDate, token.address)).to.be.revertedWith(
        "ERC20: transfer amount exceeds allowance"
      );
    });
    it("Close Line, D contract should have totalAmount of tokens transferred", async () => {
      await d.openLine(
        maturityDate,
        token.address,
        [owner.address, addr2.address, addr3.address],
        [400, 100, 200]
      );
      await d.transferLine(
        expectedLineID,
        [addr2.address, addr3.address],
        [100, 200]
      );
      await token.approve(d.address, 800); //Issuer is owner of the Token too so he has 1000 and gives 800 allowance to the D contract
      expect(await d.closeLine(maturityDate, token.address)); //With closing, we only transfer 700 of allowance as total amount is 700
      expect(await token.balanceOf(d.address)).equal(700);
      expect(await token.balanceOf(owner.address)).equal(300);
      //Someone else can't call the closeLine and close the right Line with lineID because it is generated with msg.sender
    });
    it("withdraw(), after function everybody gets right balances", async () => {
      await d.openLine(
        maturityDate,
        token.address,
        [owner.address, addr2.address, addr3.address],
        [400, 100, 200]
      );
      await d.transferLine(
        expectedLineID,
        [addr2.address, addr3.address],
        [100, 200]
      );
      await token.approve(d.address, 800);
      expect(await d.closeLine(maturityDate, token.address));
      expect(await token.balanceOf(d.address)).equal(700);
      expect(await token.balanceOf(owner.address)).equal(300);

      expect(await token.balanceOf(addr2.address)).to.equal(0);
      expect(await token.balanceOf(addr3.address)).to.equal(0);
      expect(
        await d
          .connect(addr2)
          .withdraw(owner.address, maturityDate, token.address)
      );
      expect(await token.balanceOf(addr2.address)).to.equal(200);
      expect(
        await d
          .connect(addr3)
          .withdraw(owner.address, maturityDate, token.address)
      );
      expect(await token.balanceOf(addr3.address)).to.equal(400);
      expect(await token.balanceOf(d.address)).to.equal(100);
    });
    it("Should Revert withdraw if reciever tries function with different parameters as newLineID would be empty, like unit(trying to withdraw different token)", async () => {
      await d.openLine(
        maturityDate,
        token.address,
        [owner.address, addr2.address, addr3.address],
        [400, 100, 200]
      );
      await d.transferLine(
        expectedLineID,
        [addr2.address, addr3.address],
        [100, 200]
      );
      await token.approve(d.address, 800);
      await token2.approve(d.address, 900);
      expect(await d.closeLine(maturityDate, token.address));
      await expect(
        d.connect(addr3).withdraw(owner.address, maturityDate, token2.address) //different token
      ).to.be.revertedWith(
        "There is no balance for this user on this lineID Generated"
      );
      await expect(
        d.connect(addr3).withdraw(owner.address, 1000, token.address)
      ).to.be.revertedWith(
        "There is no balance for this user on this lineID Generated"
      );
    });

    it("Should revert withdrawing if maturityDate has not come", async () => {
      maturityDate =
        (2022 - 1970) * 365 * 24 * 60 * 60 + 60 * 60 * 9 + 60 * 35 + 48; //Using a year that we haven't reached yet to see if it is going to revert, because of the timestamp usage this test might need to get updated
      expectedMaturityDate = maturityDate - (maturityDate % (60 * 60 * 24));
      expectedLineID = ethers.utils.solidityKeccak256(
        ["uint256", "uint256", "uint256"],
        [owner.address, expectedMaturityDate, token.address]
      );
      await d.openLine(
        maturityDate,
        token.address,
        [owner.address, addr2.address, addr3.address],
        [400, 100, 200]
      );
      await d.transferLine(
        expectedLineID,
        [addr2.address, addr3.address],
        [100, 200]
      );
      await token.approve(d.address, 800);
      expect(await d.closeLine(maturityDate, token.address));
      expect(await token.balanceOf(d.address)).equal(700);
      expect(await token.balanceOf(owner.address)).equal(300);

      expect(await token.balanceOf(addr2.address)).to.equal(0);
      expect(await token.balanceOf(addr3.address)).to.equal(0);
      await expect(
        d.connect(addr2).withdraw(owner.address, maturityDate, token.address)
      ).to.be.revertedWith("Maturity Date is not up, you can't withdraw yet");
      expect(await token.balanceOf(addr2.address)).to.equal(0);
      await expect(
        d.connect(addr3).withdraw(owner.address, maturityDate, token.address)
      ).to.be.revertedWith("Maturity Date is not up, you can't withdraw yet");
      expect(await token.balanceOf(addr3.address)).to.equal(0);
      expect(await token.balanceOf(d.address)).to.equal(700);
    });
  });
});
