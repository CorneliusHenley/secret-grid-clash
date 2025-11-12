import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CONTRACT_ABI } from '../config/contract';
import { useContractAddress } from '../hooks/useContractAddress';

interface CreateRoundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateRoundDialog({ open, onOpenChange }: CreateRoundDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('86400'); // 1 day in seconds

  const { writeContract, isPending } = useWriteContract();
  const contractAddress = useContractAddress();

  const handleSubmit = async () => {
    if (!name || !description || !duration) return;

    try {
      await writeContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'createRound',
        args: [name, description, BigInt(duration)],
      });
      setName('');
      setDescription('');
      setDuration('86400');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create round:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Donation Round</DialogTitle>
          <DialogDescription>
            Create a new donation round for a specific cause or initiative.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Round Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Climate Change Initiative"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the cause"
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="86400 (1 day)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !name || !description}>
            {isPending ? 'Creating...' : 'Create Round'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



