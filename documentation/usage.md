# Utilisation — 42 Blue Essence (42BE)

## Le token en bref

`42 Blue Essence` (`42BE`) est un token ERC20/BEP-20 (18 décimales), avec une supply
initiale de 250 000 et un plafond (`cap`) immuable de 4 200 000. Choix et justifications
complètes : voir `README.md` à la racine du dépôt.

**Qui peut faire quoi :**

| Fonction | Qui peut l'appeler | Effet |
|---|---|---|
| `transfer`, `approve`, `transferFrom` | Tout le monde, sur ses propres tokens | Aucun changement de supply |
| `mint(to, amount)` | Uniquement l'owner, plafonné par `cap` | Augmente la supply |
| `burn(amount)` | Uniquement l'owner, sur son propre solde uniquement | Diminue la supply |

Le contrat source, commenté, est dans [`code/contracts/Token42BE.sol`](../code/contracts/Token42BE.sol).

## Où est déployé le token

Voir le contrat en direct sur Etherscan :
https://sepolia.etherscan.io/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1

Adresse, réseau, hash de déploiement et instructions pour redéployer ta propre copie :
voir [`deployment/DEPLOYMENT.md`](../deployment/DEPLOYMENT.md).

## Prérequis pour interagir avec le contrat

- Un wallet Ethereum (MetaMask ou équivalent) avec un peu de Sepolia ETH pour payer le gas.
  (La création d'un wallet n'est pas couverte ici — voir la documentation de MetaMask.)
- Un navigateur, rien d'autre à installer.

## Lire l'état du contrat (gratuit, aucune transaction)

Sur https://sepolia.etherscan.io/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1#code,
onglet **"Contract" → "Read Contract"**. Fonctions utiles :

- `name`, `symbol` — identité du token
- `totalSupply` — supply en circulation actuellement
- `cap` — plafond immuable
- `balanceOf(adresse)` — solde d'un compte donné

Toutes ces valeurs sont en **unités atomiques** (×10^18) — un solde affiché `250000000000000000000000`
correspond à 250 000 tokens.

## Interagir avec le contrat (transfert, mint, burn)

**Etherscan seul ne suffit pas toujours** : son interface "Write Contract" peut échouer avec
une erreur `maxFeePerGas`/`maxPriorityFeePerGas` invalide sur les wallets récents utilisant
la délégation EIP-7702 ("smart accounts" MetaMask) — un souci de compatibilité côté
Etherscan, pas du contrat. Si ça arrive, **Remix** contourne le problème.

### Via Remix (recommandé, fiable)

