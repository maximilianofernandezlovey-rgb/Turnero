const STAGES = ["esperando", "proximo", "llamado", "en_atencion", "finalizado"] as const;

export default function ProgressSteps({ stage }: { stage: string }) {
  const currentIndex = STAGES.indexOf(stage as (typeof STAGES)[number]);
  return (
    <div className="progress-steps" role="progressbar" aria-valuenow={Math.max(0, currentIndex) + 1} aria-valuemin={1} aria-valuemax={STAGES.length}>
      {STAGES.map((s, i) => (
        <div key={s} className={`progress-step ${i < currentIndex ? "done" : ""} ${i === currentIndex ? "current" : ""}`.trim()} />
      ))}
    </div>
  );
}
