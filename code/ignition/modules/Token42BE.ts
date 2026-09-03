import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Token42BEModule", (m) => {
  const token = m.contract("Token42BE");

  return { token };
});
