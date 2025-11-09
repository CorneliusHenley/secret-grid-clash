import { Shield, Target, Lock, MoveRight } from "lucide-react";
import { useGameState } from "@/hooks/useGameState";
import { Button } from "./ui/button";
import { toast } from "sonner";

const TacticalGrid = () => {
  const { gameState, selectUnit, planMove, submitMoves, isValidMove } = useGameState();
  
  const handleCellClick = (position: number) => {
    if (gameState.phase !== "planning") return;

    const unit = gameState.units.find(u => u.position === position && u.player === 1);
    
    if (unit) {
      selectUnit(unit.id);
      toast.info(`Selected ${unit.type} unit`);
      return;
    }

    if (gameState.selectedUnit !== null) {
      const selectedUnit = gameState.units.find(u => u.id === gameState.selectedUnit);
      if (selectedUnit && isValidMove(selectedUnit.position, position, selectedUnit.type)) {
        planMove(gameState.selectedUnit, position);
        toast.success("Move planned - will encrypt on submit");
        selectUnit(null);
      } else {
        toast.error("Invalid move for this unit type");
      }
    }
  };

  const getPhaseLabel = () => {
    switch (gameState.phase) {
      case "planning": return "PLANNING";
      case "submitting": return "ENCRYPTING...";
      case "decrypting": return "DECRYPTING...";
      case "resolved": return "RESOLVED";
    }
  };

  const getPhaseColor = () => {
    switch (gameState.phase) {
      case "planning": return "text-primary";
      case "submitting": return "text-secondary";
      case "decrypting": return "text-secondary glitch";
      case "resolved": return "text-decrypted";
    }
  };

  const hasPlannedMoves = gameState.units.some(u => u.player === 1 && u.plannedMove !== undefined);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4 p-3 bg-card border border-border rounded">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Turn {gameState.currentTurn} Phase:</span>
          <span className={`font-bold encrypted-text ${getPhaseColor()}`}>{getPhaseLabel()}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-1 bg-background p-4 rounded border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
        {Array.from({ length: 64 }).map((_, i) => {
          const unit = gameState.units.find(u => u.position === i);
          const isSelected = unit && unit.id === gameState.selectedUnit;
          const isPlannedMove = gameState.units.some(u => u.plannedMove === i);
          const hasPlannedMoveHere = unit && unit.plannedMove !== undefined;
          
          return (
            <div
              key={i}
              onClick={() => handleCellClick(i)}
              className={`
                aspect-square border border-grid bg-card/20 
                flex items-center justify-center cursor-pointer
                transition-all duration-200 relative
                ${isSelected ? 'bg-primary/30 border-primary ring-2 ring-primary' : ''}
                ${isPlannedMove ? 'bg-secondary/20 border-secondary' : ''}
                ${unit ? 'bg-card hover:bg-card/80' : 'hover:bg-primary/10'}
              `}
            >
              {unit && (
                <div className={`relative ${unit.encrypted ? 'decrypt-pulse' : ''}`}>
                  {unit.encrypted ? (
                    <Lock className="w-5 h-5 text-encrypted drop-shadow-[0_0_10px_hsl(var(--encrypted))]" />
                  ) : unit.type === "attack" ? (
                    <Target className="w-5 h-5 text-decrypted drop-shadow-[0_0_10px_hsl(var(--decrypted))]" />
                  ) : (
                    <Shield className="w-5 h-5 text-decrypted drop-shadow-[0_0_10px_hsl(var(--decrypted))]" />
                  )}
                  {hasPlannedMoveHere && (
                    <MoveRight className="absolute -top-2 -right-2 w-3 h-3 text-secondary" />
                  )}
                </div>
              )}
              {isPlannedMove && !unit && (
                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-encrypted" />
            <span className="text-muted-foreground">Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-decrypted" />
            <span className="text-muted-foreground">Attack Unit</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-decrypted" />
            <span className="text-muted-foreground">Defense Unit</span>
          </div>
        </div>

        {gameState.phase === "planning" && (
          <Button
            onClick={submitMoves}
            disabled={!hasPlannedMoves}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            <Lock className="w-4 h-4 mr-2" />
            Submit Encrypted Moves
          </Button>
        )}

        {gameState.phase === "planning" && !hasPlannedMoves && (
          <p className="text-xs text-center text-muted-foreground">
            Click your units to select, then click a valid square to plan movement
          </p>
        )}
      </div>
    </div>
  );
};

export default TacticalGrid;
