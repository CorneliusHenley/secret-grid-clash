import { useState, useCallback } from "react";

export type UnitType = "attack" | "defense";
export type GamePhase = "planning" | "submitting" | "decrypting" | "resolved";

export interface Unit {
  id: number;
  position: number;
  type: UnitType;
  encrypted: boolean;
  player: 1 | 2;
  plannedMove?: number;
}

export interface GameState {
  phase: GamePhase;
  currentTurn: number;
  units: Unit[];
  selectedUnit: number | null;
}

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: "planning",
    currentTurn: 1,
    units: [
      { id: 1, position: 1, type: "attack", encrypted: false, player: 1 },
      { id: 2, position: 6, type: "defense", encrypted: false, player: 1 },
      { id: 3, position: 57, type: "attack", encrypted: false, player: 2 },
      { id: 4, position: 62, type: "defense", encrypted: false, player: 2 },
    ],
    selectedUnit: null,
  });

  const selectUnit = useCallback((unitId: number | null) => {
    setGameState(prev => ({ ...prev, selectedUnit: unitId }));
  }, []);

  const planMove = useCallback((unitId: number, targetPosition: number) => {
    setGameState(prev => ({
      ...prev,
      units: prev.units.map(unit =>
        unit.id === unitId
          ? { ...unit, plannedMove: targetPosition }
          : unit
      ),
    }));
  }, []);

  const submitMoves = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: "submitting" }));
    
    // Simulate encryption
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        phase: "decrypting",
        units: prev.units.map(unit => ({
          ...unit,
          encrypted: unit.plannedMove !== undefined,
        })),
      }));

      // Simulate decryption after 3 seconds
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          phase: "resolved",
          units: prev.units.map(unit => ({
            ...unit,
            position: unit.plannedMove ?? unit.position,
            encrypted: false,
          })),
        }));

        // Reset to planning phase for next turn
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            phase: "planning",
            currentTurn: prev.currentTurn + 1,
            units: prev.units.map(unit => ({
              ...unit,
              plannedMove: undefined,
            })),
            selectedUnit: null,
          }));
        }, 2000);
      }, 3000);
    }, 1500);
  }, []);

  const isValidMove = useCallback((fromPos: number, toPos: number, unitType: UnitType): boolean => {
    const fromRow = Math.floor(fromPos / 8);
    const fromCol = fromPos % 8;
    const toRow = Math.floor(toPos / 8);
    const toCol = toPos % 8;
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    const distance = Math.max(rowDiff, colDiff);
    
    // Attack units can move up to 2 squares, defense units 1 square
    const maxDistance = unitType === "attack" ? 2 : 1;
    
    return distance <= maxDistance && distance > 0;
  }, []);

  return {
    gameState,
    selectUnit,
    planMove,
    submitMoves,
    isValidMove,
  };
};
