import type { Game } from "@/types";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  return (
    <div>
      <p>{game.homeTeam} vs {game.awayTeam}</p>
      <p>{game.status}</p>
    </div>
  );
}
