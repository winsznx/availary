import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Radar } from '../components/Radar';
import { DEMO_CLOCK_ISO } from '../fixtures/demo';
import { createFixtureService } from '../services/fixtureService';

const now = new Date(DEMO_CLOCK_ISO);

function renderRadar(radar: Awaited<ReturnType<ReturnType<typeof createFixtureService>['getRadar']>>) {
  return render(
    <MemoryRouter>
      <Radar radar={radar} now={now} />
    </MemoryRouter>,
  );
}

test('unknown is never rendered as unavailable', async () => {
  const radar = await createFixtureService().getRadar('need-demo');
  renderRadar(radar);
  expect(screen.getByText('Unknown')).toBeInTheDocument();
  expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
});

test('every provider row carries a written state label', async () => {
  const radar = await createFixtureService().getRadar('need-demo');
  renderRadar(radar);
  for (const label of ['Expected opening', 'Partial fit', 'Open now', 'Unknown']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

test('a stale observation prompts a manual recheck', async () => {
  const radar = await createFixtureService().getRadar('need-demo');
  renderRadar(radar);
  expect(screen.getAllByText(/needs recheck/i).length).toBeGreaterThan(0);
});

test('provider identity links to the real provider route', async () => {
  const radar = await createFixtureService().getRadar('need-demo');
  renderRadar(radar);
  expect(
    screen.getByRole('link', { name: 'Oak Tree' }),
  ).toHaveAttribute('href', '/providers/oak-tree?need=need-demo');
});
