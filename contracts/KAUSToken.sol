// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title KAUSToken
 * @notice K-Arena utility token. 1 KAUS = 1 USDC (fixed peg).
 *         Users send USDC -> receive KAUS. Platform collects 0.1% fee per trade.
 */
contract KAUSToken is ERC20, Ownable {
    IERC20 public immutable usdc;
    address public feeRecipient;

    uint256 public constant MAX_SUPPLY   = 100_000_000 * 1e18;
    uint256 public constant INITIAL_MINT =  10_000_000 * 1e18;
    uint256 public constant FEE_BPS      = 10; // 0.1%

    uint256 public totalFeesCollected;

    event KausPurchased(address indexed buyer, uint256 kausAmount, uint256 usdcPaid, uint256 feePaid);
    event FeeCollected(address indexed from, uint256 amount);
    event FeeRecipientUpdated(address indexed newRecipient);

    constructor(address _usdc, address _feeRecipient) ERC20("K-Arena Utility Token", "KAUS") Ownable(msg.sender) {
        require(_usdc != address(0), "zero usdc");
        require(_feeRecipient != address(0), "zero feeRecipient");
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
        _mint(msg.sender, INITIAL_MINT);
    }

    /**
     * @notice Buy KAUS with USDC. Approve USDC first.
     *         1 USDC (6 dec) = 1 KAUS (18 dec), 0.1% fee deducted.
     */
    function buyWithUSDC(uint256 usdcAmount) external {
        require(usdcAmount > 0, "zero amount");
        uint256 kausGross = usdcAmount * 1e12;
        uint256 fee       = (kausGross * FEE_BPS) / 10_000;
        uint256 kausNet   = kausGross - fee;
        require(totalSupply() + kausGross <= MAX_SUPPLY, "max supply exceeded");
        usdc.transferFrom(msg.sender, address(this), usdcAmount);
        _mint(msg.sender,   kausNet);
        _mint(feeRecipient, fee);
        totalFeesCollected += fee;
        emit KausPurchased(msg.sender, kausNet, usdcAmount, fee);
    }

    function collectFee(uint256 amount) external onlyOwner {
        require(balanceOf(address(this)) >= amount, "insufficient balance");
        uint256 burn    = (amount * 50) / 100;
        uint256 toRecip = (amount * 30) / 100;
        _burn(address(this), burn);
        _transfer(address(this), feeRecipient, toRecip);
        totalFeesCollected += amount;
        emit FeeCollected(msg.sender, amount);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "zero address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function withdrawUsdc(address to, uint256 amount) external onlyOwner {
        usdc.transfer(to, amount);
    }

    function rescueToken(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(this), "cannot rescue KAUS");
        IERC20(token).transfer(to, amount);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "max supply exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
