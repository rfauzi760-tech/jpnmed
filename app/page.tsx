import { TodayDashboard } from '@/components/dashboard/today';
import { PageBody } from '@/components/shell/app-shell';
import { buildCardStubs } from '@/lib/content/study';

export default function HomePage() {
  // The dashboard only composes a queue, so it receives the minimal card
  // projection rather than the full deck payload.
  const cards = buildCardStubs();
  return (
    <PageBody>
      <TodayDashboard cards={cards} />
    </PageBody>
  );
}
