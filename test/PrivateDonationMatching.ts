import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivateDonationMatching, PrivateDonationMatching__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  matcher: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PrivateDonationMatching")) as PrivateDonationMatching__factory;
  const contract = (await factory.deploy()) as PrivateDonationMatching;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("PrivateDonationMatching", function () {
  let signers: Signers;
  let contract: PrivateDonationMatching;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      matcher: ethSigners[3]
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("should create a donation round", async function () {
    const tx = await contract
      .connect(signers.deployer)
      .createRound("Climate Change", "Support climate action", 86400); // 1 day
    await tx.wait();

    const round = await contract.getRound(1);
    expect(round.id).to.eq(1);
    expect(round.name).to.eq("Climate Change");
    expect(round.settled).to.eq(false);
  });

  it("should allow donations with encrypted amounts", async function () {
    // Create a round first
    await contract.connect(signers.deployer).createRound("Test Round", "Test", 86400);
    
    // Encrypt donation amount of 100
    const donationAmount = 100;
    const encryptedDonation = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(donationAmount)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .donate(1, encryptedDonation.handles[0], encryptedDonation.inputProof);
    await tx.wait();

    const donationCount = await contract.getDonationCount(1);
    expect(donationCount).to.eq(1);

    // Check encrypted total (should be encrypted, not readable)
    const encryptedTotal = await contract.viewCurrentEncryptedTotal(1);
    expect(encryptedTotal).to.not.eq(ethers.ZeroHash);
  });

  it("should allow matching commitments", async function () {
    // Create a round
    await contract.connect(signers.deployer).createRound("Test Round", "Test", 86400);
    
    // Encrypt matching commitment: max 50000, trigger at 80000
    const maxMatching = 50000;
    const minTrigger = 80000;
    
    const encryptedMaxMatching = await fhevm
      .createEncryptedInput(contractAddress, signers.matcher.address)
      .add64(maxMatching)
      .encrypt();

    const encryptedMinTrigger = await fhevm
      .createEncryptedInput(contractAddress, signers.matcher.address)
      .add64(minTrigger)
      .encrypt();

    const tx = await contract
      .connect(signers.matcher)
      .commitMatching(
        1,
        encryptedMaxMatching.handles[0],
        encryptedMinTrigger.handles[0],
        encryptedMaxMatching.inputProof,
        encryptedMinTrigger.inputProof
      );
    await tx.wait();

    const commitmentCount = await contract.getMatchingCommitmentCount(1);
    expect(commitmentCount).to.eq(1);
  });

  it("should accumulate multiple donations", async function () {
    // Create a round
    await contract.connect(signers.deployer).createRound("Test Round", "Test", 86400);
    
    // Alice donates 100
    const aliceDonation = 100;
    const encryptedAlice = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(aliceDonation)
      .encrypt();
    
    await contract
      .connect(signers.alice)
      .donate(1, encryptedAlice.handles[0], encryptedAlice.inputProof);

    // Bob donates 200
    const bobDonation = 200;
    const encryptedBob = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add64(bobDonation)
      .encrypt();
    
    await contract
      .connect(signers.bob)
      .donate(1, encryptedBob.handles[0], encryptedBob.inputProof);

    const donationCount = await contract.getDonationCount(1);
    expect(donationCount).to.eq(2);

    // Decrypt and verify total (use bob since he's the last donor and has permission)
    const encryptedTotal = await contract.viewCurrentEncryptedTotal(1);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedTotal,
      contractAddress,
      signers.bob,
    );
    
    expect(clearTotal).to.eq(aliceDonation + bobDonation);
  });

  it("should prevent duplicate donations from same address", async function () {
    await contract.connect(signers.deployer).createRound("Test Round", "Test", 86400);
    
    const donationAmount = 100;
    const encryptedDonation = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(donationAmount)
      .encrypt();

    await contract
      .connect(signers.alice)
      .donate(1, encryptedDonation.handles[0], encryptedDonation.inputProof);

    // Try to donate again - should fail
    await expect(
      contract
        .connect(signers.alice)
        .donate(1, encryptedDonation.handles[0], encryptedDonation.inputProof)
    ).to.be.revertedWith("Already donated to this round");
  });

  it("should settle round after end time", async function () {
    // Create a round with short duration (10 seconds)
    await contract.connect(signers.deployer).createRound("Test Round", "Test", 10);
    
    // Make a donation before round ends
    const donationAmount = 100;
    const encryptedDonation = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(donationAmount)
      .encrypt();

    const donateTx = await contract
      .connect(signers.alice)
      .donate(1, encryptedDonation.handles[0], encryptedDonation.inputProof);
    await donateTx.wait();

    // Wait for round to end (wait 11 seconds to ensure round has ended)
    await ethers.provider.send("evm_increaseTime", [11]);
    await ethers.provider.send("evm_mine", []);

    // Settle the round
    const tx = await contract.connect(signers.deployer).settleRound(1);
    await tx.wait();

    const round = await contract.getRound(1);
    expect(round.settled).to.eq(true);
  });
});



