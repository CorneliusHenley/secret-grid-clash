const DecryptionTicker = () => {
  const matches = [
    { id: "M-2847", status: "DECRYPTING", progress: 67 },
    { id: "M-2846", status: "COMPLETED", winner: "PLAYER_1" },
    { id: "M-2845", status: "COMPLETED", winner: "PLAYER_2" },
    { id: "M-2844", status: "LIVE", turn: 12 },
  ];

  return (
    <div className="overflow-hidden bg-card border-t border-border py-3">
      <div className="flex gap-8 ticker-scroll">
        {[...matches, ...matches, ...matches].map((match, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 whitespace-nowrap px-4"
          >
            <span className="text-muted-foreground text-sm">Match {match.id}:</span>
            <span
              className={`text-sm font-bold ${
                match.status === "DECRYPTING"
                  ? "text-secondary encrypted-text"
                  : match.status === "COMPLETED"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {match.status}
            </span>
            {match.status === "DECRYPTING" && (
              <span className="text-xs text-muted-foreground">
                {match.progress}%
              </span>
            )}
            {match.status === "COMPLETED" && (
              <span className="text-xs text-primary">
                Winner: {match.winner}
              </span>
            )}
            {match.status === "LIVE" && (
              <span className="text-xs text-muted-foreground">
                Turn {match.turn}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DecryptionTicker;
