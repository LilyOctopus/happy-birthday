'use client';

import { useMemo } from 'react';

// Pure CSS birthday cake: two tiers, icing drips, glowing candles + flickering flames.
export default function Cake() {
  // Candle heights alternate slightly for a lively look.
  const candles = useMemo(
    () => [
      { left: '18%', height: 56, color: '#f472b6' },
      { left: '50%', height: 68, color: '#fbbf24' },
      { left: '82%', height: 60, color: '#60a5fa' },
    ],
    []
  );

  return (
    <div className="cake-rise flex flex-col items-center" aria-label="生日蛋糕">
      {/* Top tier */}
      <div className="relative z-10 -mb-2 h-[64px] w-[210px] rounded-[10px] bg-gradient-to-b from-[#f9a8d4] to-[#f472b6]">
        {/* Icing drips */}
        <div className="absolute -top-[10px] left-0 right-0 flex justify-between px-2">
          {[0, 14, 28, 42, 56, 70, 84].map((w) => (
            <div
              key={w}
              className="h-[20px] w-[18px] rounded-b-full bg-[#fff1f2]"
              style={{ marginTop: w % 28 === 0 ? 0 : 4 }}
            />
          ))}
        </div>
        {/* Candles */}
        {candles.map((c, i) => (
          <div
            key={i}
            className="absolute bottom-full"
            style={{ left: c.left, transform: 'translateX(-50%)' }}
          >
            <div
              className="candle-glow relative w-[9px] rounded-[3px]"
              style={{ height: c.height, background: `linear-gradient(to bottom, #ffffff88, ${c.color})` }}
            >
              <div
                className="flame absolute -top-[16px] left-1/2 h-[14px] w-[10px] -translate-x-1/2 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
                style={{
                  background: 'radial-gradient(circle at 50% 80%, #fff7cc 0%, #fbbf24 45%, #f97316 100%)',
                }}
              />
            </div>
          </div>
        ))}
        {/* "30" badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-0.5 text-xl font-bold text-[#e11d48] shadow-sm">
          30
        </div>
      </div>

      {/* Bottom tier */}
      <div className="relative z-0 h-[76px] w-[290px] rounded-[12px] bg-gradient-to-b from-[#fda4af] to-[#fb7185]">
        {/* Icing drips */}
        <div className="absolute -top-[12px] left-0 right-0 flex justify-around px-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[22px] w-[20px] rounded-b-full bg-[#ffe4e6]"
              style={{ marginTop: i % 2 === 0 ? 0 : 5 }}
            />
          ))}
        </div>
        {/* Cherry dots */}
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-3 rounded-full bg-[#be123c]" />
          ))}
        </div>
      </div>

      {/* Plate */}
      <div className="h-[14px] w-[340px] rounded-[50%] bg-gradient-to-b from-[#f1f5f9] to-[#cbd5e1] shadow-lg" />

      <p className="cake-bob mt-8 text-2xl font-bold tracking-widest text-[#e11d48]">
        🎂 HAPPY BIRTHDAY 🎂
      </p>
    </div>
  );
}
