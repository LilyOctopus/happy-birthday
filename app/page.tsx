import Cake from '@/components/Cake';
import Confetti from '@/components/Confetti';
import Timeline from '@/components/Timeline';
import UploadForm from '@/components/UploadForm';
import { getBirthdayStatus } from '@/lib/birthday';

export default function Home() {
  const status = getBirthdayStatus();
  const isBirthday = status.type === 'birthday';

  return (
    <main className="min-h-full">
      {isBirthday ? (
        <section className="flex flex-col items-center bg-gradient-to-b from-[#fff1f2] via-[#ffe4e6] to-[#fff7f0] px-6 pb-20 pt-16 text-center">
          <Confetti />
          <Cake />
          <h1 className="mt-10 text-4xl font-bold text-slate-800 sm:text-5xl">
            生日快乐!🎉
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600">
            农历七月廿一,又一年的今天。
            <br />
            陪你走过这些年,都是最珍贵的时光。
          </p>
          <a
            href="#memories"
            className="mt-10 rounded-full bg-pink-500 px-8 py-3 font-medium text-white shadow-lg shadow-pink-200 transition hover:bg-pink-600"
          >
            去看看我们的回忆 ↓
          </a>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-[#fff1f2] to-[#fff7f0] px-6 pb-12 pt-10 text-center">
          <p className="inline-block rounded-full bg-white px-6 py-3 text-lg text-slate-700 shadow-sm ring-1 ring-pink-100">
            🎂 距离你的生日还有 <span className="font-bold text-pink-500">{status.daysUntil}</span> 天
          </p>
        </section>
      )}

      <section id="memories" className="px-4 py-14 sm:px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-800">我们的回忆</h2>
          <p className="mt-3 text-slate-500">
            一起走过的日子,一件一件记下来。越来越多,越走越近。
          </p>
        </div>

        <UploadForm />
        <Timeline />
      </section>
    </main>
  );
}
