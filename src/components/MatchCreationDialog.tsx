import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MatchCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatchCreated: () => void;
}

const MatchCreationDialog = ({ open, onOpenChange, onMatchCreated }: MatchCreationDialogProps) => {
  const [matchId] = useState(() => `MATCH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCopyMatchId = () => {
    navigator.clipboard.writeText(matchId);
    setCopied(true);
    toast.success("Match ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateMatch = () => {
    setCreating(true);
    setTimeout(() => {
      toast.success("Match created! Waiting for opponent...");
      onMatchCreated();
      onOpenChange(false);
      setCreating(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Match</DialogTitle>
          <DialogDescription>
            Share the match ID with your opponent to start playing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="match-id">Match ID</Label>
            <div className="flex gap-2">
              <Input
                id="match-id"
                value={matchId}
                readOnly
                className="font-mono bg-muted"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyMatchId}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Players: 1/2</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Waiting for opponent to join...
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCreateMatch}
              className="flex-1 bg-primary hover:bg-primary/80"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Match"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchCreationDialog;
