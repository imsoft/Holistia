"use client";

import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
  size: number;
}

export function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Generar copos de nieve
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 5 + Math.random() * 10,
      animationDelay: Math.random() * 5,
      opacity: 0.3 + Math.random() * 0.7,
      size: 10 + Math.random() * 20,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(20px);
          }
        }
      `}</style>
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 9999 }}
        aria-hidden="true"
      >
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute text-white"
            style={{
              left: `${flake.left}%`,
              top: "-20px",
              opacity: flake.opacity,
              fontSize: `${flake.size}px`,
              animation: `snowfall ${flake.animationDuration}s linear infinite, sway 3s ease-in-out infinite`,
              animationDelay: `${flake.animationDelay}s`,
            }}
          >
            ❄
          </div>
        ))}
      </div>
    </>
  );
}
