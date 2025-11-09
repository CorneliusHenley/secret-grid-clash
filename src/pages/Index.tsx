import Logo from "@/components/Logo";
import TacticalGrid from "@/components/TacticalGrid";
import WalletConnect from "@/components/WalletConnect";
import DecryptionTicker from "@/components/DecryptionTicker";
import HowItWorksDialog from "@/components/HowItWorksDialog";
import MatchCreationDialog from "@/components/MatchCreationDialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [inMatch, setInMatch] = useState(false);

  const handleStartMatch = () => {
    setShowMatchDialog(true);
  };

  const handleMatchCreated = () => {
    setInMatch(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <WalletConnect />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              Strategy <span className="text-secondary encrypted-text">Beyond</span> Sight
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Plan your tactics in encrypted turns. All moves decrypt simultaneously. 
              <br />
              Pure strategy, zero information advantage.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={handleStartMatch}
              >
                <Play className="w-5 h-5 mr-2" />
                {inMatch ? "New Match" : "Start Match"}
              </Button>
              <HowItWorksDialog />
            </div>
          </div>

          {/* Tactical Grid */}
          <TacticalGrid />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-background border border-border rounded">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Encrypted Turns</h3>
              <p className="text-sm text-muted-foreground">
                Plan your moves in secret. Blockchain verification ensures fairness.
              </p>
            </div>

            <div className="text-center p-6 bg-background border border-border rounded">
              <div className="w-12 h-12 mx-auto mb-4 bg-secondary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Simultaneous Reveal</h3>
              <p className="text-sm text-muted-foreground">
                All moves decrypt at once. No turn order advantage.
              </p>
            </div>

            <div className="text-center p-6 bg-background border border-border rounded">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Pure Strategy</h3>
              <p className="text-sm text-muted-foreground">
                Win through tactics and planning, not information asymmetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Ticker */}
      <footer className="mt-auto">
        <DecryptionTicker />
        <div className="bg-card border-t border-border py-6 px-4">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 EnigmaTactics. Powered by encrypted blockchain verification.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Discord
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      <MatchCreationDialog 
        open={showMatchDialog}
        onOpenChange={setShowMatchDialog}
        onMatchCreated={handleMatchCreated}
      />
    </div>
  );
};

export default Index;
