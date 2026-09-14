-- Availary schema + row level security.
-- Source draft: internal/db/schema.sql. The Worker writes with the service-role
-- key (which bypasses RLS); these policies are defense in depth for the
-- `authenticated` role, matching the draft's directive that authenticated users
-- may only read/write their own rows, and public demo fixtures never touch
-- these tables.

create extension if not exists pgcrypto;

create table if not exists care_needs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  age_at_start_months integer not null check (age_at_start_months between 0 and 180),
  desired_start_date date not null,
  flexibility_days integer not null default 0 check (flexibility_days between 0 and 90),
  weekdays text[] not null,
  schedule_mode text not null check (schedule_mode in ('full_time','part_time','flexible')),
  location_label text,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  phone_ciphertext text not null,
  phone_last4 text not null check (char_length(phone_last4) = 4),
  region text not null,
  locale text not null,
  timezone text,
  consent_basis text not null check (consent_basis in ('owned_test_number','explicit_provider_consent','production_legal_basis')),
  do_not_contact_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists care_need_providers (
  care_need_id uuid not null references care_needs(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (care_need_id, provider_id)
);

create table if not exists call_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  care_need_id uuid not null references care_needs(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  mode text not null check (mode in ('fixture','live')),
  request_hash text not null,
  idempotency_key text not null unique,
  preview_snapshot jsonb not null,
  request_body jsonb not null,
  approved_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists call_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  call_intent_id uuid not null unique references call_intents(id) on delete cascade,
  calle_call_id text unique,
  status text not null check (status in ('PREVIEW','CREATING','QUEUED','IN_PROGRESS','COMPLETED','FAILED','CANCELED','RECONCILE_REQUIRED')),
  raw_failure_code text,
  failure_message text,
  provider_task_completed boolean,
  provider_confidence_score numeric,
  provider_confidence_label text,
  provider_evidence jsonb,
  submitted_at timestamptz,
  completed_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists capacity_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  care_need_id uuid not null references care_needs(id) on delete cascade,
  provider_id uuid not null references providers(id) on delete cascade,
  call_run_id uuid not null unique references call_runs(id) on delete cascade,
  observed_at timestamptz not null,
  state text not null check (state in ('OPEN_NOW','EXPECTED_OPENING','PARTIAL_FIT','WAITLIST_ONLY','NO_FIT','NO_KNOWN_OPENING','UNKNOWN','REFUSED','UNREACHED')),
  age_band_fit text not null check (age_band_fit in ('yes','no','unknown')),
  schedule_fit text not null check (schedule_fit in ('full','partial','no','unknown')),
  full_time_fit text not null check (full_time_fit in ('yes','no','unknown')),
  waitlist_open text not null check (waitlist_open in ('yes','no','unknown')),
  tour_available text not null check (tour_available in ('yes','no','unknown')),
  earliest_opening_text text not null default '',
  days_available text[] not null default '{}',
  evidence_quality text not null check (evidence_quality in ('strong','partial','insufficient')),
  promotable boolean not null default false,
  fresh_until timestamptz not null,
  supersedes_observation_id uuid references capacity_observations(id),
  extracted_result jsonb,
  created_at timestamptz not null default now()
);

create table if not exists observation_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  observation_id uuid not null references capacity_observations(id) on delete cascade,
  field_name text not null,
  quote text not null,
  transcript_offset_seconds numeric,
  verified_in_transcript boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Row level security: authenticated users may only read/write their own rows.
-- The Worker's service-role key bypasses RLS for all real writes; these
-- policies only bound what a direct `authenticated` session could ever do.

alter table care_needs enable row level security;
alter table providers enable row level security;
alter table care_need_providers enable row level security;
alter table call_intents enable row level security;
alter table call_runs enable row level security;
alter table capacity_observations enable row level security;
alter table observation_evidence enable row level security;
alter table audit_events enable row level security;

create policy "care_needs_own_rows" on care_needs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "providers_own_rows" on providers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "care_need_providers_own_rows" on care_need_providers
  for all using (
    exists (
      select 1 from care_needs
      where care_needs.id = care_need_providers.care_need_id
        and care_needs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from care_needs
      where care_needs.id = care_need_providers.care_need_id
        and care_needs.user_id = auth.uid()
    )
  );

create policy "call_intents_own_rows" on call_intents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "call_runs_own_rows" on call_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "capacity_observations_own_rows" on capacity_observations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "observation_evidence_own_rows" on observation_evidence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "audit_events_own_rows" on audit_events
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy on audit_events for `authenticated`: audit
-- rows are written only by the Worker's service-role key, never by a client.
