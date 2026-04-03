import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone/index';

window.URL.createObjectURL = () => '';

window.fail = (reason: any) => {
  throw new Error(reason + '');
};

window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

setupZoneTestEnv();
