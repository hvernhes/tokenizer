# 42 Blue Essence (42BE)

Projet **Tokenizer** de l'École 42, en partenariat avec BNB Chain — création d'un token
ERC20 sur une blockchain publique (testnet), avec code, déploiement et documentation.

Ce document explique les choix techniques faits pour ce projet et leurs justifications.

## Le concept

`42 Blue Essence` s'inspire d'un constat concret : plusieurs centaines de milliers de Blue
Essence accumulées dans *League of Legends*, tous les champions déjà débloqués depuis
longtemps — une monnaie de jeu qui continue de s'accumuler sans plus rien pouvoir en faire.

Cette monnaie n'est pas inutile parce qu'elle "ne vaut rien" en soi, mais pour deux raisons
structurelles précises : elle est **non transférable** (bloquée sur un compte, impossible à
donner ou échanger), et ses usages sont **décidés unilatéralement par l'éditeur**, qui se
raréfient une fois la collection complète.

Tokeniser cette Blue Essence ne change rien à sa "valeur", mais lui rend exactement ce qui
lui manquait : la **circulation**. Un token ne vaut pas par son contrat, mais par son usage
et sa circulation — le contrat ne fait que tenir la comptabilité.

*Projet pédagogique, testnet uniquement, sans valeur monétaire, sans affiliation à Riot Games.*

## Choix techniques

### Blockchain : Sepolia (testnet Ethereum)

Le sujet autorise explicitement les deux options citées en exemple (page 5) :
*« ERC20 for ETH or BEP-20 for BSC »*. Le développement a démarré sur **BSC Testnet**,
conformément à l'orientation du sujet (partenariat 42 × BNB Chain). Après plusieurs sessions
et cinq faucets BSC différents testés sans succès (faucet officiel systématiquement vide —
un problème documenté depuis plusieurs années sur le dépôt `bnb-chain/bsc`, pas un simple
creux temporaire), le projet a basculé sur **Sepolia**, où un faucet a fonctionné du premier
coup.

Ce choix n'a coûté aucune ligne de code : le contrat et les tests sont identiques sur les
deux réseaux, grâce à la compatibilité EVM (Ethereum, BSC, et l'essentiel de l'écosystème
partagent la même machine virtuelle et le même langage). Seule la configuration réseau a
changé.

### Langage : Solidity (version 0.8.34)

Solidity est le langage de l'EVM, donc de toute chaîne compatible EVM. Version fixée
≥ 0.8.20 : depuis cette version, les dépassements d'entiers (overflow/underflow) provoquent
un revert automatique — un choix de sécurité, pas une préférence, une faille de ce type ayant
historiquement causé des pertes réelles sur des tokens mal écrits.

### Framework : Hardhat 3

Cité explicitement par le sujet, aux côtés de Truffle et Remix. Choisi pour : une blockchain
locale instantanée pour tester avant tout déploiement réel, de vrais tests automatisés
versionnés (essentiel puisque le code déployé est immuable), des scripts de déploiement
versionnés (Hardhat Ignition), et un plugin de vérification automatique sur les explorateurs
de blocs.

### Bibliothèque : OpenZeppelin Contracts

Le contrat hérite des implémentations `ERC20`, `ERC20Capped` et `Ownable` d'OpenZeppelin
plutôt que de réécrire le standard à la main. Le code déployé étant immuable, un bug y est
permanent — OpenZeppelin est l'implémentation de référence du secteur : auditée, maintenue,
utilisée en production par des milliers de projets.

**Module volontairement écarté** : `ERC20Burnable`, qui ouvrirait le `burn` à tous les
détenteurs — contraire au choix de gouvernance retenu ci-dessous.

## Paramètres du token

| Paramètre | Valeur | Justification |
|---|---|---|
| Nom | `42 Blue Essence` | Contrainte « 42 » du sujet + référence au concept |
| Symbole | `42BE` | Contrainte « 42 » respectée dans le ticker également |
| Décimales | `18` | Convention standard (Ethereum/BSC), attendue par la quasi-totalité des wallets et explorateurs |
| Supply initiale | `250 000` | Correspond à la réserve de Blue Essence accumulée en jeu |
| Cap | `4 200 000` | Plafond absolu et immuable, contenant la référence « 42 » |

## Gouvernance

| Fonction | Qui peut l'appeler | Effet sur la supply |
|---|---|---|
| `transfer`, `approve`, `transferFrom` | Tout le monde, sur ses propres tokens | Aucun |
| `mint(to, amount)` | Owner uniquement, plafonné par le `cap` | Augmente |
| `burn(amount)` | Owner uniquement, sur son propre solde uniquement | Diminue |

**Principe directeur** : seul l'owner touche à la masse monétaire ; les détenteurs ne
peuvent que faire circuler ce qu'ils possèdent.

**Pourquoi un cap plutôt qu'une supply libre** : une supply mintable sans limite donnerait à
l'owner un pouvoir de dilution illimité. Un cap inscrit dans le code est une garantie
vérifiable par tous et immuable — personne, pas même l'owner, ne peut le dépasser.

**Pourquoi un cap plutôt qu'une supply totalement fixe** : une supply fixe sans aucune
fonction privilégiée n'offrirait rien à sécuriser, alors que le sujet demande explicitement
de traiter l'ownership et les privilèges.

**Pourquoi `burn` restreint à l'owner et à son propre solde** : un burn ouvert à tous n'aurait
aucun usage réel dans ce projet. Il porte uniquement sur les tokens de l'appelant
(`_burn(msg.sender, amount)`, sans paramètre `from` arbitraire) — un burn pouvant détruire
les tokens d'un tiers serait un pouvoir de confiscation, bien plus dangereux qu'un mint.

**Surface d'attaque** : le pire pouvoir de l'owner est l'émission jusqu'au cap (dilution).
Il ne peut toucher au solde d'aucun tiers. Aucune fonction de pause, de blacklist ou de
confiscation n'existe. Point de centralisation restant : une clé privée unique détient ces
pouvoirs — c'est ce que résout le bonus multisig (voir plus bas).

## Sécurité

- La clé privée du wallet de déploiement vit dans `code/.env`, jamais commité (voir
  `code/.gitignore` et `code/.env.example`)
- Testnet uniquement — aucun argent réel n'est impliqué à aucune étape

## Bonus (multisig)

Une structure multisig gouverne un second token dédié au bonus, `Token42BEBonus`
(`42BEB`) — une copie volontaire de `Token42BE.sol`, déployée séparément pour ne jamais
toucher à l'ownership du token du mandatory (déjà démontré et documenté indépendamment,
voir `deployment/DEPLOYMENT.md`). Même code, mêmes règles de gouvernance.

**`Multisig42`** : multisig générique M-sur-N (3 propriétaires, seuil de 2 signatures),
écrit sans dépendance à un token spécifique — il exécute n'importe quel appel
(`propose → confirme → exécute`) sur n'importe quel contrat. Devenu owner de
`Token42BEBonus` via `transferOwnership`, ses seuls pouvoirs sur le token sont donc
exactement les mêmes que ceux de l'owner initial : `mint`/`burn` plafonnés par le `cap`.

Détail complet (adresses, transactions, comment reproduire, comment interagir) :
[`deployment/DEPLOYMENT.md`](deployment/DEPLOYMENT.md) et
[`documentation/usage.md`](documentation/usage.md).

## Structure du dépôt

- [`code/`](code/) — contrat Solidity, tests automatisés, configuration Hardhat
- [`deployment/`](deployment/) — adresse déployée, réseau, comment redéployer
- [`documentation/`](documentation/) — guide d'utilisation, ABI
