# Commandes — séquence pour la soutenance

Toutes les commandes à taper, dans l'ordre, dans `code/`. Explications détaillées :
voir `README.md`, `deployment/DEPLOYMENT.md` et `documentation/usage.md`.

## 0. Avant de commencer

`code/.env` doit exister avec `SEPOLIA_RPC_URL`, `SEPOLIA_PRIVATE_KEY`,
`SEPOLIA_PRIVATE_KEY_2`, `ETHERSCAN_API_KEY` (voir `.env.example`).

## 1. Cloner et installer

```bash
git clone git@github.com:hvernhes/tokenizer.git
cd tokenizer/code
npm install
```

## 2. Compiler et tester

```bash
npx hardhat compile
npx hardhat test
```

Attendu : `17 passing`.

## 3. Déployer le mandatory (Token42BE)

```bash
npx hardhat ignition deploy ignition/modules/Token42BE.ts --network sepolia
```

Noter l'adresse affichée ("Deployed Addresses").

## 4. Vérifier le mandatory

```bash
npx hardhat verify --network sepolia --build-profile default <ADRESSE_TOKEN42BE>
```

## 5. Démo mandatory (transfert, mint réussi, mint refusé non-owner, mint refusé cap)

```bash
npx hardhat run scripts/demo.ts --network sepolia
```

(adapter `TOKEN_ADDRESS` en tête du fichier avec l'adresse de l'étape 3)

## 6. Déployer le bonus (Token42BEBonus + Multisig42 + transferOwnership)

```bash
npx hardhat ignition deploy ignition/modules/Multisig42.ts --network sepolia
```

## 7. Vérifier le bonus

```bash
npx hardhat verify --network sepolia --build-profile default --contract contracts/Token42BE_bonus.sol:Token42BEBonus <ADRESSE_TOKEN42BEBONUS>
npx hardhat verify --network sepolia --build-profile default --constructor-args-path scripts/multisig42-constructor-args.ts <ADRESSE_MULTISIG42>
```

## 8. Démo bonus (proposer, exécution prématurée refusée, confirmer, exécuter)

```bash
npx hardhat run scripts/demo_bonus.ts --network sepolia
```

(adapter `BONUS_TOKEN_ADDRESS`/`MULTISIG_ADDRESS` en tête du fichier avec les adresses de
l'étape 6)
