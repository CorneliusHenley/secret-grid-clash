import { Shield, Target, Lock } from "lucide-react";
import { useState } from "react";

const TacticalGrid = () => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  
  const units = [
    { id: 1, position: 12, type: "attack", encrypted: true },
    { id: 2, position: 28, type: "defense", encrypted: true },
    { id: 3, position: 45, type: "attack", encrypted: false },
    { id: 4, position: 57, type: "defense", encrypted: true },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-4 p-3 bg-card border border-border rounded">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Turn Phase:</span>
          <span className="text-primary font-bold encrypted-text">PLANNING</span>
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-1 bg-background p-4 rounded border border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.2)]">
        {Array.from({ length: 64 }).map((_, i) => {
          const unit = units.find(u => u.position === i);
          const isHovered = hoveredCell === i;
          
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredCell(i)}
              onMouseLeave={() => setHoveredCell(null)}
              className={`
                aspect-square border border-grid bg-card/20 
                flex items-center justify-center cursor-pointer
                transition-all duration-200
                ${isHovered ? 'bg-primary/20 border-primary' : ''}
                ${unit ? 'bg-card' : ''}
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
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4 justify-center text-xs">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-encrypted" />
          <span className="text-muted-foreground">Encrypted Move</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-decrypted" />
          <span className="text-muted-foreground">Decrypted Attack</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-decrypted" />
          <span className="text-muted-foreground">Decrypted Defense</span>
        </div>
      </div>
    </div>
  );
};

export default TacticalGrid;
