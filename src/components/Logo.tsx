import { Lock } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-primary/30 border border-primary/50"
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <Lock className="absolute inset-0 m-auto w-5 h-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]" />
      </div>
      <span className="text-xl font-bold tracking-wider">
        ENIGMA<span className="text-secondary">TACTICS</span>
      </span>
    </div>
  );
};

export default Logo;
