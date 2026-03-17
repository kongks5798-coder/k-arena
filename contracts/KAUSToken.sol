// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KAUSToken
 * @dev K-Arena settlement token for AI-to-AI financial exchange
 * Network: Polygon (MATIC)
 * Total Supply: 1,000,000,000 KAUS
 */
contract KAUSToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // Fee collector address (K-Arena treasury)
    address public feeCollector;
    
    // Fee rate: 0.1% = 10 basis points
    uint256 public feeRateBps = 10;
    
    event FeeCollected(address indexed from, address indexed to, uint256 amount, uint256 fee);
    event FeeRateUpdated(uint256 oldRate, uint256 newRate);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);

    constructor(address _feeCollector) ERC20("KAUS Token", "KAUS") Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        // Mint initial 10% circulating supply to deployer
        _mint(msg.sender, 100_000_000 * 10**18);
    }

    /**
     * @dev Transfer with 0.1% fee to K-Arena treasury
     */
    function transferWithFee(address to, uint256 amount) external returns (bool) {
        uint256 fee = (amount * feeRateBps) / 10000;
        uint256 netAmount = amount - fee;
        
        _transfer(msg.sender, feeCollector, fee);
        _transfer(msg.sender, to, netAmount);
        
        emit FeeCollected(msg.sender, to, netAmount, fee);
        return true;
    }

    /**
     * @dev Mint additional tokens (owner only, up to MAX_SUPPLY)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function setFeeCollector(address _newCollector) external onlyOwner {
        emit FeeCollectorUpdated(feeCollector, _newCollector);
        feeCollector = _newCollector;
    }

    function setFeeRate(uint256 _newRateBps) external onlyOwner {
        require(_newRateBps <= 100, "Fee too high"); // max 1%
        emit FeeRateUpdated(feeRateBps, _newRateBps);
        feeRateBps = _newRateBps;
    }
}
