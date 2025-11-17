# 🔒 Private Donation Matching

[![Vercel Demo](https://img.shields.io/badge/Vercel-Demo-blue)](https://private-donation-matching-m4tg.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black)](https://github.com/duan-hb/private-donation-matching)

A fully homomorphic encryption (FHE) based donation matching system that enables **anonymous matching donations** with **complete privacy protection** using Zama's fhEVM technology.

## 📹 Demo Video

🎬 **Watch the full demo**: [private-donation-matching.mp4](./private-donation-matching.mp4)

## 🌟 Overview

This project implements a **privacy-preserving donation matching system** where:
- 🔐 **All donation amounts are encrypted on-chain** using Zama FHE
- 🎭 **Matching commitments remain completely private** until settlement
- 🎯 **Trigger-based matching** only activates when community donations reach thresholds
- 🌍 **Perfect for Gitcoin Grants, Endaoment, GiveWell**, and other crypto philanthropy platforms
- 🔍 **Transparent settlement** reveals only final totals, not individual contributions

## ✨ Key Features

- **🛡️ Encrypted Donations**: All donation amounts are homomorphically encrypted on-chain
- **👤 Anonymous Matching**: Matchers can commit matching amounts without revealing them
- **🚀 Trigger-based Matching**: Matching only triggers when community donations reach a minimum threshold
- **🔒 Privacy-First Architecture**: No one can see individual donations or matching amounts until settlement
- **📊 Transparent Settlement**: Final totals are revealed after round ends
- **🔄 Network Switching**: Automatic switching between localhost (development) and Sepolia testnet

## 🏗️ Project Structure

```
private-donation-matching/
├── 📁 contracts/          # Solidity smart contracts (FHE-enabled)
├── 📁 frontend/           # React frontend application
├── 📁 test/               # Hardhat tests
├── 📁 deploy/             # Deployment scripts
├── 📁 tasks/              # Hardhat tasks
└── 📄 README.md           # This file
```

## 📋 Contract Addresses

| Network | Address | Status |
|---------|---------|--------|
| **Localhost** (Hardhat) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | ✅ Deployed |
| **Sepolia Testnet** | `0x97d210588F48e42E4f3028905d3dd72bcd3C30CE` | ✅ Deployed |

## 🎯 Smart Contract Architecture

### Core Components

#### 📊 **Data Structures**

```solidity
struct Donation {
    address donor;
    euint64 amount;     // Encrypted donation amount
    uint256 timestamp;
    uint256 roundId;
}

struct MatchingCommitment {
    address matcher;
    euint64 maxMatchingAmount;  // Encrypted maximum matching amount
    euint64 minTrigger;         // Encrypted minimum trigger threshold
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
    euint64 encryptedCommunityTotal;  // Sum of all encrypted donations
    euint64 encryptedMatchingTotal;   // Sum of all encrypted matching amounts
    euint64 encryptedFinalTotal;      // Final total (community + matching)
    uint256 publicFinalTotal;         // Decrypted final total (after settlement)
}
```

#### 🔑 **Core Functions**

### 1. **Create Donation Round**
```solidity
function createRound(string name, string description, uint256 duration)
```
- Creates a new donation matching round
- Initializes encrypted total counters to 0
- Sets up FHE permissions for the round

### 2. **Make Encrypted Donation**
```solidity
function donate(uint256 roundId, externalEuint64 encryptedAmount, bytes inputProof)
```
- Accepts homomorphically encrypted donation amounts
- Adds to encrypted community total using FHE addition
- Grants decryption permissions to donor
- Re-authorizes all previous donors for updated community total

### 3. **Commit Matching Amount**
```solidity
function commitMatching(
    uint256 roundId,
    externalEuint64 encryptedMaxMatching,
    externalEuint64 encryptedMinTrigger,
    bytes inputProofMax,
    bytes inputProofMin
)
```
- Allows matchers to commit encrypted matching amounts
- Includes minimum trigger threshold for activation
- Stores encrypted max matching amount and trigger condition

### 4. **View Encrypted Total**
```solidity
function viewCurrentEncryptedTotal(uint256 roundId) returns (euint64)
```
- Returns the current encrypted community donation total
- Only authorized users can decrypt this value

### 5. **Settle Round**
```solidity
function settleRound(uint256 roundId)
```
- Performs encrypted computation to calculate final totals
- Evaluates matching triggers using encrypted comparison
- Grants decryption permissions to all participants
- Reveals only the final aggregated total

## 🔐 FHE Encryption/Decryption Flow

### **Client-Side Encryption**
```typescript
// 1. Generate encryption keypair
const keypair = instance.generateKeypair();

// 2. Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add64(donationAmount);
const encrypted = await input.encrypt();

// 3. Submit to contract
await contract.donate(roundId, encrypted.handles[0], encrypted.inputProof);
```

### **Contract-Side FHE Operations**
```solidity
// 1. Convert external encrypted input to internal euint64
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

// 2. Perform encrypted addition
round.encryptedCommunityTotal = FHE.add(
    round.encryptedCommunityTotal,
    amount
);

// 3. Grant decryption permissions
FHE.allow(round.encryptedCommunityTotal, userAddress);
```

### **Client-Side Decryption**
```typescript
// 1. Create EIP712 signature for decryption
const eip712 = instance.createEIP712(publicKey, [contractAddress], timestamp, duration);
const signature = await signer.signTypedData(eip712.domain, eip712.types, eip712.message);

// 2. Request decryption
const result = await instance.userDecrypt(
    [{ handle: encryptedHandle, contractAddress }],
    privateKey,
    publicKey,
    signature,
    [contractAddress],
    userAddress,
    timestamp,
    duration
);
```

### **Key FHE Concepts Used**

1. **Homomorphic Addition**: `FHE.add(a, b)` - Add encrypted numbers without decryption
2. **Homomorphic Comparison**: `FHE.ge(a, b)` - Compare encrypted values
3. **Conditional Selection**: `FHE.select(condition, ifTrue, ifFalse)` - Encrypted if-then-else
4. **Permission Management**: `FHE.allow(ciphertext, address)` - Grant decryption rights

## 🎨 Frontend Architecture

### **Technology Stack**
- ⚛️ **React 18** + TypeScript
- ⚡ **Vite** - Fast build tool
- 🌈 **RainbowKit** - Wallet connection UI
- 🔗 **Wagmi** - Ethereum interaction
- 🎨 **Tailwind CSS** + shadcn/ui
- 🔐 **Zama FHE SDK** - Homomorphic encryption

### **Network Switching Logic**
```typescript
// Automatic contract address selection based on chain ID
export function getContractAddress(chainId: number): `0x${string}` {
  if (chainId === 31337 || chainId === 1337) {
    return CONTRACT_ADDRESS_LOCAL;     // Localhost
  } else if (chainId === 11155111) {
    return CONTRACT_ADDRESS_SEPOLIA;   // Sepolia
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 7.0.0
- MetaMask or compatible Web3 wallet

### Installation

1. **Clone and install dependencies:**
```bash
git clone https://github.com/duan-hb/private-donation-matching.git
cd private-donation-matching
npm install
cd frontend && npm install
```

2. **Configure environment (for Sepolia deployment):**
```bash
# Return to project root
cd ..
npx hardhat vars setup
# Set INFURA_API_KEY and PRIVATE_KEY when prompted
```

3. **Compile contracts:**
```bash
npm run compile
```

4. **Run tests:**
```bash
npm test              # Local tests
npm run test:sepolia  # Sepolia tests
```

## 🌐 Live Demo

🚀 **Try it live**: https://private-donation-matching-m4tg.vercel.app/

The demo includes:
- ✅ **Wallet Connection** (MetaMask, etc.)
- ✅ **Network Switching** (Localhost ↔ Sepolia)
- ✅ **Create Donation Rounds**
- ✅ **Encrypted Donations**
- ✅ **Anonymous Matching Commitments**
- ✅ **Real-time Encrypted Totals**
- ⚠️ **Note**: Sepolia network may have FHE relayer connectivity issues

## 🔧 Development Workflow

### Local Development
```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts locally
npx hardhat deploy

# Terminal 3: Start frontend
cd frontend && npm run dev
```

### Sepolia Deployment
```bash
# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia

# Update frontend contract address (auto-handled by network switching)
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test
```
- ✅ Contract deployment
- ✅ Round creation
- ✅ Encrypted donations
- ✅ Matching commitments
- ✅ Settlement logic

### Integration Tests
```bash
npm run test:sepolia
```
- ✅ Sepolia network deployment
- ✅ Multi-user interactions
- ✅ FHE operations on testnet

## 🔒 Security Considerations

### FHE Security
- All sensitive data remains encrypted on-chain
- Only authorized parties can decrypt final results
- Zero-knowledge proofs verify encrypted inputs
- Relayer network handles decryption requests

### Smart Contract Security
- Reentrancy protection
- Access control validation
- Input sanitization
- Time-based restrictions

## 📈 Future Enhancements

- [ ] **Multi-round matching pools**
- [ ] **Quadratic funding integration**
- [ ] **Cross-chain compatibility**
- [ ] **Gas optimization for FHE operations**
- [ ] **Batch processing for multiple donations**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Zama** - For the fhEVM technology enabling private smart contracts
- **Ethereum Foundation** - For the robust blockchain infrastructure
- **Open-source community** - For the amazing development tools

---

**Built with ❤️ using Fully Homomorphic Encryption**



