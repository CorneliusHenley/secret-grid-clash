import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import { createFhevmInstance } from '../fhevm/fhevmUtils';
import { hexlify, isBytesLike } from 'ethers';

export function useFHE() {
  const { address, chainId } = useAccount();
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initFHE = async () => {
      // 等待钱包连接
      if (!chainId || !window.ethereum) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('Initializing FHE SDK...', { chainId, address });

        // Create FHEVM instance (will auto-detect mock mode for localhost)
        const fhevmInstance = await createFhevmInstance({
          provider: window.ethereum,
          mockChains: {
            31337: 'http://localhost:8545',
          },
        });

        console.log('FHE instance created successfully:', !!fhevmInstance);
        
        if (mounted) {
          setInstance(fhevmInstance);
          console.log('FHE instance set in state');
        }
      } catch (err: any) {
        console.error('Failed to initialize FHE:', err);
        if (mounted) {
          setError(err?.message || 'Failed to initialize encryption service');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log('FHE initialization completed, isLoading set to false');
        }
      }
    };

    initFHE();

    return () => {
      mounted = false;
    };
  }, [chainId, address]);

  const encrypt = async (contractAddress: string, value: number) => {
    if (!instance || !address) {
      throw new Error('FHE instance or address not available');
    }

    const input = instance.createEncryptedInput(contractAddress, address);
    input.add64(value);
    const encrypted = await input.encrypt();
    
    return {
      handle: encrypted.handles[0],
      inputProof: encrypted.inputProof,
    };
  };

  const decrypt = async (
    contractAddress: string,
    handle: string | Uint8Array,
    userAddress: string,
    signer: any
  ): Promise<number> => {
    if (!instance || !signer || !userAddress) {
      throw new Error('FHE instance, signer, or address not available');
    }

    console.log('Starting decryption...', { contractAddress, handle, userAddress, handleType: typeof handle });

    // Generate temporary keypair for decryption
    const keypair = instance.generateKeypair();

    // Convert handle to proper format - ensure it's a string with 0x prefix
    let handleForDecrypt: string;
    if (typeof handle === 'string') {
      handleForDecrypt = handle.startsWith('0x') ? handle : `0x${handle}`;
    } else if (handle instanceof Uint8Array || isBytesLike(handle)) {
      handleForDecrypt = hexlify(handle);
    } else {
      handleForDecrypt = hexlify(handle as any);
    }

    // Normalize handle to lowercase for consistent matching
    handleForDecrypt = handleForDecrypt.toLowerCase();

    // Prepare handle-contract pairs
    const handleContractPairs = [{
      handle: handleForDecrypt,
      contractAddress: contractAddress,
    }];

    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "7"; // 7 days validity
    const contractAddresses = [contractAddress];

    // Create EIP712 signature for user decryption
    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    // Sign the decryption request
    // ethers v6 signTypedData uses (domain, types, message) format
    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    console.log('Calling userDecrypt...');

    // Call userDecrypt
    console.log('Calling userDecrypt with:', {
      handleContractPairs,
      contractAddresses,
      userAddress,
    });
    
    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      userAddress,
      startTimeStamp,
      durationDays,
    );

    console.log('userDecrypt result:', result);
    console.log('Looking for handle in result:', handle);
    console.log('Result keys:', Object.keys(result));
    console.log('handleContractPairs[0].handle:', handleContractPairs[0].handle);
    
    // The result object uses the handle as key
    // The key in result should match the handle we sent (normalized to lowercase)
    let decryptedValue: any;
    
    // Try 1: Use the normalized handle we sent
    decryptedValue = result[handleForDecrypt];
    
    // Try 2: Try with original handle format (if different)
    if (decryptedValue === undefined && typeof handle === 'string') {
      const originalHandle = handle.startsWith('0x') ? handle : `0x${handle}`;
      decryptedValue = result[originalHandle.toLowerCase()] || result[originalHandle];
    }
    
    // Try 3: Try all keys in result (fallback - should only happen if format mismatch)
    if (decryptedValue === undefined && Object.keys(result).length > 0) {
      const keys = Object.keys(result);
      console.warn('Handle format mismatch. Trying all keys:', keys);
      
      // If only one key, use it
      if (keys.length === 1) {
        decryptedValue = result[keys[0]];
      } else {
        // Try to find by matching handle content (ignore case and 0x prefix)
        const handleContent = handleForDecrypt.replace('0x', '').toLowerCase();
        for (const key of keys) {
          const keyContent = key.replace('0x', '').toLowerCase();
          if (keyContent === handleContent || key.toLowerCase() === handleForDecrypt) {
            decryptedValue = result[key];
            break;
          }
        }
      }
    }
    
    if (decryptedValue === undefined) {
      console.error('Available result keys:', Object.keys(result));
      console.error('Looking for handle:', handleForDecrypt);
      console.error('Original handle:', handle);
      throw new Error('Decrypted value not found in result. Available keys: ' + Object.keys(result).join(', ') + '. Looking for: ' + handleForDecrypt);
    }
    
    console.log('Decryption successful:', decryptedValue);

    // Convert to number
    if (typeof decryptedValue === 'bigint') {
      return Number(decryptedValue);
    }
    return Number(decryptedValue);
  };

  return {
    instance,
    encrypt,
    decrypt,
    isLoading,
    error,
    isReady: !!instance && !!address,
  };
}



