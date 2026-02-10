/**
 * Efecto de fuegos artificiales usando canvas-confetti.
 * Varias explosiones desde diferentes posiciones con colores clásicos.
 */

import confetti from "canvas-confetti";

const FIREWORKS_COLORS = [
  "#fbbf24", // oro
  "#f97316", // naranja
  "#ef4444", // rojo
  "#22c55e", // verde
  "#ffffff", // blanco
  "#8b5cf6", // violeta
];

function burst(x: number, y: number) {
  confetti({
    particleCount: 80,
    spread: 360,
    origin: { x, y },
    startVelocity: 28,
    colors: FIREWORKS_COLORS,
    shapes: ["circle"],
    scalar: 1.1,
    gravity: 0.7,
    ticks: 280,
  });
}

/**
 * Dispara una secuencia de fuegos artificiales (~3 s): varias explosiones
 * en posiciones horizontales con retraso entre ellas; solo círculos.
 */
export function fireFireworks() {
  const positions = [0.25, 0.5, 0.75, 0.35, 0.65, 0.45];
  const y = 0.5;
  const intervalMs = 480;

  positions.forEach((x, i) => {
    setTimeout(() => burst(x, y), i * intervalMs);
  });
}
