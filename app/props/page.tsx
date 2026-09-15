import { getProps } from "@/lib/data/props";
import PropsExplorer from "@/app/props/PropsExplorer";
import { getRunnerAccess } from "@/lib/auth/access";
import Paywall from "@/components/auth/Paywall";

export const dynamic = "force-dynamic";

export default async function PropsPage({ searchParams }: { searchParams: Promise<{ gameId?: string }> }) {
  const access = await getRunnerAccess();
  if (!access.fullAccess) return <Paywall feature="Player prop intelligence" />;

  const { gameId } = await searchParams;
  const props = await getProps();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Player Prop Intelligence</h1>
        <p className="mt-1 text-sm text-text-muted">
          Live player markets with sportsbook lines, no-vig consensus probability, and verified player identity.
        </p>
      </div>
      <PropsExplorer props={props} initialGameId={gameId} />
    </div>
  );
}
