/** Canonical routes used by marketing CTAs. */
export const SIGN_IN_PATH = '/signin';
export const DEMO_PATH = '/demo';

/**
 * Resolver token for the Radar. The product surface resolves it through the
 * service adapter to the user's active care search, so navigation never encodes
 * a fixture care-need id.
 */
export const RADAR_ACTIVE_TOKEN = 'current';
export const RADAR_PATH = `/radar/${RADAR_ACTIVE_TOKEN}`;

/** The main app surface a user lands on after signing in. */
export const PRIMARY_APP_PATH = RADAR_PATH;
