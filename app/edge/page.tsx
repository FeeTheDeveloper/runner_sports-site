import { getEdges } from "@/lib/data/edges";
import EdgeBoard from "@/app/edge/EdgeBoard";
import { getRunnerAccess } from "@/lib/auth/access";
import Paywall from "@/components/auth/Paywall";

export const dynamic = "force-dynamic";

export default async function EdgePage() {
  const access = await getRunnerAccess();
  if (!access.fullAccess) return <Paywall feature="The Runner Edge board" />;

  const edges = await getEdges();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Runner Edge Board</h1>
        <p className="mt-1 text-sm text-text-muted">
          Ranked by no-vig consensus across fresh books quoting the same market and line, compared against one
          book&apos;s own price. Edge percentage reflects that consensus probability minus the book&apos;s implied
          probability. Quotes older than 20 minutes are suppressed. Book depth describes coverage; predictive confidence and betting risk are unassessed. Executable prices are unverified.
        </p>
      </div>
      <EdgeBoard edges={edges} />
    </div>
  );
}
