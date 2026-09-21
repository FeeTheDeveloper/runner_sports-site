import { ScoreboardPanel } from "@/components/scoreboard/ScoreboardPanel";
import type { MlbInningRow } from "@/types";

export default function MlbBoxScore({ rows }: { rows: MlbInningRow[] }) {
  const inningCount = Math.max(9, ...rows.map((row) => row.innings.length));

  return (
    <ScoreboardPanel title="Game Score">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-text-subtle">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Team</th>
              {Array.from({ length: inningCount }).map((_, i) => (
                <th key={i} className="px-2 py-2 text-center text-[10px] font-bold">
                  {i + 1}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-[10px] font-bold text-text">R</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold text-text">H</th>
              <th className="px-3 py-2 text-center text-[10px] font-bold text-text">E</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team} className="border-b border-border last:border-none">
                <td className="px-3 py-3 text-base font-black text-text">{row.team}</td>
                {Array.from({ length: inningCount }).map((_, i) => (
                  <td key={i} className="px-2 py-3 text-center text-text-muted">
                    {row.innings[i] ?? "-"}
                  </td>
                ))}
                <td className="px-3 py-3 text-center text-lg font-black text-text">{row.runs}</td>
                <td className="px-3 py-3 text-center font-bold text-text">{row.hits}</td>
                <td className="px-3 py-3 text-center font-bold text-text">{row.errors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScoreboardPanel>
  );
}
