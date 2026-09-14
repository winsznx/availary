import { screen, within } from '@testing-library/react';
import { renderApp } from '../test/renderApp';

test('marketing nav exposes the required destinations', async () => {
  renderApp('/');
  const nav = await screen.findByRole('navigation', { name: /marketing/i });
  for (const label of ['Product', 'How it works', 'Safety & privacy', 'Demo']) {
    expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
  }
});

test('CTAs route to the sign-in gate and the demo', async () => {
  renderApp('/');

  const shorts = await screen.findAllByRole('link', { name: /build my shortlist/i });
  expect(shorts.length).toBeGreaterThanOrEqual(2);
  for (const link of shorts) {
    expect(link).toHaveAttribute('href', '/signin');
  }

  const demos = screen.getAllByRole('link', { name: /see live demo/i });
  expect(demos.length).toBeGreaterThanOrEqual(2);
  for (const link of demos) {
    expect(link).toHaveAttribute('href', '/demo');
  }
});

test('footer carries legal, product, demo and contact destinations', async () => {
  renderApp('/');
  const footer = await screen.findByRole('contentinfo');

  expect(within(footer).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
    'href',
    '/privacy',
  );
  expect(within(footer).getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
    'href',
    '/terms',
  );
  expect(within(footer).getByRole('link', { name: /^demo$/i })).toHaveAttribute(
    'href',
    '/demo',
  );
  expect(within(footer).getByRole('link', { name: /github/i })).toBeInTheDocument();
  expect(within(footer).getByRole('link', { name: /sign in/i })).toHaveAttribute(
    'href',
    '/signin',
  );
  // Unapproved external links are clearly marked for replacement.
  expect(within(footer).getAllByText(/TBC/).length).toBeGreaterThan(0);
});

test('the landing tells the product story instead of a generic SaaS page', async () => {
  renderApp('/');

  expect(
    await screen.findByRole('heading', { name: /see when care opens up/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /a waitlist is not a timeline/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /an opening needs evidence/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /privacy by default/i })).toBeInTheDocument();
  expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/testimonial/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/bento/i)).not.toBeInTheDocument();
});

test('the hero preview reuses real product components and says it is illustrative', async () => {
  renderApp('/');
  expect(
    await screen.findByRole('img', { name: /illustrative availability radar/i }),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/illustrative demo data/i).length).toBeGreaterThan(0);
});
