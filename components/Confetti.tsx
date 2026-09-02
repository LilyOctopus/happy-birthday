'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Firework bursts fired on the birthday page. Runs once on mount.
export default function Confetti() {
  useEffect(() => {
    // Opening burst
    confetti({
      particleCount: 140,
      spread: 360,
      startVelocity: 35,
      origin: { y: 0.55 },
      zIndex: 9999,
    });

    // Alternating bursts from both bottom corners
    let rounds = 0;
    const interval = window.setInterval(() => {
      const fromLeft = rounds % 2 === 0;
      confetti({
        particleCount: 60,
        angle: fromLeft ? 60 : 120,
        spread: 65,
        startVelocity: 50,
        origin: { x: fromLeft ? 0 : 1, y: 0.7 },
        zIndex: 9999,
      });
      rounds += 1;
      if (rounds >= 6) window.clearInterval(interval);
    }, 450);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
