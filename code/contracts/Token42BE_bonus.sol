// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title 42 Blue Essence Bonus (42BEB)
/// @notice Copie volontaire de Token42BE.sol, déployée spécifiquement pour le bonus
///         multisig — afin de démontrer la gouvernance M-sur-N sans jamais toucher à
///         l'ownership du token du mandatory (déjà démontré et documenté séparément,
///         voir DEPLOYMENT.md). Mêmes règles de gouvernance : mint/burn réservés à
///         l'owner (ici, le multisig Multisig42 une fois l'ownership transférée),
///         supply plafonnée identique.
contract Token42BEBonus is ERC20Capped, Ownable {
    constructor()
        ERC20("42 Blue Essence Bonus", "42BEB")
        ERC20Capped(4_200_000 * 10 ** 18)
        Ownable(msg.sender)
    {
        _mint(msg.sender, 250_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external onlyOwner {
        _burn(_msgSender(), amount);
    }
}
