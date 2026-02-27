import { HousesLeaderboard } from "@/components/HousesLeaderboard";

export default function HousesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Houses</h1>
      <p className="text-amber-200/80">
        Ranked by activity points and Drogons.
      </p>
      <HousesLeaderboard />
    </div>
  );
}
