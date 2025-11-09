import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Lock, Zap, Shield } from "lucide-react";

const HowItWorksDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="border-secondary text-secondary hover:bg-secondary/10"
        >
          <Info className="w-5 h-5 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">How EnigmaTactics Works</DialogTitle>
          <DialogDescription>
            Master the art of encrypted tactical warfare
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold mb-2">1. Plan Your Moves</h3>
              <p className="text-sm text-muted-foreground">
                During the planning phase, select your units and plan their moves on the 8x8 grid. 
                Your moves are immediately encrypted using blockchain technology. Your opponent cannot see your strategy.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold mb-2">2. Submit Encrypted Turns</h3>
              <p className="text-sm text-muted-foreground">
                Once ready, commit your moves using your Rainbow Wallet. Moves are cryptographically sealed 
                and stored on-chain. No one, including the system, can see the contents until decryption.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold mb-2">3. Simultaneous Reveal</h3>
              <p className="text-sm text-muted-foreground">
                When both players have submitted, the system decrypts all moves simultaneously. 
                There's no turn order advantage - both strategies execute at the exact same moment.
              </p>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded">
            <h3 className="font-bold mb-2">Unit Types</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <span className="text-decrypted">Attack Units</span> - Can move 2 squares and capture enemy positions</li>
              <li>• <span className="text-decrypted">Defense Units</span> - Move 1 square, protect territories</li>
              <li>• Victory condition: Control 5+ key grid positions or eliminate all enemy units</li>
            </ul>
          </div>

          <div className="p-4 bg-card border border-border rounded">
            <h3 className="font-bold mb-2">Why Encryption Matters</h3>
            <p className="text-sm text-muted-foreground">
              Traditional turn-based games give an advantage to whoever moves second. EnigmaTactics eliminates this 
              through cryptographic fairness - both players plan in secret, and all moves resolve simultaneously. 
              Pure strategy, zero information asymmetry.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksDialog;
