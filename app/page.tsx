import BirthdayModal from '@/components/BirthdayModal';
import Timeline from '@/components/Timeline';
import UploadForm from '@/components/UploadForm';
import { getBirthdayStatus } from '@/lib/birthday';

// Server-render on every request so memories added anywhere show up immediately.
export const dynamic = 'force-dynamic';

export default function Home() {
  // Birthday → celebrate (cake + fireworks modal). Otherwise straight to memories.
  const isBirthday = getBirthdayStatus().type === 'birthday';

  return (
    <main className="min-h-full">
      {isBirthday && <BirthdayModal />}

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
