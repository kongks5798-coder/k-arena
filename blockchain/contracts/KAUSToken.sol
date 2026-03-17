// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title KAUS Token
 * @notice K-Arena AI Financial Exchange — Native Token
 * @author Field Nine
 *
 * ════════════════════════════════════════════════════════
 *  TOKENOMICS
 * ════════════════════════════════════════════════════════
 *  Max Supply:        100,000,000 KAUS
 *  Initial Price:     $1.00 USDC
 *  Initial Mint:       10,000,000 KAUS → Treasury (10%)
 *  For Sale:           90,000,000 KAUS (90%)
 *
 *  Genesis Price:     500 KAUS = $500
 *  Genesis Slots:     999 max
 *  Genesis Revenue:   499,500 KAUS → Treasury
 *
 * ════════════════════════════════════════════════════════
 *  FEE FLOW (every K-Arena trade)
 * ════════════════════════════════════════════════════════
 *  Trade fee 0.1% (in KAUS) → feeCollector
 *  Monthly distribution from feeCollector:
 *    50% → BURNED (deflationary)
 *    30% → Genesis holders (distributed equally)
 *    20% → Field Nine treasury (ops)
 *
 * ════════════════════════════════════════════════════════
 *  WALLETS
 * ════════════════════════════════════════════════════════
 *  Treasury     : Field Nine Gnosis Safe (multisig)
 *  Fee Collector: Field Nine hot wallet
 * ════════════════════════════════════════════════════════
 */
