import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { PrivateDonationMatching } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("PrivateDonationMatchingSepolia", function () {
  let signers: Signers;
  let contract: PrivateDonationMatching;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const PrivateDonationMatchingDeployment = await deployments.get("PrivateDonationMatching");
      contractAddress = PrivateDonationMatchingDeployment.address;
      contract = await ethers.getContractAt("PrivateDonationMatching", PrivateDonationMatchingDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("create round and make donation", async function () {
    steps = 10;

    this.timeout(4 * 40000);

    progress("Creating donation round...");
    let tx = await contract
      .connect(signers.alice)
      .createRound("Climate Change Round", "Support climate action initiatives", 86400);
    await tx.wait();

    progress("Encrypting donation amount '100'...");
    const encryptedDonation = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(100)
      .encrypt();

    progress(
      `Call donate(1) PrivateDonationMatching=${contractAddress} handle=${ethers.hexlify(encryptedDonation.handles[0])} signer=${signers.alice.address}...`,
    );
    tx = await contract
      .connect(signers.alice)
      .donate(1, encryptedDonation.handles[0], encryptedDonation.inputProof);
    await tx.wait();

    progress(`Call viewCurrentEncryptedTotal(1)...`);
    const encryptedTotal = await contract.viewCurrentEncryptedTotal(1);
    expect(encryptedTotal).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting viewCurrentEncryptedTotal(1)=${encryptedTotal}...`);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );
    progress(`Clear viewCurrentEncryptedTotal(1)=${clearTotal}`);

    expect(clearTotal).to.eq(100);
  });
});



