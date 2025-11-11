import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("privateDonationMatching:getRound", "Get round information")
  .addParam("roundId", "The round ID")
  .setAction(async (taskArgs: TaskArguments, { ethers }) => {
    const contract = await ethers.getContractAt(
      "PrivateDonationMatching",
      taskArgs.contract || (await ethers.getContract("PrivateDonationMatching")).address
    );

    const round = await contract.getRound(taskArgs.roundId);
    console.log("Round ID:", round.id.toString());
    console.log("Name:", round.name);
    console.log("Description:", round.description);
    console.log("Start Time:", new Date(Number(round.startTime) * 1000).toLocaleString());
    console.log("End Time:", new Date(Number(round.endTime) * 1000).toLocaleString());
    console.log("Settled:", round.settled);
    console.log("Public Final Total:", round.publicFinalTotal.toString());
  });

task("privateDonationMatching:getRoundCount", "Get total number of rounds")
  .setAction(async (taskArgs: TaskArguments, { ethers }) => {
    const contract = await ethers.getContractAt(
      "PrivateDonationMatching",
      taskArgs.contract || (await ethers.getContract("PrivateDonationMatching")).address
    );

    const count = await contract.getRoundCount();
    console.log("Total rounds:", count.toString());
  });



