import { network } from "hardhat";

const MULTISIG_ADDRESS = "0x53364b8aA24d85544a8dFB46cDEC6e7aeAf4D7F3";
const BONUS_TOKEN_ADDRESS = "0xB0405EC85eBEC9C53BcFa8E29eCcE12c10B1Df8a";
const RECIPIENT = "0x87c1aD6A513757a65c119d5c74182c66Bf140273";
const AMOUNT = 10n * 10n ** 18n;

async function main() {
  const { ethers } = await network.create();
  const [owner1] = await ethers.getSigners();
  const owner2 = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY_2 ?? "", ethers.provider);

  const multisig = await ethers.getContractAt("Multisig42", MULTISIG_ADDRESS, owner1);
  const bonusToken = await ethers.getContractAt("Token42BEBonus", BONUS_TOKEN_ADDRESS);

  function explainError(error: unknown): string {
    const data = (error as { data?: string }).data;
    if (data) {
      try {
        const decoded = multisig.interface.parseError(data);
        if (decoded) {
          return `${decoded.name}(${decoded.args.map(String).join(", ")})`;
        }
      } catch {
        // pas décodable
      }
    }
    return (error as Error).message.split("\n")[0];
  }

  const data = bonusToken.interface.encodeFunctionData("mint", [RECIPIENT, AMOUNT]);

  console.log("=== 1. Proposer le mint (submitTransaction) ===");
  const submitTx = await multisig.submitTransaction(BONUS_TOKEN_ADDRESS, 0, data);
  const receipt = await submitTx.wait();
  const parsed = receipt!.logs
    .map((log) => {
      try {
        return multisig.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((entry) => entry?.name === "SubmitTransaction");
  const txId = parsed!.args.txId as bigint;
  console.log("Proposé — txId:", txId.toString(), "— tx:", submitTx.hash);

  console.log("\n=== 2. Confirmer (propriétaire 1) ===");
  let tx = await multisig.confirmTransaction(txId);
  await tx.wait();
  console.log("Confirmé — tx:", tx.hash);

  console.log("\n=== 3. Exécuter avec une seule confirmation (doit échouer) ===");
  try {
    await multisig.executeTransaction(txId);
    console.log("PROBLÈME : ça aurait dû échouer !");
  } catch (error) {
    console.log("Refusé comme attendu :", explainError(error));
  }

  console.log("\n=== 4. Confirmer (propriétaire 2) ===");
  tx = await multisig.connect(owner2).confirmTransaction(txId);
  await tx.wait();
  console.log("Confirmé — tx:", tx.hash, "(seuil de 2 atteint)");

  console.log("\n=== 5. Exécuter (doit réussir) ===");
  tx = await multisig.executeTransaction(txId);
  await tx.wait();
  console.log("Exécuté — tx:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
