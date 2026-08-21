type Accent = "default" | "success" | "warning" | "danger";

export default function MetricCard({ label, value, accent = "default" }: { label: string; value: string | number; accent?: Accent }) {
  const accentClass = accent === "default" ? "metric-card-accent" : `metric-card-accent-${accent}`;
  return (
    <div className={`metric-card ${accentClass}`}>
      <span className="metric-card-label">{label}</span>
      <span className="metric-card-value">{value}</span>
    </div>
  );
}
