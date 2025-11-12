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

interface MatchingCommitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roundId: number | null;
}

export default function MatchingCommitDialog({ open, onOpenChange, roundId }: MatchingCommitDialogProps) {
  const [maxMatching, setMaxMatching] = useState('');
  const [minTrigger, setMinTrigger] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const { address } = useAccount();
  const { encrypt, isReady, isLoading, error } = useFHE();
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError } = useWaitForTransactionReceipt({
    hash,
  });

  const handleCommit = async () => {
    console.log('handleCommit called', { roundId, maxMatching, minTrigger, isReady });
    
    if (!roundId || !maxMatching || !minTrigger || !isReady) {
      console.log('Validation failed', { roundId, maxMatching, minTrigger, isReady });
      return;
    }

    if (!address) {
      console.error('No address available');
      alert('Please connect your wallet');
      return;
    }

    setIsEncrypting(true);
    try {
      console.log('Starting encryption...', { contractAddress });
      const encryptedMax = await encrypt(contractAddress, parseInt(maxMatching));
      const encryptedMin = await encrypt(contractAddress, parseInt(minTrigger));
      console.log('Encryption successful', { encryptedMax, encryptedMin });
      
      // Convert handles to hex strings
      const convertToHex = (value: any): `0x${string}` => {
        if (typeof value === 'string') {
          return value.startsWith('0x') ? value as `0x${string}` : `0x${value}` as `0x${string}`;
        } else if (value instanceof Uint8Array || isBytesLike(value)) {
          return hexlify(value) as `0x${string}`;
        } else {
          return hexlify(value as any) as `0x${string}`;
        }
      };
      
      const maxHandleHex = convertToHex(encryptedMax.handle);
      const minHandleHex = convertToHex(encryptedMin.handle);
      const maxProofHex = convertToHex(encryptedMax.inputProof);
      const minProofHex = convertToHex(encryptedMin.inputProof);
      
      console.log('Calling writeContract...', {
        address: contractAddress,
        roundId: BigInt(roundId),
        maxHandleHex,
        minHandleHex,
      });
      
      writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'commitMatching',
        args: [
          BigInt(roundId),
          maxHandleHex,
          minHandleHex,
          maxProofHex,
          minProofHex,
        ],
      });
      
      console.log('writeContract called, waiting for transaction hash...');
    } catch (error: any) {
      console.error('Failed to commit matching:', error);
      alert(`Failed to commit matching: ${error?.message || 'Unknown error'}`);
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
      setMaxMatching('');
      setMinTrigger('');
      setIsEncrypting(false);
      onOpenChange(false);
    }
  }, [isSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Commit Matching Donation</DialogTitle>
          <DialogDescription>
            Commit to match community donations up to a maximum amount, triggered when community donations reach a minimum threshold.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="maxMatching">Maximum Matching Amount (ETH)</Label>
            <Input
              id="maxMatching"
              type="number"
              value={maxMatching}
              onChange={(e) => setMaxMatching(e.target.value)}
              placeholder="e.g., 50000"
            />
          </div>
          <div>
            <Label htmlFor="minTrigger">Minimum Trigger Amount (ETH)</Label>
            <Input
              id="minTrigger"
              type="number"
              value={minTrigger}
              onChange={(e) => setMinTrigger(e.target.value)}
              placeholder="e.g., 80000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Matching will only trigger if community donations reach this amount
            </p>
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
            onClick={handleCommit}
            disabled={isPending || isEncrypting || isConfirming || !maxMatching || !minTrigger || !isReady}
          >
            {isEncrypting ? 'Encrypting...' : isPending || isConfirming ? 'Processing...' : 'Commit Matching'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



