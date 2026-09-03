// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title 42 Blue Essence (42BE)
/// @notice Token ERC20/BEP-20 représentant la Blue Essence de League of Legends, rendue
///         transférable. Supply plafonnée ; mint et burn réservés à l'owner.
contract Token42BE is ERC20Capped, Ownable {
    /// @dev Fixe nom, symbole, cap et owner initial, puis mint la supply de départ.
    constructor()
        ERC20("42 Blue Essence", "42BE")
        ERC20Capped(4_200_000 * 10 ** 18)
        Ownable(msg.sender)
    {
        _mint(msg.sender, 250_000 * 10 ** 18);
    }

    /// @notice Crée `amount` tokens et les attribue à `to`.
    /// @dev Réservé à l'owner. Le respect du cap est vérifié automatiquement par
    ///      ERC20Capped._update, pas ici.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Détruit `amount` tokens depuis le solde de l'appelant.
    /// @dev Réservé à l'owner, et ne brûle jamais que ses propres tokens (pas de
    ///      paramètre `from` arbitraire).
    function burn(uint256 amount) external onlyOwner {
        _burn(_msgSender(), amount);
    }
}
