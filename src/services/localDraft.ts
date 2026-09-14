/**
 * Pre-auth product state. The documented flow is "build the care need and
 * shortlist freely, sign in only to save" — `/start` and `/providers` are
 * public routes (see `src/App.tsx`). Nothing here ever reaches Supabase
 * until `realService` observes a session and syncs it once.
 *
 * IDs are real client-generated UUIDs (not `draft-*` placeholders) so that
 * when the sync happens, the backend can insert rows with these exact ids —
 * nothing the UI already navigated to (`/providers/:id`, `/radar/:id`) needs
 * to change. The id itself is what makes the sync idempotent: re-posting the
 * same draft after a retry upserts the same row instead of duplicating it.
 */
import type { CareNeed, Provider } from '../domain/types';

const STORAGE_KEY = 'availary.draft.v1';

export interface DraftProvider extends Provider {
  /** Full E.164 number, held only in the browser until sync, then discarded. */
  phone: string;
}

export interface DraftState {
  careNeed: CareNeed | null;
  providers: DraftProvider[];
}

function readStorage(): DraftState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { careNeed: null, providers: [] };
    const parsed = JSON.parse(raw) as DraftState;
    return { careNeed: parsed.careNeed ?? null, providers: parsed.providers ?? [] };
  } catch {
    // Private browsing / blocked storage: behave as if there is no draft yet.
    return { careNeed: null, providers: [] };
  }
}

function writeStorage(state: DraftState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort only; the in-memory caller still has the value this turn.
  }
}

export function getDraft(): DraftState {
  return readStorage();
}

export function setDraftCareNeed(careNeed: CareNeed): void {
  const state = readStorage();
  state.careNeed = careNeed;
  writeStorage(state);
}

export function addDraftProvider(provider: DraftProvider): void {
  const state = readStorage();
  state.providers.push(provider);
  writeStorage(state);
}

export function updateDraftProviderDoNotContact(providerId: string, value: boolean): void {
  const state = readStorage();
  const provider = state.providers.find((p) => p.id === providerId);
  if (provider) provider.doNotContact = value;
  writeStorage(state);
}

export function hasDraft(): boolean {
  const state = readStorage();
  return state.careNeed !== null;
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
