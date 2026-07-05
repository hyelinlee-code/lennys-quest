interface ProgressBarsProps {
  captured: number;
  mastered: number;
  total: number;
}

export function ProgressBars({ captured, mastered, total }: ProgressBarsProps) {
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100);
  return (
    <div className="flex flex-wrap gap-6">
      <div className="min-w-[190px] flex-1">
        <div className="mb-[5px] flex items-baseline justify-between">
          <span className="font-cinzel text-[11px] uppercase tracking-[1.5px] text-[#9c8a6a]">Captured</span>
          <span className="font-cinzel text-[13px] text-[#e7d6ad]">
            {captured} / {total}
          </span>
        </div>
        <div className="track">
          <div className="fill cap" style={{ width: `${pct(captured)}%` }} />
        </div>
      </div>
      <div className="min-w-[190px] flex-1">
        <div className="mb-[5px] flex items-baseline justify-between">
          <span className="font-cinzel text-[11px] uppercase tracking-[1.5px] text-[#9c8a6a]">Mastered</span>
          <span className="font-cinzel text-[13px] text-[#e7d6ad]">
            {mastered} / {total}
          </span>
        </div>
        <div className="track">
          <div className="fill mas" style={{ width: `${pct(mastered)}%` }} />
        </div>
      </div>
    </div>
  );
}
