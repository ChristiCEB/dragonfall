import { BountiesBoard } from "@/components/BountiesBoard";

export default function BountiesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-400">Bounties</h1>
      <p className="text-amber-200/80">
        Active bounties — claim in-game.
      </p>
      <BountiesBoard />
    </div>
  );
}
