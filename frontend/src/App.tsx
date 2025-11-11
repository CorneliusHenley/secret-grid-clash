import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Logo from './components/Logo';
import DonationRoundList from './components/DonationRoundList';
import CreateRoundDialog from './components/CreateRoundDialog';
import DonateDialog from './components/DonateDialog';
import MatchingCommitDialog from './components/MatchingCommitDialog';
import { Button } from './components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Lock, Target, Users, TrendingUp } from 'lucide-react';

const App = () => {
  const { isConnected } = useAccount();
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [showDonate, setShowDonate] = useState(false);
  const [showMatching, setShowMatching] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {isConnected && (
              <Button
                onClick={() => setShowCreateRound(true)}
                className="bg-primary hover:bg-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Round
              </Button>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to access the Private Donation Matching platform
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rules and Instructions */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  How It Works
                </CardTitle>
                <CardDescription className="text-base">
                  Understanding the Private Donation Matching Platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Users className="w-5 h-5 text-primary" />
                      <span>1. Create a Round</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">
                      Anyone can create a donation round with a name, description, and duration. This establishes a fundraising campaign.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <Lock className="w-5 h-5 text-primary" />
                      <span>2. Make Donations</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">
                      Community members can donate ETH to any active round. All donation amounts are <strong>encrypted on-chain</strong> using Fully Homomorphic Encryption (FHE), ensuring complete privacy until the round is settled.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span>3. Commit Matching</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">
                      Matchers can commit to match community donations with two parameters:
                      <br />
                      • <strong>Maximum Matching Amount</strong>: The maximum they're willing to donate
                      <br />
                      • <strong>Minimum Trigger Amount</strong>: The community donation threshold that must be reached
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold text-lg">Matching Rules:</h3>
                  <div className="bg-card/50 rounded-lg p-4 space-y-2 text-sm">
                    <p>
                      <strong>Conditional Matching:</strong> When a round ends and is settled, the system checks each matching commitment:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                      <li>If <strong>Community Total ≥ Minimum Trigger Amount</strong>: The matcher contributes their <strong>Maximum Matching Amount</strong></li>
                      <li>If <strong>Community Total &lt; Minimum Trigger Amount</strong>: The matcher contributes <strong>0 ETH</strong></li>
                    </ul>
                    <p className="mt-2">
                      <strong>Final Total = Community Donations + Matching Donations</strong>
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Example Scenario:</h3>
                  <div className="bg-card/50 rounded-lg p-4 text-sm space-y-2">
                    <p>• Community donations: <strong>80 ETH</strong></p>
                    <p>• Matcher commits: Max <strong>50 ETH</strong>, Trigger at <strong>80 ETH</strong></p>
                    <p>• Result: Trigger met! Final total = <strong>80 + 50 = 130 ETH</strong></p>
                    <p className="text-muted-foreground mt-2">
                      If community only raised 70 ETH, the matcher would contribute 0 ETH (trigger not met).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Donation Rounds List */}
            <DonationRoundList
              onDonate={(roundId) => {
                setSelectedRoundId(roundId);
                setShowDonate(true);
              }}
              onCommitMatching={(roundId) => {
                setSelectedRoundId(roundId);
                setShowMatching(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Dialogs */}
      <CreateRoundDialog
        open={showCreateRound}
        onOpenChange={setShowCreateRound}
      />
      <DonateDialog
        open={showDonate}
        onOpenChange={setShowDonate}
        roundId={selectedRoundId}
      />
      <MatchingCommitDialog
        open={showMatching}
        onOpenChange={setShowMatching}
        roundId={selectedRoundId}
      />
    </div>
  );
};

export default App;



