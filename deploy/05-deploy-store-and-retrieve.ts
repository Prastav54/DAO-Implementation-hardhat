import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import verify from "../helper-functions";
import { networkConfig, developmentChains } from "../helper-hardhat-config";
import { ethers } from "hardhat";

const deployStoreAndRetrieve: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("Deploying StoreAndRetrieve and waiting for confirmations...");
  const storeAndRetrieve = await deploy("StoreAndRetrieve", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
  });
  log(`StoreAndRetrieve at ${storeAndRetrieve.address}`);
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(storeAndRetrieve.address, []);
  }
  const storeAndRetrieveContract = await ethers.getContractAt(
    "StoreAndRetrieve",
    storeAndRetrieve.address
  );
  const timeLock = await ethers.getContract("TimeLock");
  const transferTx = await storeAndRetrieveContract.transferOwnership(
    timeLock.address
  );
  await transferTx.wait(1);
};

export default deployStoreAndRetrieve;
deployStoreAndRetrieve.tags = ["all", "StoreAndRetrieve"];
