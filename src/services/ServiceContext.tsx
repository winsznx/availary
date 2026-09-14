import { createContext, useContext, type ReactNode } from 'react';
import { createFixtureService } from './fixtureService';
import type { AvailabilityService } from './types';

const fixtureService = createFixtureService();

const ServiceContext = createContext<AvailabilityService>(fixtureService);

export function ServiceProvider({
  service,
  children,
}: {
  service?: AvailabilityService;
  children: ReactNode;
}) {
  return (
    <ServiceContext.Provider value={service ?? fixtureService}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useService(): AvailabilityService {
  return useContext(ServiceContext);
}
