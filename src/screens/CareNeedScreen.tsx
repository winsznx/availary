import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  formatAgeAtStart,
  formatDate,
  formatScheduleMode,
  formatWeekdays,
} from '../domain/format';
import { WEEKDAY_LABEL } from '../domain/labels';
import type { ScheduleMode, Weekday } from '../domain/types';
import { useAsync } from '../hooks/useAsync';
import { useService } from '../services/ServiceContext';

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const STEP_TITLES = [
  'Age at start',
  'Start date',
  'Weekdays needed',
  'Care type',
  'Flexibility',
  'Your shortlist',
];

/** The PRD CareNeed.label has no wizard step; derive it from chosen values. */
function deriveLabel(age: string, start: string, weekdays: Weekday[], mode: ScheduleMode): string {
  const month = new Date(start).toLocaleDateString('en-GB', { month: 'long' });
  const days = formatWeekdays(weekdays) || 'No weekdays';
  return `${month} start · ${days} · ${formatScheduleMode(mode)} · ${formatAgeAtStart(
    Number(age) || 0,
  )}`;
}

export function CareNeedScreen() {
  const service = useService();
  const navigate = useNavigate();
  const providers = useAsync(() => service.listProviders(), [service]);

  const [step, setStep] = useState(0);
  const [age, setAge] = useState('11');
  const [startDate, setStartDate] = useState('2026-11-02');
  const [weekdays, setWeekdays] = useState<Weekday[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [mode, setMode] = useState<ScheduleMode>('FULL_TIME');
  const [flexibility, setFlexibility] = useState('14');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleWeekday = (day: Weekday) => {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day],
    );
  };

  const validate = (index: number): string[] => {
    const found: string[] = [];
    if (index === 0) {
      const months = Number(age);
      if (!age || Number.isNaN(months) || months < 0 || months > 72) {
        found.push('Enter an age at start between 0 and 72 months.');
      }
    }
    if (index === 1) {
      if (!startDate) found.push('Choose a desired start date.');
      else if (Number.isNaN(new Date(startDate).getTime())) {
        found.push('Enter a valid date.');
      }
    }
    if (index === 2 && weekdays.length === 0) {
      found.push('Choose at least one weekday.');
    }
    if (index === 4) {
      const days = Number(flexibility);
      if (!flexibility || Number.isNaN(days) || days < 0 || days > 90) {
        found.push('Enter flexibility between 0 and 90 days.');
      }
    }
    return found;
  };

  const next = () => {
    const found = validate(step);
    setErrors(found);
    if (found.length === 0) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const back = () => {
    setErrors([]);
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = async () => {
    const found = [0, 1, 2, 4].flatMap(validate);
    setErrors(found);
    if (found.length > 0) {
      setStep(found.length ? 0 : step);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await service.createCareNeed({
        label: deriveLabel(age, startDate, weekdays, mode),
        ageAtStartMonths: Number(age),
        desiredStartDate: startDate,
        flexibilityDays: Number(flexibility),
        weekdays,
        scheduleMode: mode,
      });
      navigate('/providers');
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'Could not save the care need.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen wizard">
      <div className="wizard__main">
        <p className="wizard__eyebrow">Care need</p>
        <h1 className="wizard__title">Plan the care you actually need.</h1>
        <p className="wizard__step-label">
          Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
        </p>

        <ol className="wizard__progress" aria-label="Progress">
          {STEP_TITLES.map((title, index) => (
            <li
              key={title}
              className={`wizard__tick${index === step ? ' wizard__tick--current' : ''}${
                index < step ? ' wizard__tick--done' : ''
              }`}
              aria-current={index === step ? 'step' : undefined}
            >
              <span className="sr-only">{title}</span>
            </li>
          ))}
        </ol>

        <div className="wizard__panel">
          {step === 0 ? (
            <div className="field">
              <label htmlFor="age">Age at start (months)</label>
              <input
                id="age"
                type="number"
                min={0}
                max={72}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-describedby={errors.length ? 'wizard-error' : undefined}
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="field">
              <label htmlFor="startDate">Desired start date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-describedby={errors.length ? 'wizard-error' : undefined}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <fieldset className="field field--fieldset">
              <legend>Weekdays needed</legend>
              <div className="weekday-picker">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`weekday${weekdays.includes(day) ? ' weekday--on' : ''}`}
                    aria-pressed={weekdays.includes(day)}
                    onClick={() => toggleWeekday(day)}
                  >
                    {WEEKDAY_LABEL[day]}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 3 ? (
            <fieldset className="field field--fieldset">
              <legend>Care type</legend>
              <div className="radio-col">
                {(
                  [
                    ['FULL_TIME', 'Full day'],
                    ['PART_TIME', 'Part day'],
                    ['FLEXIBLE', 'Flexible'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="radio-row">
                    <input
                      type="radio"
                      name="mode"
                      value={value}
                      checked={mode === value}
                      onChange={() => setMode(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 4 ? (
            <div className="field">
              <label htmlFor="flexibility">Flexibility (days either side)</label>
              <input
                id="flexibility"
                type="number"
                min={0}
                max={90}
                value={flexibility}
                onChange={(e) => setFlexibility(e.target.value)}
              />
            </div>
          ) : null}

          {step === 5 ? (
            <div className="field">
              <p className="wizard__shortlist-note">
                You will choose and manage providers next. These are the
                providers Availary will consider:
              </p>
              {providers.status === 'ready' ? (
                <ul className="plain-list">
                  {providers.data.map((provider) => (
                    <li key={provider.id}>{provider.displayName}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Loading providers…</p>
              )}
            </div>
          ) : null}
        </div>

        {errors.length > 0 ? (
          <ul id="wizard-error" className="error-note" role="alert">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
        {submitError ? (
          <p className="error-note" role="alert">
            {submitError}
          </p>
        ) : null}

        <div className="wizard__actions">
          {step > 0 ? (
            <button type="button" className="btn btn--ghost" onClick={back}>
              Back
            </button>
          ) : null}
          {step < STEP_TITLES.length - 1 ? (
            <button type="button" className="btn btn--primary" onClick={next}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void finish()}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save and continue'}
            </button>
          )}
        </div>
      </div>

      <aside className="wizard__summary" aria-label="Care need summary">
        <h2 className="wizard__summary-title">Your care need</h2>
        <dl className="facts">
          <div>
            <dt>Age at start</dt>
            <dd>{formatAgeAtStart(Number(age) || 0)}</dd>
          </div>
          <div>
            <dt>Desired start</dt>
            <dd>{startDate ? formatDate(startDate) : 'Not set'}</dd>
          </div>
          <div>
            <dt>Weekdays</dt>
            <dd>{formatWeekdays(weekdays) || 'None yet'}</dd>
          </div>
          <div>
            <dt>Care type</dt>
            <dd>{formatScheduleMode(mode)}</dd>
          </div>
          <div>
            <dt>Flexibility</dt>
            <dd>{Number(flexibility) || 0} days</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
