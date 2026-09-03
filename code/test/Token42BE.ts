import { network } from "hardhat";
import { expect } from "chai";

describe("Token42BE", function () {
  const INITIAL_SUPPLY = 250_000n * 10n ** 18n;
  const CAP = 4_200_000n * 10n ** 18n;

  async function setup() {
    const { ethers } = await network.create();
    const [owner, other] = await ethers.getSigners();
    const token = await ethers.deployContract("Token42BE");
    return { token, owner, other };
  }

  it("attribue la supply initiale au déployeur", async function () {
    const { token, owner } = await setup();
    expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
  });

  it("autorise un transfert entre deux comptes", async function () {
    const { token, owner, other } = await setup();
    const amount = 100n * 10n ** 18n;

    await token.transfer(other.address, amount);

    expect(await token.balanceOf(other.address)).to.equal(amount);
    expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount);
  });

  it("autorise l'owner à mint", async function () {
    const { token, other } = await setup();
    const amount = 1_000n * 10n ** 18n;

    await token.mint(other.address, amount);

    expect(await token.balanceOf(other.address)).to.equal(amount);
  });

  it("refuse un mint venant d'un non-owner", async function () {
    const { token, other } = await setup();

    await expect(token.connect(other).mint(other.address, 1n))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("refuse un mint qui dépasserait le cap", async function () {
    const { token, owner } = await setup();
    const overCapAmount = CAP - INITIAL_SUPPLY + 1n;

    await expect(token.mint(owner.address, overCapAmount))
      .to.be.revertedWithCustomError(token, "ERC20ExceededCap")
      .withArgs(CAP + 1n, CAP);
  });

  it("autorise l'owner à burn ses propres tokens", async function () {
    const { token, owner } = await setup();
    const amount = 50_000n * 10n ** 18n;

    await token.burn(amount);

    expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount);
  });

  it("refuse un burn venant d'un non-owner", async function () {
    const { token, other } = await setup();

    await expect(token.connect(other).burn(1n))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });
});
