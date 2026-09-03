import { network } from "hardhat";
import { expect } from "chai";

describe("Multisig42", function () {
  const REQUIRED = 2;

  async function setup() {
    const { ethers } = await network.create();
    const [owner1, owner2, owner3, other] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const multisig = await ethers.deployContract("Multisig42", [owners, REQUIRED]);
    return { ethers, multisig, owner1, owner2, owner3, other, owners };
  }

  it("initialise les owners et le seuil requis", async function () {
    const { multisig, owners } = await setup();
    expect(await multisig.required()).to.equal(REQUIRED);
    expect(await multisig.ownersCount()).to.equal(owners.length);
    for (const addr of owners) {
      expect(await multisig.isOwner(addr)).to.equal(true);
    }
  });

  it("refuse un seuil de 0", async function () {
    const { ethers } = await network.create();
    const [o1, o2] = await ethers.getSigners();
    await expect(ethers.deployContract("Multisig42", [[o1.address, o2.address], 0]))
      .to.be.revertedWith("invalid required");
  });

  it("refuse un seuil supérieur au nombre d'owners", async function () {
    const { ethers } = await network.create();
    const [o1, o2] = await ethers.getSigners();
    await expect(ethers.deployContract("Multisig42", [[o1.address, o2.address], 3]))
      .to.be.revertedWith("invalid required");
  });

  it("refuse un owner en double", async function () {
    const { ethers } = await network.create();
    const [o1] = await ethers.getSigners();
    await expect(ethers.deployContract("Multisig42", [[o1.address, o1.address], 1]))
      .to.be.revertedWith("duplicate owner");
  });

  it("autorise un owner à proposer une transaction", async function () {
    const { multisig, owner1, owner3 } = await setup();
    await multisig.connect(owner1).submitTransaction(owner3.address, 0, "0x");
    const stored = await multisig.transactions(0);
    expect(stored.confirmations).to.equal(0n);
    expect(stored.executed).to.equal(false);
  });

  it("refuse une proposition venant d'un non-owner", async function () {
    const { multisig, other } = await setup();
    await expect(multisig.connect(other).submitTransaction(other.address, 0, "0x"))
      .to.be.revertedWith("not an owner");
  });

  it("n'exécute pas tant que le seuil n'est pas atteint", async function () {
    const { multisig, owner1, owner3 } = await setup();
    await multisig.connect(owner1).submitTransaction(owner3.address, 0, "0x");
    await multisig.connect(owner1).confirmTransaction(0);

    await expect(multisig.connect(owner1).executeTransaction(0))
      .to.be.revertedWith("not enough confirmations");
  });

  it("exécute une fois le seuil de 2 confirmations atteint", async function () {
    const { multisig, owner1, owner2, owner3 } = await setup();
    await multisig.connect(owner1).submitTransaction(owner3.address, 0, "0x");
    await multisig.connect(owner1).confirmTransaction(0);
    await multisig.connect(owner2).confirmTransaction(0);

    await multisig.connect(owner1).executeTransaction(0);

    const stored = await multisig.transactions(0);
    expect(stored.executed).to.equal(true);
  });

  it("refuse de confirmer deux fois avec le même owner", async function () {
    const { multisig, owner1, owner3 } = await setup();
    await multisig.connect(owner1).submitTransaction(owner3.address, 0, "0x");
    await multisig.connect(owner1).confirmTransaction(0);

    await expect(multisig.connect(owner1).confirmTransaction(0))
      .to.be.revertedWith("already confirmed");
  });

  it("gouverne réellement Token42BEBonus via mint après transfert d'ownership", async function () {
    const { ethers, multisig, owner1, owner2, owner3 } = await setup();
    const token = await ethers.deployContract("Token42BEBonus");

    await token.transferOwnership(await multisig.getAddress());
    expect(await token.owner()).to.equal(await multisig.getAddress());

    const amount = 1_000n * 10n ** 18n;
    const data = token.interface.encodeFunctionData("mint", [owner3.address, amount]);

    await multisig.connect(owner1).submitTransaction(await token.getAddress(), 0, data);
    await multisig.connect(owner1).confirmTransaction(0);
    await multisig.connect(owner2).confirmTransaction(0);
    await multisig.connect(owner1).executeTransaction(0);

    expect(await token.balanceOf(owner3.address)).to.equal(amount);
  });
});
