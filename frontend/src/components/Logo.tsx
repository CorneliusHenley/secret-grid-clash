import { Heart } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center">
          <Heart className="w-6 h-6 text-primary" />
        </div>
      </div>
      <span className="text-xl font-bold tracking-wider">
        PRIVATE<span className="text-secondary">DONATION</span>
      </span>
    </div>
  );
};

export default Logo;



