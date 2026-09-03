import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OWNERS = [
  "0x93Bf190F82D00cbC103f32FaCc32f15a63D233f9",
  "0xDadCB6847386E840A789d1d47bC8165394B81101",
  "0x87c1aD6A513757a65c119d5c74182c66Bf140273",
];
const REQUIRED = 2;

export default buildModule("Multisig42Module", (m) => {
  const token = m.contract("Token42BEBonus");
  const multisig = m.contract("Multisig42", [OWNERS, REQUIRED], { after: [token] });

  m.call(token, "transferOwnership", [multisig]);

  return { multisig, token };
});
