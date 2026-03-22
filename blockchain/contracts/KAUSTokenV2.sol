// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract KAUSTokenV2 is ERC20, Ownable, Pausable {
    IERC20 public immutable usdc;
    address public feeRecipient;
    uint256 public constant FEE_BPS = 10; // 0.1%
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    uint256 public totalFeesCollected;

    event Purchase(address indexed buyer, uint256 usdcAmount, uint256 kausAmount, uint256 fee);
    event FeeRecipientUpdated(address indexed newRecipient);

    constructor(address _usdc, address _feeRecipient)
        ERC20("KAUS Token", "KAUS")
        Ownable(msg.sender)
    {
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
        _mint(msg.sender, 10_000_000 * 1e18); // 10M initial mint
    }

    function buyWithUSDC(uint256 usdcAmount) external whenNotPaused {
        require(usdcAmount > 0, "Amount must be > 0");
        uint256 fee = (usdcAmount * FEE_BPS) / 10000;
        uint256 net = usdcAmount - fee;
        require(totalSupply() + net * 1e12 <= MAX_SUPPLY, "Exceeds max supply");

        usdc.transferFrom(msg.sender, address(this), usdcAmount);
        if (fee > 0 && feeRecipient != address(0)) {
            usdc.transfer(feeRecipient, fee);
        }
        uint256 kausAmount = net * 1e12; // USDC 6dec -> KAUS 18dec
        totalFeesCollected += fee;
        _mint(msg.sender, kausAmount);
        emit Purchase(msg.sender, usdcAmount, kausAmount, fee);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function setFeeRecipient(address _fr) external onlyOwner {
        feeRecipient = _fr;
        emit FeeRecipientUpdated(_fr);
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
