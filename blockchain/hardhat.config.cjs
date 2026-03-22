require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const pk = process.env.DEPLOYER_PRIVATE_KEY
  ? [`0x${process.env.DEPLOYER_PRIVATE_KEY.replace(/^0x/, "")}`]
  : [];

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: "https://polygon-bor-rpc.publicnode.com",
      accounts: pk,
      chainId: 137,
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: pk,
      chainId: 80002,
    },
  },
  etherscan: {
    apiKey: { polygon: process.env.POLYGONSCAN_API_KEY || "" }
  }
};
