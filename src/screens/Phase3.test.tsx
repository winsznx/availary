import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/renderApp';

test('account shows identity and can sign out', async () => {
  const user = userEvent.setup();
  renderApp('/settings');

  expect(await screen.findByText('Demo parent')).toBeInTheDocument();
  expect(screen.getByText('parent@example.com')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /delete account and data/i }),
  ).toBeDisabled();
  expect(screen.getByText(/demo mode/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /sign out/i }));
  expect(await screen.findByRole('link', { name: /sign in/i })).toBeInTheDocument();
});

test('account shows the current care search summary', async () => {
  renderApp('/settings');
  expect(await screen.findByText(/current care search/i)).toBeInTheDocument();
  expect(await screen.findByText(/November start/i)).toBeInTheDocument();
});

test('care need wizard validates inline', async () => {
  const user = userEvent.setup();
  renderApp('/start', { authed: false });

  const age = await screen.findByLabelText(/age at start/i);
  await user.clear(age);
  await user.type(age, '999');
  await user.click(screen.getByRole('button', { name: /continue/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/between 0 and 72/i);
});

test('care need wizard completes and moves to providers while logged out', async () => {
  const user = userEvent.setup();
  renderApp('/start', { authed: false });

  expect(await screen.findByText(/step 1 of 6/i)).toBeInTheDocument();
  for (let i = 0; i < 5; i += 1) {
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
  }
  await user.click(screen.getByRole('button', { name: /save and continue/i }));

  expect(
    await screen.findByRole('heading', { name: /^providers$/i }),
  ).toBeInTheDocument();
});

test('a provider can be added to the shortlist while logged out', async () => {
  const user = userEvent.setup();
  renderApp('/providers', { authed: false });

  await user.click(await screen.findByRole('button', { name: /add provider/i }));
  await user.type(screen.getByLabelText(/provider name/i), 'Meadow Lane Nursery');
  await user.type(screen.getByLabelText(/phone/i), '+441234567890');
  await user.click(screen.getByRole('button', { name: /^add provider$/i }));

  expect(await screen.findByText('Meadow Lane Nursery')).toBeInTheDocument();
});
