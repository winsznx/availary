import { screen } from '@testing-library/react';
import { renderApp } from './test/renderApp';

test('renders the Availary navigation', async () => {
  renderApp('/');
  expect(
    (await screen.findAllByRole('link', { name: /availary home/i })).length,
  ).toBeGreaterThan(0);
});

test('demo opens a populated radar', async () => {
  renderApp('/demo');
  expect(
    await screen.findByRole('heading', { name: /your opening radar/i }),
  ).toBeInTheDocument();
  expect(screen.getByText('Little Sprouts')).toBeInTheDocument();
  expect(screen.getByText('Oak Tree')).toBeInTheDocument();
});

test('is clearly labelled as demo data', async () => {
  renderApp('/demo');
  expect((await screen.findAllByText(/demo data/i)).length).toBeGreaterThan(0);
});
