import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/renderApp';

test('a recheck always passes through the call preview first', async () => {
  const user = userEvent.setup();
  renderApp('/providers/oak-tree?need=need-demo');

  await user.click(
    await screen.findByRole('button', { name: /recheck availability/i }),
  );

  expect(
    await screen.findByRole('button', { name: /place one call/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/one real external phone call/i)).toBeInTheDocument();
  expect(screen.getByText(/never shared/i)).toBeInTheDocument();
  expect(screen.getByText(/explicit provider consent/i)).toBeInTheDocument();
});

test('placing one call finishes with an observation and never claims OPEN now', async () => {
  const user = userEvent.setup();
  renderApp('/providers/oak-tree?need=need-demo');

  await user.click(
    await screen.findByRole('button', { name: /recheck availability/i }),
  );
  await user.click(
    await screen.findByRole('button', { name: /place one call/i }),
  );

  expect(await screen.findByText(/observation ready/i)).toBeInTheDocument();
  expect(screen.queryByText(/^open now$/i)).not.toBeInTheDocument();
  expect(screen.getByText(/one call only/i)).toBeInTheDocument();
});

test('an unreached call is shown truthfully, not as unavailable', async () => {
  const user = userEvent.setup();
  renderApp('/providers/bright-house?need=need-demo');

  await user.click(
    await screen.findByRole('button', { name: /recheck availability/i }),
  );
  await user.click(
    await screen.findByRole('button', { name: /place one call/i }),
  );

  expect(await screen.findByText(/^unreached$/i)).toBeInTheDocument();
  expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
});

test('provider detail shows compatibility, history and evidence', async () => {
  renderApp('/providers/little-sprouts?need=need-demo');

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText(/observation history/i)).toBeInTheDocument();
  expect(screen.getAllByText(/waitlist only/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/expected opening/i).length).toBeGreaterThan(0);
  expect((await screen.findAllByText(/checked by phone/i)).length).toBeGreaterThan(0);
});

test('the exact call route is linkable and refresh-safe', async () => {
  const user = userEvent.setup();
  renderApp('/providers/oak-tree?need=need-demo');
  await user.click(
    await screen.findByRole('button', { name: /recheck availability/i }),
  );
  // The preview lives at a real /calls/:id route.
  expect(await screen.findByRole('button', { name: /place one call/i })).toBeInTheDocument();
  expect(screen.getByText(/review the exact availability question/i)).toBeInTheDocument();
});
