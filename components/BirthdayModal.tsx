'use client';

import { useState } from 'react';
import Cake from './Cake';
import Confetti from './Confetti';

// Birthday overlay: cake + fireworks only on the birthday itself, dismissible.
export default function BirthdayModal() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-[#fff1f2]/95 via-[#ffe4e6]/95 to-[#fff7f0]/95 px-6 py-10 backdrop-blur-sm">
      <Confetti />
      <Cake />
      <h1 className="mt-8 text-3xl font-bold text-slate-800 sm:text-4xl">生日快乐!🎉</h1>
      <p className="mt-3 max-w-md text-center text-lg text-slate-600">
        农历七月廿一,又一年的今天。
        <br />
        陪你走过的每段时光,都好好收着。
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-10 rounded-full bg-pink-500 px-8 py-3 font-medium text-white shadow-lg shadow-pink-200 transition hover:bg-pink-600"
      >
        看看我们的回忆 ↓
      </button>
    </div>
  );
}
