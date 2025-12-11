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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generar copos de nieve
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 8 + Math.random() * 12,
      animationDelay: Math.random() * 8,
      opacity: 0.4 + Math.random() * 0.6,
      size: 12 + Math.random() * 18,
    }));
    setSnowflakes(flakes);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <style>
        {`
          @keyframes snowfall {
            0% {
              transform: translateY(-10vh) rotate(0deg);
            }
            100% {
              transform: translateY(110vh) rotate(360deg);
            }
          }
        `}
      </style>
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 9999 }}
        aria-hidden="true"
      >
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute"
            style={{
              left: `${flake.left}%`,
              top: "-30px",
              opacity: flake.opacity,
              fontSize: `${flake.size}px`,
              color: "#a8d4f0",
              textShadow: "0 0 5px #fff, 0 0 10px #a8d4f0, 0 0 15px #87ceeb",
              animation: `snowfall ${flake.animationDuration}s linear infinite`,
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
