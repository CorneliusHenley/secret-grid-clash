import { useState } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Lock, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { CONTRACT_ABI } from '../config/contract';
import { useContractAddress } from '../hooks/useContractAddress';
import RoundDetails from './RoundDetails';

interface DonationRoundListProps {
  onDonate: (roundId: number) => void;
  onCommitMatching: (roundId: number) => void;
}

export default function DonationRoundList({ onDonate, onCommitMatching }: DonationRoundListProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const contractAddress = useContractAddress();
  
  const { data: roundCount } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getRoundCount',
  });

  const roundIds = Array.from({ length: Number(roundCount || 0) }, (_, i) => i + 1);

  const roundsQuery = useReadContracts({
    allowFailure: true,
    contracts: roundIds.map((id) => ({
      address: contractAddress,
      abi: CONTRACT_ABI,
      functionName: 'getRound',
      args: [BigInt(id)],
    })),
  });

  const rounds = roundsQuery.data?.map((result, index) => {
    if (!result || result.status === 'failure') return null;
    const data = result.result as any;
    return {
      id: roundIds[index],
      name: data[1] || '-',
      description: data[2] || '-',
      endTime: Number(data[4] || 0),
      settled: data[5] || false,
      publicFinalTotal: data[9] ? Number(data[9]) : 0,
    };
  }).filter((round): round is NonNullable<typeof round> => round !== null) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Active Donation Rounds</h2>
      {rounds.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No donation rounds available. Create one to get started!
          </CardContent>
        </Card>
      ) : (
        rounds.map((round) => {
          const isExpanded = expandedRounds.has(round.id);
          return (
            <div key={round.id} className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{round.name}</span>
                    {round.settled && (
                      <span className="text-sm font-normal text-secondary">
                        Final Total: {round.publicFinalTotal} ETH
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{round.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Ends: {new Date(round.endTime * 1000).toLocaleString()}
                      </div>
                      {!round.settled && (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>Encrypted</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!round.settled && (
                        <>
                          <Button onClick={() => onDonate(round.id)} size="sm">
                            <Heart className="w-4 h-4 mr-2" />
                            Donate
                          </Button>
                          <Button
                            onClick={() => onCommitMatching(round.id)}
                            variant="outline"
                            size="sm"
                          >
                            Commit Matching
                          </Button>
                        </>
                      )}
                      <Button
                        onClick={() => {
                          const newExpanded = new Set(expandedRounds);
                          if (isExpanded) {
                            newExpanded.delete(round.id);
                          } else {
                            newExpanded.add(round.id);
                          }
                          setExpandedRounds(newExpanded);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            View Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {isExpanded && <RoundDetails roundId={round.id} />}
            </div>
          );
        })
      )}
    </div>
  );
}



