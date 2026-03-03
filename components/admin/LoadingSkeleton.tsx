"use client";

type Props = {
  className?: string;
  lines?: number;
};

export function LoadingSkeleton({ className = "", lines = 5 }: Props) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded bg-amber-900/30"
          style={{ width: i === lines - 1 && lines > 1 ? "70%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden p-0 animate-pulse">
      <table className="w-full">
        <thead>
          <tr className="border-b border-amber-800/50 bg-stone-800/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3">
                <div className="h-4 rounded bg-amber-800/40 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri} className="border-b border-amber-900/30">
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci} className="p-3">
                  <div className="h-4 rounded bg-amber-900/30 w-full max-w-[120px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
