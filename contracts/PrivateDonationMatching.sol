// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Private Donation Matching
/// @notice A fully homomorphic encryption-based donation matching system
/// @dev All donation amounts and matching commitments are encrypted on-chain
contract PrivateDonationMatching is SepoliaConfig {
    struct Donation {
        address donor;
        euint64 amount; // Encrypted donation amount
        uint256 timestamp;
        uint256 roundId;
    }

    struct MatchingCommitment {
        address matcher;
        euint64 maxMatchingAmount; // Encrypted maximum matching amount
        euint64 minTrigger; // Encrypted minimum community donation trigger
        uint256 roundId;
        uint256 timestamp;
        bool isActive;
    }

    struct DonationRound {
        uint256 id;
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool settled;
        euint64 encryptedCommunityTotal; // Sum of all encrypted donations
        euint64 encryptedMatchingTotal; // Sum of all encrypted matching amounts
        euint64 encryptedFinalTotal; // Final total (community + matching)
        uint256 publicFinalTotal; // Decrypted final total (only after settlement)
    }

    uint256 private roundCounter;
    mapping(uint256 => DonationRound) public rounds;
    mapping(uint256 => Donation[]) public roundDonations;
    mapping(uint256 => MatchingCommitment[]) public roundMatchingCommitments;
    mapping(uint256 => mapping(address => bool)) public hasDonated;
    mapping(uint256 => mapping(address => bool)) public hasCommittedMatching;

    event DonationRoundCreated(uint256 indexed roundId, string name, uint256 endTime);
    event DonationMade(uint256 indexed roundId, address indexed donor, uint256 timestamp);
    event MatchingCommitted(uint256 indexed roundId, address indexed matcher, uint256 timestamp);
    event RoundSettled(uint256 indexed roundId, uint256 publicFinalTotal);

    /// @notice Create a new donation round
    /// @param name Name of the donation round
    /// @param description Description of the donation round
    /// @param duration Duration in seconds for the round
    function createRound(
        string memory name,
        string memory description,
        uint256 duration
    ) external {
        require(bytes(name).length > 0, "Round name cannot be empty");
        require(duration > 0, "Duration must be positive");

        uint256 roundId = ++roundCounter;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        rounds[roundId] = DonationRound({
            id: roundId,
            name: name,
            description: description,
            startTime: startTime,
            endTime: endTime,
            settled: false,
            encryptedCommunityTotal: FHE.asEuint64(uint64(0)),
            encryptedMatchingTotal: FHE.asEuint64(uint64(0)),
            encryptedFinalTotal: FHE.asEuint64(uint64(0)),
            publicFinalTotal: 0
        });

        FHE.allowThis(rounds[roundId].encryptedCommunityTotal);
        FHE.allowThis(rounds[roundId].encryptedMatchingTotal);
        FHE.allowThis(rounds[roundId].encryptedFinalTotal);

        emit DonationRoundCreated(roundId, name, endTime);
    }

    /// @notice Make a donation to a round (encrypted amount)
    /// @param roundId The donation round ID
    /// @param encryptedAmount The encrypted donation amount
    /// @param inputProof The proof for the encrypted input
    function donate(
        uint256 roundId,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        require(!rounds[roundId].settled, "Round already settled");
        require(block.timestamp < rounds[roundId].endTime, "Round has ended");
        require(!hasDonated[roundId][msg.sender], "Already donated to this round");

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        amount = FHE.allowThis(amount);

        // Add to encrypted community total
        rounds[roundId].encryptedCommunityTotal = FHE.add(
            rounds[roundId].encryptedCommunityTotal,
            amount
        );

        // Store donation
        roundDonations[roundId].push(Donation({
            donor: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            roundId: roundId
        }));

        hasDonated[roundId][msg.sender] = true;

        FHE.allowThis(rounds[roundId].encryptedCommunityTotal);
        FHE.allow(amount, msg.sender);
        
        // Allow current donor to decrypt the encrypted community total
        FHE.allow(rounds[roundId].encryptedCommunityTotal, msg.sender);
        
        // IMPORTANT: Re-authorize all previous donors for the updated community total
        // When encryptedCommunityTotal is updated via FHE.add, it becomes a new ciphertext,
        // so all previous authorizations are invalidated and need to be re-applied
        Donation[] storage donations = roundDonations[roundId];
        for (uint256 i = 0; i < donations.length - 1; i++) { // -1 because current donor is already authorized above
            FHE.allow(rounds[roundId].encryptedCommunityTotal, donations[i].donor);
        }

        emit DonationMade(roundId, msg.sender, block.timestamp);
    }

    /// @notice Commit a matching amount (for matchers)
    /// @param roundId The donation round ID
    /// @param encryptedMaxMatching The encrypted maximum matching amount
    /// @param encryptedMinTrigger The encrypted minimum trigger amount
    /// @param inputProofMax The proof for max matching amount
    /// @param inputProofMin The proof for min trigger amount
    function commitMatching(
        uint256 roundId,
        externalEuint64 encryptedMaxMatching,
        externalEuint64 encryptedMinTrigger,
        bytes calldata inputProofMax,
        bytes calldata inputProofMin
    ) external {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        require(!rounds[roundId].settled, "Round already settled");
        require(block.timestamp < rounds[roundId].endTime, "Round has ended");
        require(!hasCommittedMatching[roundId][msg.sender], "Already committed matching");

        euint64 maxMatching = FHE.fromExternal(encryptedMaxMatching, inputProofMax);
        euint64 minTrigger = FHE.fromExternal(encryptedMinTrigger, inputProofMin);

        maxMatching = FHE.allowThis(maxMatching);
        minTrigger = FHE.allowThis(minTrigger);

        // Store matching commitment
        roundMatchingCommitments[roundId].push(MatchingCommitment({
            matcher: msg.sender,
            maxMatchingAmount: maxMatching,
            minTrigger: minTrigger,
            roundId: roundId,
            timestamp: block.timestamp,
            isActive: true
        }));

        hasCommittedMatching[roundId][msg.sender] = true;

        FHE.allow(maxMatching, msg.sender);
        FHE.allow(minTrigger, msg.sender);

        emit MatchingCommitted(roundId, msg.sender, block.timestamp);
    }

    /// @notice View the current encrypted total (returns ciphertext)
    /// @param roundId The donation round ID
    /// @return The encrypted community total
    function viewCurrentEncryptedTotal(uint256 roundId) external view returns (euint64) {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        return rounds[roundId].encryptedCommunityTotal;
    }

    /// @notice Settle the round and calculate final totals (encrypted computation)
    /// @param roundId The donation round ID
    /// @dev This function performs all computations in encrypted domain
    function settleRound(uint256 roundId) external {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        require(!rounds[roundId].settled, "Round already settled");
        require(block.timestamp >= rounds[roundId].endTime, "Round not ended");

        DonationRound storage round = rounds[roundId];
        round.settled = true;

        // Start with community total
        euint64 finalTotal = round.encryptedCommunityTotal;
        euint64 matchingTotal = FHE.asEuint64(uint64(0));

        // Process each matching commitment
        MatchingCommitment[] storage commitments = roundMatchingCommitments[roundId];
        for (uint256 i = 0; i < commitments.length; i++) {
            if (!commitments[i].isActive) continue;

            // Check if community total >= min trigger (encrypted comparison)
            ebool triggerMet = FHE.ge(round.encryptedCommunityTotal, commitments[i].minTrigger);

            // If trigger met, add matching amount (up to max)
            // Note: In a real implementation, we'd need to compute min(maxMatching, gap)
            // For MVP, we'll use the max matching amount if trigger is met
            euint64 matchingAmount = FHE.select(
                triggerMet,
                commitments[i].maxMatchingAmount,
                FHE.asEuint64(uint64(0))
            );

            matchingTotal = FHE.add(matchingTotal, matchingAmount);
        }

        // Calculate final total
        finalTotal = FHE.add(round.encryptedCommunityTotal, matchingTotal);

        round.encryptedMatchingTotal = matchingTotal;
        round.encryptedFinalTotal = finalTotal;

        // Allow all participants (donors and matchers) to decrypt the final total
        FHE.allowThis(round.encryptedFinalTotal);
        
        // Grant decryption permission to all donors
        Donation[] storage donations = roundDonations[roundId];
        for (uint256 i = 0; i < donations.length; i++) {
            FHE.allow(round.encryptedFinalTotal, donations[i].donor);
        }
        
        // Grant decryption permission to all matchers
        for (uint256 i = 0; i < commitments.length; i++) {
            if (commitments[i].isActive) {
                FHE.allow(round.encryptedFinalTotal, commitments[i].matcher);
            }
        }

        // Note: In production, the decryption would happen off-chain via oracle
        // For MVP, we emit the encrypted total which can be decrypted by authorized parties
        emit RoundSettled(roundId, 0); // 0 indicates encrypted value needs decryption
    }

    /// @notice Get round information
    /// @param roundId The donation round ID
    function getRound(uint256 roundId)
        external
        view
        returns (
            uint256 id,
            string memory name,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            bool settled,
            euint64 encryptedCommunityTotal,
            euint64 encryptedMatchingTotal,
            euint64 encryptedFinalTotal,
            uint256 publicFinalTotal
        )
    {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        DonationRound memory round = rounds[roundId];
        return (
            round.id,
            round.name,
            round.description,
            round.startTime,
            round.endTime,
            round.settled,
            round.encryptedCommunityTotal,
            round.encryptedMatchingTotal,
            round.encryptedFinalTotal,
            round.publicFinalTotal
        );
    }

    /// @notice Get donation count for a round
    /// @param roundId The donation round ID
    function getDonationCount(uint256 roundId) external view returns (uint256) {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        return roundDonations[roundId].length;
    }

    /// @notice Get matching commitment count for a round
    /// @param roundId The donation round ID
    function getMatchingCommitmentCount(uint256 roundId) external view returns (uint256) {
        require(roundId > 0 && roundId <= roundCounter, "Invalid round ID");
        return roundMatchingCommitments[roundId].length;
    }

    /// @notice Get total number of rounds
    function getRoundCount() external view returns (uint256) {
        return roundCounter;
    }
}



