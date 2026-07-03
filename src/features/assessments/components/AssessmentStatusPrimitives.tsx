import { statusTone } from "../utils/recruiterAssessmentViewModel";

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-${statusTone(value)}`}>{value}</span>;
}

export function HealthDot({ status }: { status: string }) {
  return (
    <span
      aria-label={`${status} status`}
      className={`status-dot status-dot-${statusTone(status)}`}
    />
  );
}

export function EmptyState({ label }: { label: string }) {
  return <p className="empty-state">{label}</p>;
}

export function MetricTile({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="assessment-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
