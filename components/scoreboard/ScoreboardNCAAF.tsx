import FootballScoreboard from "@/components/scoreboard/football/FootballScoreboard";
import type { FootballScoreboardViewModel } from "@/types";

export default function ScoreboardNCAAF(viewModel: FootballScoreboardViewModel) {
  return <FootballScoreboard {...viewModel} />;
}
