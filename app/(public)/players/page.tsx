import { PlayersLeaderboard } from "@/components/PlayersLeaderboard";

export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Players Leaderboard</h1>
      <p className="text-amber-200/80">
        Ranked by Drogons. Click a player for their profile.
      </p>
      <PlayersLeaderboard />
    </div>
  );
}
