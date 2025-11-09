import { Button } from "@/components/ui/button";
import { Wallet, Shield } from "lucide-react";
import { useState } from "react";

const WalletConnect = () => {
  const [connected, setConnected] = useState(false);

  return (
    <div className="flex items-center gap-4">
      {connected ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-card border border-primary rounded">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm encrypted-text">0x742d...3f9a</span>
        </div>
      ) : (
        <Button
          onClick={() => setConnected(true)}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Rainbow Wallet
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
