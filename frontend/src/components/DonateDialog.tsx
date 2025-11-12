import { useState, useEffect } from 'react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useFHE } from '../hooks/useFHE';
import { CONTRACT_ABI } from '../config/contract';
import { useContractAddress } from '../hooks/useContractAddress';
import { hexlify, isBytesLike } from 'ethers';

interface DonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: number | null;
}

export default function DonateDialog({ open, onOpenChange, roundId }: DonateDialogProps) {
  const [amount, setAmount] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const contractAddress = useContractAddress();
  const { address } = useAccount();
  const { encrypt, isReady, isLoading, error } = useFHE();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDonate = async () => {
    console.log('handleDonate called', { roundId, amount, isReady });
    
    if (!roundId || !amount || !isReady) {
      console.log('Validation failed', { roundId, amount, isReady });
      return;
    }

    if (!address) {
      console.error('No address available');
      alert('Please connect your wallet');
      return;
    }

    setIsEncrypting(true);
    try {
      console.log('Starting encryption...', { contractAddress, amount: parseInt(amount) });
      const encrypted = await encrypt(contractAddress, parseInt(amount));
      console.log('Encryption successful', { encrypted });
      
      // Convert handle to hex string if needed
      let handleHex: `0x${string}`;
      const handle = encrypted.handle;
      
      if (typeof handle === 'string') {
        handleHex = handle.startsWith('0x') ? handle as `0x${string}` : `0x${handle}` as `0x${string}`;
      } else if (handle instanceof Uint8Array || isBytesLike(handle)) {
        handleHex = hexlify(handle) as `0x${string}`;
      } else {
        handleHex = hexlify(handle as any) as `0x${string}`;
      }
      
      // Convert inputProof to hex if needed
      let inputProofHex: `0x${string}`;
      const proof = encrypted.inputProof;
      if (typeof proof === 'string') {
        inputProofHex = proof.startsWith('0x') ? proof as `0x${string}` : `0x${proof}` as `0x${string}`;
      } else if (proof instanceof Uint8Array || isBytesLike(proof)) {
        inputProofHex = hexlify(proof) as `0x${string}`;
      } else {
        inputProofHex = hexlify(proof as any) as `0x${string}`;
      }
      
      console.log('Calling writeContract...', {
        address: contractAddress,
        roundId: BigInt(roundId),
        handleHex,
        inputProofHex,
      });
      
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'donate',
        args: [BigInt(roundId), handleHex, inputProofHex],
      });
      
      console.log('writeContract called, waiting for transaction hash...');
    } catch (error: any) {
      console.error('Failed to donate:', error);
      alert(`Failed to donate: ${error?.message || 'Unknown error'}`);
      setIsEncrypting(false);
    }
  };

  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      alert(`Transaction failed: ${writeError.message || 'Unknown error'}`);
      setIsEncrypting(false);
    }
  }, [writeError]);

  useEffect(() => {
    if (txError) {
      console.error('Transaction error:', txError);
      alert('Transaction failed');
      setIsEncrypting(false);
    }
  }, [txError]);

  useEffect(() => {
    if (isSuccess) {
      console.log('Transaction successful!');
      setAmount('');
      setIsEncrypting(false);
      onOpenChange(false);
    }
  }, [isSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make a Donation</DialogTitle>
          <DialogDescription>
            Your donation amount will be encrypted on-chain. No one can see the amount until the round is settled.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Donation Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              FHE encryption is initializing...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500">
              FHE Error: {error}
            </p>
          )}
          {!isLoading && !isReady && !error && (
            <p className="text-sm text-muted-foreground">
              Waiting for wallet connection...
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDonate}
            disabled={isPending || isEncrypting || isConfirming || !amount || !isReady}
          >
            {isEncrypting ? 'Encrypting...' : isPending || isConfirming ? 'Processing...' : 'Donate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



