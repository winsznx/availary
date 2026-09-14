/**
 * The live-call boundary, represented on the frontend.
 *
 * A real external call eventually requires BOTH a real authenticated session
 * and explicit user approval. Demo/fixture mode can never place a real call.
 * The frontend only represents this rule; the backend enforces it.
 */
export interface LiveCallContext {
  isFixture: boolean;
  signedIn: boolean;
}

export function canPlaceLiveCall(context: LiveCallContext): boolean {
  return !context.isFixture && context.signedIn;
}