1. Va sur [remix.ethereum.org](https://remix.ethereum.org)
2. Crée un fichier, colle le contenu de
   [`code/contracts/Token42BE.sol`](../code/contracts/Token42BE.sol) (Remix résout
   automatiquement les imports OpenZeppelin)
3. Onglet **"Solidity Compiler"** → sélectionne la version `0.8.34` → **"Compile"**
4. Onglet **"Deploy & Run Transactions"** → champ **"Environment"** → **"Browser Extension"**
   (connecte ton wallet, réseau **Sepolia**)
5. Au lieu de déployer, utilise le champ **"Add contract"** (anciennement "At Address") :
   colle `0x9829a5e82924C916c8fdc3d7c317f61B36a441F1` et valide
6. Le contrat apparaît sous **"Deployed Contracts"**, avec un bouton par fonction — bleu pour
   les lectures gratuites, orange/rouge pour celles qui envoient une transaction
   (`transfer`, `mint`, `burn`)

### Via Etherscan (si ça fonctionne pour toi)

Sur https://sepolia.etherscan.io/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1#code,
onglet **"Contract" → "Write Contract"** → **"Connect to Web3"** → mêmes fonctions, mêmes
paramètres, interface similaire à Remix.

### Via un script Hardhat (sans wallet navigateur)

[`code/scripts/demo.ts`](../code/scripts/demo.ts) exécute les 4 actions minimales
directement en ligne de commande, signées avec la clé privée de `.env` — aucun MetaMask
requis. Pratique si un wallet navigateur n'est pas disponible sur la machine utilisée.

```bash
npx hardhat run scripts/demo.ts --network sepolia
```

Les adresses en tête du fichier (`TOKEN_ADDRESS`, `OTHER_ACCOUNT`) sont à adapter si le
contrat est redéployé à une nouvelle adresse.

### Un point important sur les montants

Toutes les fonctions attendent des valeurs en **unités atomiques** (×10^18), jamais le
nombre de tokens brut. Pour transférer 100 `42BE`, il faut entrer `100000000000000000000`,
pas `100`.

## Démonstration — les actions minimalistes exigées par le sujet

Réalisées sur le déploiement de référence documenté dans `DEPLOYMENT.md`, via Remix :

| Action | Résultat | Preuve |
|---|---|---|
| Transfert (owner → un autre compte) | ✅ Réussi | https://sepolia.etherscan.io/tx/0xc9fd6f8c7a1351d02c8a160d22b526773161b63907e7ba9aff2e5107e4fb414a |
| `mint` par l'owner | ✅ Réussi | https://sepolia.etherscan.io/tx/0xea2bf4d98a8b505392c1127398079eaec3ab94529ac2365db7d5166f6abc4967 |
| `mint` depuis un non-owner | ❌ Refusé (`OwnableUnauthorizedAccount`) | Simulation confirmée par Remix avant envoi ; transaction volontairement non forcée on-chain |
| `mint` dépassant le `cap` | ❌ Refusé (`ERC20ExceededCap`) | https://sepolia.etherscan.io/tx/0xc1cbb97770de9ef7d9311324989b67eac0e3f0db819d82602947cd7f3efd8879 |

Ces mêmes scénarios sont aussi couverts par les tests automatisés du projet
([`code/test/Token42BE.ts`](../code/test/Token42BE.ts)), exécutables via `npx hardhat test`
depuis `code/`.

## Bonus : gouverner via le multisig

`Multisig42` gouverne `Token42BEBonus` — toute action `mint`/`burn` doit être proposée,
confirmée par au moins 2 des 3 propriétaires, puis exécutée.

### Interagir avec le multisig (via Remix)

Même méthode que pour le token (voir plus haut), mais en chargeant
[`code/contracts/Multisig42.sol`](../code/contracts/Multisig42.sol) et en pointant
"Add contract" vers `0x53364b8aA24d85544a8dFB46cDEC6e7aeAf4D7F3`.

Fonctions principales :

- `submitTransaction(to, value, data)` — propose un appel. `to` = adresse du contrat
  cible, `value` = ETH à envoyer (0 pour un appel simple à une fonction non-payable),
  `data` = l'appel encodé (voir ci-dessous). Retourne un `txId`.
- `confirmTransaction(txId)` — un propriétaire confirme une proposition existante.
- `executeTransaction(txId)` — exécute la proposition une fois le seuil de confirmations
  atteint (2 sur 3 ici).
- `transactions(txId)` / `hasConfirmed(txId, adresse)` — lecture gratuite de l'état
  d'une proposition.

### Encoder un appel `mint`

`data` doit être l'appel `mint(address,uint256)` encodé : le sélecteur de fonction
(`0x40c10f19`) suivi de l'adresse destinataire et du montant, chacun complété à 32 octets.
Le plus simple : utiliser `ethers.js` (`interface.encodeFunctionData("mint", [to, amount])`,
comme fait dans `code/test/Multisig42.ts`).

### Script de démonstration (sans wallet navigateur)

[`code/scripts/demo_bonus.ts`](../code/scripts/demo_bonus.ts) exécute toute la séquence
en ligne de commande : proposer, tenter d'exécuter avec une seule confirmation (refusé),
confirmer par le second propriétaire, exécuter avec succès.

```bash
npx hardhat run scripts/demo_bonus.ts --network sepolia
```

### Démonstration réalisée

Mint de 1000 `42BEB` vers `0x87c1aD6A513757a65c119d5c74182c66Bf140273`, proposé par un
propriétaire, confirmé par 2 des 3 (seuil atteint), puis exécuté :

| Étape | Preuve |
|---|---|
| Proposition (`submitTransaction`) | https://sepolia.etherscan.io/tx/0xc31324acf8e1d815d427ca7969da446ed780fccbca6f710c9ab7fdee1d426d95 |
| Confirmation (1er propriétaire) | https://sepolia.etherscan.io/tx/0xcbd24ebfb461696eff32e491762a08ea8e3a48da4963c54e67c2a29f517a0a94 |
| Confirmation (2ᵉ propriétaire) | https://sepolia.etherscan.io/tx/0x8a08752a0af4bc6347c76f9edc7b9fcda9ac3c1f9a9e0ae0bec89689e67fbd7c |
| Exécution | https://sepolia.etherscan.io/tx/0x34061a812ad7e59fcf14f80c654926f4d35abd76296a83f7ead06b516626effd |

État final du contrat, vérifiable directement en lecture sur Etherscan
(`transactions(0)` et `hasConfirmed(0, adresse)`) : `confirmations: 2`, `executed: true`,
les deux propriétaires ayant confirmé à `true`.

Ces mêmes scénarios (dépôt, confirmation, exécution, gouvernance réelle d'un token) sont
aussi couverts par les tests automatisés
([`code/test/Multisig42.ts`](../code/test/Multisig42.ts)).
