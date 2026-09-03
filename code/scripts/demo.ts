import { network } from "hardhat";

// À adapter juste avant de lancer, si tu redéploies en direct pendant la soutenance :
const TOKEN_ADDRESS = "0x9829a5e82924C916c8fdc3d7c317f61B36a441F1";
const OTHER_ACCOUNT = "0xDadCB6847386E840A789d1d47bC8165394B81101";

async function main() {
  const { ethers } = await network.create();
  const [owner] = await ethers.getSigners();
  const nonOwner = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY_2 ?? "", ethers.provider);

  const token = await ethers.getContractAt("Token42BE", TOKEN_ADDRESS, owner);

  console.log("Contrat sur Etherscan : https://sepolia.etherscan.io/address/" + TOKEN_ADDRESS + "#code\n");

  function explainError(error: unknown): string {
    const data = (error as { data?: string }).data;
    if (data) {
      try {
        const decoded = token.interface.parseError(data);
        if (decoded) {
          return `${decoded.name}(${decoded.args.map(String).join(", ")})`;
        }
      } catch {
        // pas décodable, on retombe sur le message générique
      }
    }
    return (error as Error).message.split("\n")[0];
  }

  console.log("=== 1. Transfert réussi ===");
  let tx = await token.transfer(OTHER_ACCOUNT, 10n * 10n ** 18n);
  await tx.wait();
  console.log("OK — tx:", tx.hash);

  console.log("\n=== 2. Mint réussi par l'owner ===");
  tx = await token.mint(owner.address, 10n * 10n ** 18n);
  await tx.wait();
  console.log("OK — tx:", tx.hash);

  console.log("\n=== 3. Mint refusé (non-owner) ===");
  try {
    await token.connect(nonOwner).mint(OTHER_ACCOUNT, 1n);
    console.log("PROBLÈME : ça aurait dû échouer !");
  } catch (error) {
    console.log("Refusé comme attendu :", explainError(error));
  }

  console.log("\n=== 4. Mint refusé (cap dépassé) ===");
  const cap = await token.cap();
  const currentSupply = await token.totalSupply();
  const overCapAmount = cap - currentSupply + 1n;
  try {
    await token.mint(owner.address, overCapAmount);
    console.log("PROBLÈME : ça aurait dû échouer !");
  } catch (error) {
    console.log("Refusé comme attendu :", explainError(error));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
