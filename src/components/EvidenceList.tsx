import type { EvidenceItem } from '../domain/types';
import { formatDate } from '../domain/format';

const FIELD_LABEL: Record<string, string> = {
  availability_state: 'Availability',
  opening_window: 'Opening window',
  schedule_fit: 'Schedule fit',
  age_band_fit: 'Age band fit',
  full_time_fit: 'Full-time fit',
  waitlist: 'Waitlist',
  tour: 'Tour',
};

function fieldLabel(field: string): string {
  return (
    FIELD_LABEL[field] ??
    field.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
  );
}

/**
 * Evidence is provenance, not developer output: a concise quote, the claim it
 * supports, the source and the time it was observed. Never raw JSON or logs.
 */
export function EvidenceList({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return (
      <p className="muted">No supporting evidence recorded for this observation.</p>
    );
  }

  return (
    <ul className="evidence">
      {evidence.map((item) => (
        <li key={item.id} className="evidence__item">
          <div className="evidence__head">
            <span className="evidence__field">{fieldLabel(item.fieldName)}</span>
            <span
              className={`evidence__verified evidence__verified--${
                item.verifiedInTranscript ? 'yes' : 'no'
              }`}
            >
              {item.verifiedInTranscript ? 'Verified in call' : 'Not verified'}
            </span>
          </div>
          <blockquote className="evidence__quote">“{item.quote}”</blockquote>
          <p className="evidence__meta">Checked by phone · {formatDate(item.observedAt)}</p>
        </li>
      ))}
    </ul>
  );
}
