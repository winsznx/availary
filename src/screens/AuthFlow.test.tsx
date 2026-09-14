import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { canPlaceLiveCall } from '../domain/liveCalls';
import { renderApp } from '../test/renderApp';

test('1. landing primary CTA routes to the sign-in gate', async () => {
  const user = userEvent.setup();
  renderApp('/', { authed: false });

  const ctas = await screen.findAllByRole('link', { name: /build my shortlist/i });
  await user.click(ctas[0]);

  expect(
    await screen.findByRole('heading', { name: /save your care search/i }),
  ).toBeInTheDocument();
});

test('1b. care need stays reachable while logged out', async () => {
  renderApp('/start', { authed: false });
  expect(
    await screen.findByRole('heading', { name: /plan the care you actually need/i }),
  ).toBeInTheDocument();
});

test('2. care need → providers works while logged out', async () => {
  const user = userEvent.setup();
  renderApp('/start', { authed: false });

  for (let i = 0; i < 5; i += 1) {
    await user.click(await screen.findByRole('button', { name: /^continue$/i }));
  }
  await user.click(screen.getByRole('button', { name: /save and continue/i }));

  expect(
    await screen.findByRole('heading', { name: /^providers$/i }),
  ).toBeInTheDocument();
});

test('3. saving from providers routes to sign in', async () => {
  const user = userEvent.setup();
  renderApp('/providers', { authed: false });

  await user.click(
    await screen.findByRole('button', { name: /save and open my radar/i }),
  );

  expect(
    await screen.findByRole('heading', { name: /save your care search/i }),
  ).toBeInTheDocument();
});

test('4. mock sign-in continues into the main app (Radar)', async () => {
  const user = userEvent.setup();
  renderApp('/radar/need-demo', { authed: false });

  expect(
    await screen.findByRole('heading', { name: /save your care search/i }),
  ).toBeInTheDocument();

  await user.click(
    screen.getByRole('button', { name: /continue with google/i }),
  );

  expect(
    await screen.findByRole('heading', { name: /your opening radar/i }),
  ).toBeInTheDocument();
});

test('5. /demo works while logged out', async () => {
  renderApp('/demo', { authed: false });
  expect(
    await screen.findByRole('heading', { name: /your opening radar/i }),
  ).toBeInTheDocument();
});

test('6. demo can never place a real call', async () => {
  // The live-call boundary: real calls need a real session on a real deployment.
  expect(canPlaceLiveCall({ isFixture: true, signedIn: true })).toBe(false);
  expect(canPlaceLiveCall({ isFixture: false, signedIn: false })).toBe(false);
  expect(canPlaceLiveCall({ isFixture: false, signedIn: true })).toBe(true);

  renderApp('/demo', { authed: false });
  expect((await screen.findAllByText(/demo data/i)).length).toBeGreaterThan(0);
});

test('7. an expired session shows an intentional sign-in-again state', async () => {
  renderApp('/radar/need-demo', { authed: false, failGetSession: 'expired' });

  expect(
    await screen.findByRole('heading', { name: /your session expired/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /sign in again/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /continue in the demo/i })).toBeInTheDocument();
});

test('7b. an unavailable session is also handled without breaking the app', async () => {
  renderApp('/settings', { authed: false, failGetSession: 'unavailable' });

  expect(
    await screen.findByRole('heading', { name: /we could not confirm your session/i }),
  ).toBeInTheDocument();
});

test('8. sign-in does not claim a finalised provider implementation', async () => {
  renderApp('/signin', { authed: false });

  expect(
    await screen.findByRole('heading', { name: /save your care search/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /continue with email/i })).toBeInTheDocument();
  expect(screen.getByText(/sign-in is not finalised yet/i)).toBeInTheDocument();
  expect(screen.queryByText(/supabase/i)).not.toBeInTheDocument();
  expect(document.querySelector('input[type="password"]')).toBeNull();
});
