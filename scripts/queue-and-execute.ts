import { ethers, network } from "hardhat";
import {
  FUNC,
  NEW_STORE_VALUE,
  PROPOSAL_DESCRIPTION,
  MIN_DELAY,
  developmentChains,
} from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";
import { moveTime } from "../utils/move-time";

export async function queueAndExecute() {
  const args = [NEW_STORE_VALUE];
  const functionToCall = FUNC;
  const storeAndRetrieve = await ethers.getContract("StoreAndRetrieve");
  const encodedFunctionCall = storeAndRetrieve.interface.encodeFunctionData(
    functionToCall,
    args
  );
  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION)
  );

  const governor = await ethers.getContract("GovernorContract");
  console.log("Queueing...");
  const queueTx = await governor.queue(
    [storeAndRetrieve.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await queueTx.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }

  console.log("Executing...");
  // this will fail on a testnet because you need to wait for the MIN_DELAY!
  const executeTx = await governor.execute(
    [storeAndRetrieve.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executeTx.wait(1);
  console.log(`New Value is: ${await storeAndRetrieve.retrieve()}`);
}

queueAndExecute()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
