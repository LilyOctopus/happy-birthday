import BirthdayModal from '@/components/BirthdayModal';
import Timeline from '@/components/Timeline';
import UploadForm from '@/components/UploadForm';
import { getBirthdayStatus } from '@/lib/birthday';

export default function Home() {
  const status = getBirthdayStatus();
  const isBirthday = status.type === 'birthday';

  return (
    <main className="min-h-full">
      {isBirthday && <BirthdayModal />}

      {!isBirthday && (
        <div className="bg-gradient-to-b from-[#fff1f2] to-[#fff7f0] px-6 pb-8 pt-8 text-center">
          <p className="inline-block rounded-full bg-white px-6 py-3 text-lg text-slate-700 shadow-sm ring-1 ring-pink-100">
            🎂 距离你的生日还有{' '}
            <span className="font-bold text-pink-500">{status.daysUntil}</span> 天
          </p>
        </div>
      )}

      <section id="memories" className="px-4 py-12 sm:px-6">
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
