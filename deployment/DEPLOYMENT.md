# Déploiement — 42 Blue Essence (42BE)

## Résumé — les 3 contrats déployés (Sepolia)

| Contrat | Adresse | Etherscan | Comment interagir |
|---|---|---|---|
| `Token42BE` (mandatory) | `0x9829a5e82924C916c8fdc3d7c317f61B36a441F1` | https://sepolia.etherscan.io/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1#code | [`documentation/usage.md`](../documentation/usage.md) |
| `Token42BEBonus` | `0xB0405EC85eBEC9C53BcFa8E29eCcE12c10B1Df8a` | https://sepolia.etherscan.io/address/0xB0405EC85eBEC9C53BcFa8E29eCcE12c10B1Df8a#code | [`documentation/usage.md`](../documentation/usage.md) |
| `Multisig42` | `0x53364b8aA24d85544a8dFB46cDEC6e7aeAf4D7F3` | https://sepolia.etherscan.io/address/0x53364b8aA24d85544a8dFB46cDEC6e7aeAf4D7F3#code | [`documentation/usage.md`](../documentation/usage.md) (section Bonus) |

## Résultat

| | |
|---|---|
| Réseau | Sepolia (testnet Ethereum), chainId `11155111` |
| Adresse du contrat | `0x9829a5e82924C916c8fdc3d7c317f61B36a441F1` |
| Ticker | `42BE` |
| Hash de la transaction de déploiement | `0x2251e8bec83cba1c352e15d75bb83cf6b1f14eb3642c8fa8fdceccfa99d995e4` |

- Voir le contrat sur Etherscan : https://sepolia.etherscan.io/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1
- Code source vérifié sur Etherscan : https://sepolia.etherscan.io/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1#code
- Code source vérifié sur Sourcify : https://sourcify.dev/server/repo-ui/11155111/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1
- Code source vérifié sur Blockscout : https://eth-sepolia.blockscout.com/address/0x9829a5e82924C916c8fdc3d7c317f61B36a441F1#code

## Comment reproduire ce déploiement

Le code de déploiement se trouve dans `code/ignition/modules/Token42BE.ts` (Hardhat
Ignition — vit dans `code/` car c'est un emplacement imposé par l'outillage Hardhat, pas un
choix de structure).

1. Dans `code/`, créer un `.env` (à partir de `.env.example`) avec `SEPOLIA_RPC_URL` et
   `SEPOLIA_PRIVATE_KEY` (clé privée d'un wallet chargé en Sepolia ETH de test)
2. `npx hardhat ignition deploy ignition/modules/Token42BE.ts --network sepolia`
3. `npx hardhat verify --network sepolia --build-profile default <ADRESSE>` (le
   `--build-profile default` est nécessaire : `verify` cible `production` par défaut, qui
   ne correspond pas au profil utilisé pour ce déploiement — voir `hardhat.config.ts`)

Chaque exécution crée un **nouveau** contrat, à une nouvelle adresse (le code déployé est
immuable — redéployer n'écrase jamais le précédent, voir le contrat `Ownable`/`ERC20Capped`
hérité d'OpenZeppelin pour le détail du fonctionnement).

## Bonus : multisig

### Résultat

| | |
|---|---|
| Réseau | Sepolia, chainId `11155111` (même réseau que le mandatory) |
| `Token42BEBonus` (42BEB) | `0xB0405EC85eBEC9C53BcFa8E29eCcE12c10B1Df8a` |
| `Multisig42` | `0x53364b8aA24d85544a8dFB46cDEC6e7aeAf4D7F3` |
| Propriétaires (3) | `0x93Bf190F82D00cbC103f32FaCc32f15a63D233f9`, `0xDadCB6847386E840A789d1d47bC8165394B81101`, `0x87c1aD6A513757a65c119d5c74182c66Bf140273` |
| Seuil requis | 2 sur 3 |

Liens :
- `Token42BEBonus` sur Etherscan : https://sepolia.etherscan.io/address/0xB0405EC85eBEC9C53BcFa8E29eCcE12c10B1Df8a#code
- `Multisig42` sur Etherscan : https://sepolia.etherscan.io/address/0x53364b8aA24d85544a8dFB46cDEC6e7aeAf4D7F3#code
- Vérifiés également sur Sourcify et Blockscout (mêmes adresses)

### Séquence de déploiement (hash de transaction)

1. Déploiement `Token42BEBonus` : `0xc77a261eea4dff3d5d5dc3e9c4a554efaf6ea169e0605b4f41194da697e26d1d`
2. Déploiement `Multisig42` : `0xe9cd8fccd75a336df4863d0b28bd4d38992a9d35b6a4516f133a44b0bd7a33c1`
3. `transferOwnership` (Token42BEBonus → Multisig42) : `0xce4773c317c4fcb3482c62241c268cdec4026996629dd73e9541c1a2bb7624e4`

Les trois étapes ont été faites en une seule commande (`code/ignition/modules/Multisig42.ts`).

### Comment reproduire

1. Dans `code/`, avec un `.env` déjà configuré (voir plus haut) :
   ```
   npx hardhat ignition deploy ignition/modules/Multisig42.ts --network sepolia
   ```
2. Les adresses des 3 propriétaires et le seuil sont fixés dans le module lui-même
   (`OWNERS` et `REQUIRED`, en tête du fichier) — à modifier avant de relancer si besoin
   d'un jeu d'adresses différent.
3. Vérification (une commande par contrat) :
   ```
   npx hardhat verify --network sepolia --build-profile default --contract contracts/Token42BE_bonus.sol:Token42BEBonus <ADRESSE_TOKEN42BEBONUS>
   npx hardhat verify --network sepolia --build-profile default --constructor-args-path scripts/multisig42-constructor-args.ts <ADRESSE_MULTISIG42>
   ```
   `--contract` est nécessaire pour `Token42BEBonus` (bytecode quasi identique à
   `Token42BE`, Etherscan ne peut pas deviner lequel des deux sans précision).
   `--constructor-args-path` pointe vers un fichier qui exporte les arguments du
   constructeur de `Multisig42` (un tableau `address[]` ne passe pas comme argument
   positionnel classique en ligne de commande) — à adapter si les adresses des
   propriétaires changent.

**Important** : à partir de la transaction de `transferOwnership`, seul `Multisig42`
peut appeler `mint`/`burn` sur `Token42BEBonus` — un appel direct depuis un wallet
personnel, même celui d'un des 3 propriétaires, échoue désormais avec
`OwnableUnauthorizedAccount`. Ce n'est pas une régression, c'est le comportement voulu
du bonus.