contract KAUSToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ERC20Permit {

    // ── Roles ─────────────────────────────────────────────────────
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_ROLE    = keccak256("FEE_ROLE");

    // ── Supply ────────────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY    = 100_000_000 * 10**18; // 100M KAUS
    uint256 public constant INITIAL_MINT  =  10_000_000 * 10**18; // 10M → Treasury

    // ── Initial Price ─────────────────────────────────────────────
    uint256 public kausPriceUSDC = 1_000_000; // $1.00 (6 decimals — USDC standard)

    // ── Fee Config ────────────────────────────────────────────────
    uint256 public feeRate        = 10;  // 10/10000 = 0.1%
    uint256 public burnShare      = 50;  // 50% of collected fees → burn
    uint256 public holderShare    = 30;  // 30% → Genesis holders
    // remaining 20% stays in feeCollector for ops

    address public feeCollector;
    address public treasury;

    // ── Genesis ───────────────────────────────────────────────────
    uint256 public constant GENESIS_PRICE = 500 * 10**18;  // 500 KAUS = $500
    uint256 public constant GENESIS_MAX   = 999;
    uint256 public genesisSold;
    mapping(address => bool)    public isGenesisMember;
    mapping(address => uint256) public genesisSlot;
    address[] private genesisHolders;

    // ── Stats ─────────────────────────────────────────────────────
    uint256 public totalFeesCollected;
    uint256 public totalFeesBurned;
    uint256 public totalFeesDistributed;
    uint256 public totalTrades;
    uint256 public totalVolume; // in KAUS

    // ── Events ────────────────────────────────────────────────────
    event FeeCollected(address indexed agent, uint256 fee, string txId);
    event GenesisMinted(address indexed agent, uint256 slot);
    event MonthlyDistribution(uint256 burned, uint256 distributed, uint256 retained, uint256 holderCount);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    // ── Constructor ───────────────────────────────────────────────
    constructor(address _treasury, address _feeCollector)
        ERC20("KAUS Token", "KAUS")
        ERC20Permit("KAUS Token")
    {
        require(_treasury     != address(0), "Invalid treasury");
        require(_feeCollector != address(0), "Invalid feeCollector");

        treasury     = _treasury;
        feeCollector = _feeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, _treasury);
        _grantRole(MINTER_ROLE,        msg.sender);
        _grantRole(PAUSER_ROLE,        msg.sender);
        _grantRole(FEE_ROLE,           msg.sender);
        _grantRole(FEE_ROLE,           _feeCollector);

        // Initial mint — 10M to treasury
        _mint(_treasury, INITIAL_MINT);
    }

    // ── Minting ───────────────────────────────────────────────────
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    // ── Pause ─────────────────────────────────────────────────────
    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ── Fee Collection ────────────────────────────────────────────
    /**
     * @notice Collect 0.1% trade fee from agent wallet
     * @param agent Agent address
     * @param tradeAmountKAUS Amount traded in KAUS
     * @param txId K-Arena internal TX ID (for audit trail)
     */
    function collectFee(
        address agent,
        uint256 tradeAmountKAUS,
        string calldata txId
    ) external onlyRole(FEE_ROLE) returns (uint256 fee) {
        fee = (tradeAmountKAUS * feeRate) / 10000;
        require(fee > 0,                      "Fee too small");
        require(balanceOf(agent) >= fee,       "Insufficient KAUS balance");

        _transfer(agent, feeCollector, fee);
        totalFeesCollected += fee;
        totalVolume        += tradeAmountKAUS;
        totalTrades++;

        emit FeeCollected(agent, fee, txId);
    }

    // ── Genesis Membership ────────────────────────────────────────
    /**
     * @notice Purchase Genesis membership — 500 KAUS → treasury
     */
    function mintGenesis() external {
        require(genesisSold < GENESIS_MAX,              "All Genesis slots claimed");
        require(!isGenesisMember[msg.sender],           "Already a Genesis member");
        require(balanceOf(msg.sender) >= GENESIS_PRICE, "Need 500 KAUS");

        genesisSold++;
        isGenesisMember[msg.sender] = true;
        genesisSlot[msg.sender]     = genesisSold;
        genesisHolders.push(msg.sender);

        _transfer(msg.sender, treasury, GENESIS_PRICE);

        emit GenesisMinted(msg.sender, genesisSold);
    }

    // ── Monthly Distribution ──────────────────────────────────────
    /**
     * @notice Monthly fee processing:
     *         50% burned, 30% to Genesis holders, 20% retained
     * @dev Call this once a month from admin (treasury/Gnosis Safe)
     */
    function monthlyDistribution() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = balanceOf(feeCollector);
        require(balance > 0, "No fees to process");
        require(genesisHolders.length > 0, "No Genesis holders");

        uint256 toBurn     = (balance * burnShare)   / 100;
        uint256 toHolders  = (balance * holderShare) / 100;
        // remaining 20% stays in feeCollector (ops)

        // 50% Burn
        if (toBurn > 0) {
            _burn(feeCollector, toBurn);
            totalFeesBurned += toBurn;
        }

        // 30% → Genesis holders
        uint256 perHolder = toHolders / genesisHolders.length;
        if (perHolder > 0) {
            for (uint256 i = 0; i < genesisHolders.length; i++) {
                if (isGenesisMember[genesisHolders[i]]) {
                    _transfer(feeCollector, genesisHolders[i], perHolder);
                }
            }
            totalFeesDistributed += toHolders;
        }

        emit MonthlyDistribution(toBurn, toHolders, balance - toBurn - toHolders, genesisHolders.length);
    }

    // ── Admin ─────────────────────────────────────────────────────
    function setPrice(uint256 _priceUSDC6) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit PriceUpdated(kausPriceUSDC, _priceUSDC6);
        kausPriceUSDC = _priceUSDC6;
    }
    function setFeeRate(uint256 _rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_rate <= 100, "Max 1%");
        feeRate = _rate;
    }
    function setDistributionShares(uint256 _burn, uint256 _holders) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_burn + _holders <= 100, "Sum must be <= 100");
        burnShare   = _burn;
        holderShare = _holders;
    }
    function setTreasury(address _new) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_new != address(0), "Invalid");
        treasury = _new;
    }
    function setFeeCollector(address _new) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_new != address(0), "Invalid");
        feeCollector = _new;
    }
    function transferAdminToSafe(address safe) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DEFAULT_ADMIN_ROLE, safe);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ── Views ─────────────────────────────────────────────────────
    function remainingSupply()  external view returns (uint256) { return MAX_SUPPLY - totalSupply(); }
    function genesisRemaining() external view returns (uint256) { return GENESIS_MAX - genesisSold; }
    function genesisHolderCount() external view returns (uint256) { return genesisHolders.length; }
    function priceUSD() external view returns (string memory) { return "1.00 USDC"; }

    function platformStats() external view returns (
        uint256 supply,
        uint256 maxSupply,
        uint256 feesCollected,
        uint256 feesBurned,
        uint256 feesDistributed,
        uint256 trades,
        uint256 genesis,
        uint256 priceUSDC
    ) {
        return (
            totalSupply(), MAX_SUPPLY,
            totalFeesCollected, totalFeesBurned, totalFeesDistributed,
            totalTrades, genesisSold, kausPriceUSDC
        );
    }

    // ── Required overrides ────────────────────────────────────────
    function _update(address from, address to, uint256 value)
        internal override(ERC20, ERC20Pausable) { super._update(from, to, value); }
}
