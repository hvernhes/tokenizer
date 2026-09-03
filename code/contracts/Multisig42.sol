// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

/// @title Multisig42 — multisig M-sur-N générique
/// @notice Toute action passe par : proposer, confirmer (jusqu'au seuil), exécuter.
///         Générique par conception (adresse cible + valeur + données arbitraires) :
///         ne connaît rien de Token42BEBonus à l'avance, peut appeler n'importe quel
///         contrat une fois qu'il en devient owner (mint/burn/transferOwnership...).
contract Multisig42 {
    event SubmitTransaction(uint256 indexed txId, address indexed proposer, address to, uint256 value, bytes data);
    event ConfirmTransaction(uint256 indexed txId, address indexed owner);
    event RevokeConfirmation(uint256 indexed txId, address indexed owner);
    event ExecuteTransaction(uint256 indexed txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public hasConfirmed;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not an owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "owners required");
        require(_required > 0 && _required <= _owners.length, "invalid required");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    function submitTransaction(address to, uint256 value, bytes calldata data) external onlyOwner returns (uint256 txId) {
        txId = transactions.length;
        transactions.push(Transaction({to: to, value: value, data: data, executed: false, confirmations: 0}));
        emit SubmitTransaction(txId, msg.sender, to, value, data);
    }

    function confirmTransaction(uint256 txId) external onlyOwner {
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "already executed");
        require(!hasConfirmed[txId][msg.sender], "already confirmed");

        hasConfirmed[txId][msg.sender] = true;
        transaction.confirmations += 1;
        emit ConfirmTransaction(txId, msg.sender);
    }

    function revokeConfirmation(uint256 txId) external onlyOwner {
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "already executed");
        require(hasConfirmed[txId][msg.sender], "not confirmed");

        hasConfirmed[txId][msg.sender] = false;
        transaction.confirmations -= 1;
        emit RevokeConfirmation(txId, msg.sender);
    }

    function executeTransaction(uint256 txId) external onlyOwner {
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "already executed");
        require(transaction.confirmations >= required, "not enough confirmations");

        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "call failed");

        emit ExecuteTransaction(txId);
    }

    function ownersCount() external view returns (uint256) {
        return owners.length;
    }
}
